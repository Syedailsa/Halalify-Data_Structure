// =============================================================================
// QDRANT PIPELINE
// =============================================================================
//
// TWO COLLECTIONS:
//   1. halal_products  — canonical_products.json (Types 1, 2, 4, 5)
//   2. halal_enumbers  — e_numbers_lookup.json   (Type 3 only)
//
// QUERY TYPES:
//   Type 1: Company query       → fuzzy match on companies array
//   Type 2: Brand + product     → semantic vector search
//   Type 3: E-number / additive → direct lookup in halal_enumbers collection
//   Type 4: Category browse     → filter on category_l1
//   Type 5: Not in data         → score < 0.82 → trigger web search
//
// SCORE THRESHOLD: 0.82 → found | < 0.82 → not verified
// =============================================================================

import { QdrantClient } from "@qdrant/js-client-rest";
import { distance } from "fastest-levenshtein";
import fs from "fs";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvFile } from "process";

loadEnvFile(path.join(process.cwd(), "./.env.local")); 

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const QDRANT_URL      = process.env.QDRANT_URL; 
console.log(`Qdrant URL: ${QDRANT_URL}`);
const QDRANT_API_KEY  = process.env.QDRANT_API_KEY;
const FIREWORKS_API_KEY  = process.env.FIREWORKS_API_KEY; // set in environment
const EMBED_MODEL     = "accounts/fireworks/models/qwen3-embedding-8b";
const VECTOR_SIZE     = 4096;                        // text-embedding-3-small dims
const BATCH_SIZE      = 100;                         // embed N records at a time

const COLLECTION_PRODUCTS = "halal_products";
const COLLECTION_ENUMBERS = "halal_enumbers";

const client = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });

// ---------------------------------------------------------------------------
// EMBEDDING HELPER
// Calls OpenAI text-embedding-3-small for a batch of strings.
// Returns array of float vectors in the same order as input.
// ---------------------------------------------------------------------------
async function embedBatch(texts) {
  const response = await fetch("https://api.fireworks.ai/inference/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FIREWORKS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI embedding error: ${err}`);
  }

  const data = await response.json();
  // data.data is sorted by index, so order is preserved
  return data.data.map((d) => d.embedding);
}

// ---------------------------------------------------------------------------
// BUILD EMBEDDING STRING
// The embedding string gives the model semantic context before it encodes.
// Format: "[L1_Category] product_name company1 company2"
// For E-numbers: "[Additive] E102 Tartrazine colouring synthetic"
// ---------------------------------------------------------------------------
function buildEmbedString(record) {
  const category = record.category_l1 || "Uncategorised";
  const name     = record.norm_name   || "";
  const companies = (record.companies || []).join(" ");
  const uses      = (record.typical_uses || []).slice(0, 5).join(" "); // first 5 uses only
  return `[${category}] ${name} ${companies} ${uses}`.trim().replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// CREATE COLLECTIONS
// If collection already exists, skip creation (idempotent).
// We use cosine similarity — standard for text embeddings.
// ---------------------------------------------------------------------------
async function createCollections() {
  const existing = await client.getCollections();
  const names = existing.collections.map((c) => c.name);

  if (!names.includes(COLLECTION_PRODUCTS)) {
    await client.createCollection(COLLECTION_PRODUCTS, {
      vectors: { size: VECTOR_SIZE, distance: "Cosine" },
    });

    // Payload indexes for fast filtering in Qdrant
    await client.createPayloadIndex(COLLECTION_PRODUCTS, {
      field_name: "category_l1",
      field_schema: "keyword",
    });
    await client.createPayloadIndex(COLLECTION_PRODUCTS, {
      field_name: "halal_status",
      field_schema: "keyword",
    });
    await client.createPayloadIndex(COLLECTION_PRODUCTS, {
      field_name: "cert_bodies",
      field_schema: "keyword",
    });

    console.log(`  ✅  Created collection: ${COLLECTION_PRODUCTS}`);
  } else {
    console.log(`  ⏭️   Collection already exists: ${COLLECTION_PRODUCTS}`);
  }

  if (!names.includes(COLLECTION_ENUMBERS)) {
    await client.createCollection(COLLECTION_ENUMBERS, {
      vectors: { size: VECTOR_SIZE, distance: "Cosine" },
    });

    await client.createPayloadIndex(COLLECTION_ENUMBERS, {
      field_name: "halal_status",
      field_schema: "keyword",
    });
    await client.createPayloadIndex(COLLECTION_ENUMBERS, {
      field_name: "e_code",
      field_schema: "keyword",
    });

    console.log(`  ✅  Created collection: ${COLLECTION_ENUMBERS}`);
  } else {
    console.log(`  ⏭️   Collection already exists: ${COLLECTION_ENUMBERS}`);
  }
}

// ---------------------------------------------------------------------------
// UPLOAD RECORDS IN BATCHES
// We chunk records into BATCH_SIZE groups to avoid OpenAI rate limits and
// Qdrant payload size limits.
// ---------------------------------------------------------------------------
async function uploadCollection(collectionName, records, isENumbers = false) {
  console.log(`\n  Uploading ${records.length} records to [${collectionName}]...`);

  let uploaded = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const embedStrings = batch.map(buildEmbedString);

    // --- STEP 1: GET EMBEDDINGS (with Retry) ---
    let vectors;
    let embedSuccess = false;
    while (!embedSuccess) {
      try {
        vectors = await embedBatch(embedStrings);
        embedSuccess = true;
      } catch (err) {
        console.log(`\n ⚠️ Embedding failed. Waiting 3s...`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    // --- STEP 2: PREPARE POINTS ---
    const points = batch.map((record, j) => {
      const payload = { ...record };
      if (isENumbers) {
        const match = (record.norm_name || "").match(/^(e\d+[a-z(),-]*)/i);
        payload.e_code = match ? match[1].toUpperCase() : null;
      }
      return {
        id: parseInt(record.canonical_id.replace("halal_", ""), 10),
        vector: vectors[j],
        payload,
      };
    });

    // --- STEP 3: UPSERT TO QDRANT (with Retry) ---
    let success = false;
    while (!success) {
      try {
        // ONLY call upsert here inside the protection loop
        await client.upsert(collectionName, { points });
        success = true;
      } catch (err) {
        if (err.status === 503 || err.status === 502 || err.status === 429) {
          console.log(`\n 🧊 Server overloaded (${err.status}). Waiting 5 seconds...`);
          await new Promise(r => setTimeout(r, 5000));
        } else {
          throw err; 
        }
      }
    }

    uploaded += batch.length;
    process.stdout.write(`\r  Progress: ${uploaded}/${records.length}`);

    // Standard delay between batches to keep the connection stable
    if (i + BATCH_SIZE < records.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.log(`\n  ✅ Done uploading to [${collectionName}]`);
}

// =============================================================================
// MAIN — Upload then run sample queries
// =============================================================================
async function main() {

  // Load JSON files
  const outDir   = path.join(__dirname, "output");
  const products = JSON.parse(fs.readFileSync(path.join(outDir, "canonical_products.json"), "utf8"));
  // const productsRaw = fs.readFileSync(path.join(outDir, "canonical_products.json"), "utf8");
  // // This regex removes control characters (0-31) except for common ones like newline/tab
  // // But for JSON.parse, we actually want to replace raw internal newlines with spaces.
  // const sanitizedProducts = productsRaw.replace(/[\x00-\x1F\x7F-\x9F]/g, " "); 
  // const products = JSON.parse(sanitizedProducts);
  const enumbers = JSON.parse(fs.readFileSync(path.join(outDir, "e_numbers_lookup.json"),   "utf8"));

  console.log("\n🔗  Connecting to Qdrant...");
  console.log(`    URL: ${QDRANT_URL}`);

  console.log("\n📁  Creating collections...\n");
  await createCollections();

  console.log("\n📤  Uploading data...");
  await uploadCollection(COLLECTION_PRODUCTS, products, false);
  await uploadCollection(COLLECTION_ENUMBERS, enumbers, true);

  console.log(`
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ✅  Upload complete

        Collections:
        ${COLLECTION_PRODUCTS}: ${products.length} records
        ${COLLECTION_ENUMBERS}: ${enumbers.length} records

        Run queries with:
        node qdrant_pipeline.js query
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
} 

main().catch(console.error);