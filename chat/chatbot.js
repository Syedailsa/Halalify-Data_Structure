// /**
//  * =============================================================================
//  * HALAL PRODUCT CLI CHATBOT
//  * =============================================================================
//  * Run:  node chatbot.js
//  * =============================================================================
//  */

// import { QdrantClient }  from "@qdrant/js-client-rest";
// import { distance }      from "fastest-levenshtein";
// import readline          from "readline";
// import fs                from "fs";
// import path              from "path";
// import { fileURLToPath } from "url";
// import dotenv            from "dotenv";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dotenv.config({ path: path.join(__dirname, ".env.local") });

// // =============================================================================
// // CONFIG
// // =============================================================================
// const QDRANT_URL         = process.env.QDRANT_URL  ;
// const QDRANT_API_KEY     = process.env.QDRANT_API_KEY    || "";
// const FIREWORKS_API_KEY  = process.env.FIREWORKS_API_KEY || "";
// const GROQ_API_KEY       = process.env.GROQ_API_KEY      || "";
// const GOOGLE_API_KEY     = process.env.GOOGLE_API_KEY || "";
// const GOOGLE_CX          = process.env.GOOGLE_CX_ID  || "";
 
// const EMBED_MODEL        = "accounts/fireworks/models/qwen3-embedding-8b";
// const VECTOR_SIZE        = 4096;
// const SCORE_THRESHOLD    = 0.82;
// const TOP_K              = 8;

// const COLLECTION_PRODUCTS = "halal_products";
// const COLLECTION_ENUMBERS = "halal_enumbers";

// const PRODUCTS_PATH = path.join(__dirname, "../halal-normalizer/output/canonical_products.json");
// const ENUMBERS_PATH = path.join(__dirname, "../halal-normalizer/output/e_numbers_lookup.json");

// // =============================================================================
// // CLIENTS
// // =============================================================================
// const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY, checkCompatibility: false });

// // =============================================================================
// // STARTUP — load company list into memory
// // =============================================================================
// const knownCompanies = [];   // [{raw, norm}]

// function loadCompanyList() {
//   if (!fs.existsSync(PRODUCTS_PATH)) return;
//   const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf8"));
//   const seen = new Set();
//   for (const r of products) {
//     for (const c of r.companies || []) {
//       if (c && !seen.has(c.toLowerCase())) {
//         seen.add(c.toLowerCase());
//         knownCompanies.push({ raw: c, norm: c.toLowerCase() });
//       }
//     }
//   }
// }

// // =============================================================================
// // STAGE 1 — CLASSIFY QUERY (LLM)
// // Returns { type, company, product, category, e_code }
// // =============================================================================
// async function classifyQuery(q) {
//   // Fast path: E-number regex — no LLM needed
//   const eMatch = q.match(/\bE[-\s]?(\d{3,4}[a-z]?)\b/i);
//   if (eMatch) {
//     return { type: 3, e_code: `E${eMatch[1].toUpperCase()}`, company: null, product: null, category: null };
//   }

//   const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
//     body: JSON.stringify({
//       model: "llama-3.3-70b-versatile",
//       temperature: 0,
//       max_tokens: 120,
//       response_format: { type: "json_object" },
//       messages: [
//         {
//           role: "system",
//           content: `You are a query parser for a halal product database.
// Classify into exactly one type:
//   1 = user asks about a specific COMPANY (e.g. "is Abbott halal", "abbott food products")
//   2 = user asks about a specific PRODUCT or BRAND (e.g. "is lays chips halal", "nutella")
//   4 = user browses a CATEGORY (e.g. "show me halal snacks", "halal beverages")
//   5 = unclear / general question not about a specific product

// Extract (null if missing):
//   company:  manufacturer or company name
//   product:  product or brand name  
//   category: food/drink/medicine/cosmetic/supplement/snack/dairy/meat etc

// Respond ONLY with JSON: {"type":1|2|4|5,"company":str|null,"product":str|null,"category":str|null}`
//         },
//         { role: "user", content: `Query: "${q}"` }
//       ]
//     })
//   });
//   const data = await res.json();
//   return JSON.parse(data.choices[0].message.content);
// }

// // =============================================================================
// // STAGE 2 — FUZZY COMPANY MATCH
// // =============================================================================
// const CATEGORY_MAP = {
//   food:"Food", foods:"Food", meat:"Food", chicken:"Food", dairy:"Food",
//   cheese:"Food", snack:"Food", snacks:"Food", chocolate:"Food", chips:"Food",
//   biscuit:"Food", bread:"Food", seafood:"Food", fish:"Food", candy:"Food",
//   drink:"Beverage", drinks:"Beverage", juice:"Beverage", beverage:"Beverage",
//   beverages:"Beverage", water:"Beverage", coffee:"Beverage", tea:"Beverage",
//   medicine:"Pharma", medicines:"Pharma", supplement:"Pharma", supplements:"Pharma",
//   vitamin:"Pharma", vitamins:"Pharma", capsule:"Pharma", pharmaceutical:"Pharma",
//   health:"Pharma", herbal:"Pharma", tablet:"Pharma",
//   cosmetic:"Cosmetic", cosmetics:"Cosmetic", skincare:"Cosmetic",
//   "skin care":"Cosmetic", lotion:"Cosmetic", shampoo:"Cosmetic",
//   soap:"Cosmetic", perfume:"Cosmetic", fragrance:"Cosmetic",
//   additive:"Additive", additives:"Additive", flavoring:"Additive",
//   preservative:"Additive",
// };

// function resolveCategory(raw) {
//   if (!raw) return null;
//   const r = raw.toLowerCase();
//   // Check direct canonical match
//   const canonical = ["Food","Beverage","Additive","Cosmetic","Pharma","Non-food","Service"];
//   for (const c of canonical) if (r === c.toLowerCase()) return c;
//   // Check synonym map
//   for (const [k, v] of Object.entries(CATEGORY_MAP)) if (r.includes(k)) return v;
//   return null;
// }

// function fuzzyCompany(token, threshold = 0.38) {
//   if (!token || knownCompanies.length === 0) return null;
//   const t = token.toLowerCase();
//   let best = null, bestDist = Infinity;
//   for (const c of knownCompanies) {
//     // exact substring match is instant win
//     if (c.norm.includes(t) || t.includes(c.norm)) {
//       if (c.norm.length < (best?.norm.length ?? Infinity)) {
//         best = c; bestDist = 0;
//       }
//     }
//     const d = distance(t, c.norm) / Math.max(t.length, c.norm.length);
//     if (d < bestDist) { bestDist = d; best = c; }
//   }
//   return bestDist <= threshold ? { matched: best.raw, dist: bestDist } : null;
// }

// // =============================================================================
// // STAGE 3 — EMBED
// // =============================================================================
// async function embed(text) {
//   const res = await fetch("https://api.fireworks.ai/inference/v1/embeddings", {
//     method: "POST",
//     headers: { "Authorization": `Bearer ${FIREWORKS_API_KEY}`, "Content-Type": "application/json" },
//     body: JSON.stringify({ model: EMBED_MODEL, input: [text] })
//   });
//   const data = await res.json();
//   return data.data[0].embedding;
// }

// // =============================================================================
// // STAGE 4 — QDRANT QUERIES
// // =============================================================================

// // Type 1: company filter + semantic vector
// async function searchByCompany(company, category) {
//   const must = [{ key: "companies", match: { text: company.toLowerCase() } }];
//   if (category) must.push({ key: "category_l1", match: { value: category } });
//   const vec = await embed(`[${category || ""}] ${company} products`);
//   return qdrant.search(COLLECTION_PRODUCTS, {
//     vector: vec, limit: TOP_K, with_payload: true, filter: { must }
//   });
// }

// // Type 2: pure semantic search + optional category filter
// async function searchByProduct(product, category) {
//   const prefix = category ? `[${category}]` : "";
//   const vec = await embed(`${prefix} ${product}`);
//   const must = category ? [{ key: "category_l1", match: { value: category } }] : [];
//   return qdrant.search(COLLECTION_PRODUCTS, {
//     vector: vec, limit: TOP_K, with_payload: true,
//     filter: must.length ? { must } : undefined
//   });
// }

// // Type 3: E-number direct lookup (no embedding)
// async function searchByECode(eCode) {
//   const res = await qdrant.scroll(COLLECTION_ENUMBERS, {
//     filter: { must: [{ key: "e_code", match: { value: eCode } }] },
//     limit: 5, with_payload: true
//   });
//   return (res.points || []).map(p => ({ score: 1.0, payload: p.payload }));
// }

// // Type 4: category browse
// async function searchByCategory(category, hint) {
//   const vec = await embed(`[${category}] ${hint || "halal products"}`);
//   const must = [{ key: "category_l1", match: { value: category } }];
//   return qdrant.search(COLLECTION_PRODUCTS, {
//     vector: vec, limit: TOP_K, with_payload: true, filter: { must }
//   });
// }

// // =============================================================================
// // STAGE 5 — WEB SEARCH FALLBACK (Type 5 / low confidence)
// // =============================================================================
// async function webSearch(q) {
//   if (!GOOGLE_API_KEY || !GOOGLE_CX) {
//     return "⚠  Google Search not configured (add GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX to .env.local)";
//   }
//   const url = new URL("https://www.googleapis.com/customsearch/v1");
//   url.searchParams.set("key", GOOGLE_API_KEY);
//   url.searchParams.set("cx",  GOOGLE_CX);
//   url.searchParams.set("q",   `${q} halal certification`);
//   url.searchParams.set("num", "3");
//   const res  = await fetch(url.toString());
//   const data = await res.json();
//   if (!data.items?.length) return "No web results found.";
//   return data.items.map((i, n) =>
//     `  ${n+1}. ${i.title}\n     ${i.link}\n     ${i.snippet}`
//   ).join("\n\n");
// }

// // =============================================================================
// // FORMAT RESPONSE — turns raw Qdrant results into readable chat output
// // =============================================================================
// function formatResults(results, queryType, extra = {}) {
//   const today = new Date().toISOString().slice(0,10).replace(/-/g,"/");

//   if (!results.length) return null;

//   // For E-number (Type 3) direct lookup — special compact format
//   if (queryType === 3) {
//     const p = results[0].payload;
//     const lines = [
//       `\n┌─ E-Number Result ───────────────────────────────────`,
//       `│  Code:    ${extra.e_code}`,
//       `│  Name:    ${p.norm_name}`,
//       `│  Status:  ${statusBadge(p.halal_status)}`,
//       `│  Category: ${p.category_l1} / ${p.category_l2}`,
//     ];
//     if (p.health_info?.length) lines.push(`│  Info:    ${p.health_info[0].slice(0,80)}`);
//     if (p.typical_uses?.length) lines.push(`│  Uses:    ${p.typical_uses.slice(0,3).join(", ")}`);
//     lines.push(`│  Sources: ${(p.source_files||[]).join(", ")}`);
//     lines.push(`└────────────────────────────────────────────────────`);
//     return lines.join("\n");
//   }

//   // For product/company/category results — show each match
//   const passing = results.filter(r => r.score >= SCORE_THRESHOLD);
//   if (!passing.length) return null;

//   const lines = [`\n┌─ Found ${passing.length} result(s) ─────────────────────────────`];

//   for (const r of passing) {
//     const p = r.payload;
//     const expired = p.cert_expiry && p.cert_expiry < today;
//     lines.push(`│`);
//     lines.push(`│  ${statusBadge(p.halal_status)}  ${p.norm_name}`);
//     lines.push(`│  Category:  ${p.category_l1} / ${p.category_l2}`);
//     if (p.companies?.length)    lines.push(`│  Company:   ${p.companies.slice(0,2).join(", ")}`);
//     if (p.cert_bodies?.length)  lines.push(`│  Certified: ${p.cert_bodies.join(", ")}`);
//     if (p.cert_expiry)          lines.push(`│  Expires:   ${p.cert_expiry}${expired ? "  ⚠ EXPIRED" : ""}`);
//     if (p.sold_in?.length)      lines.push(`│  Sold in:   ${p.sold_in.slice(0,4).join(", ")}`);
//     if (p.marketplace?.length)  lines.push(`│  Channel:   ${p.marketplace.slice(0,3).join(", ")}`);
//     lines.push(`│  Score:     ${r.score.toFixed(3)}`);
//   }

//   lines.push(`└────────────────────────────────────────────────────`);
//   return lines.join("\n");
// }

// function statusBadge(status) {
//   switch(status) {
//     case "Halal":    return "✅ Halal";
//     case "Mushbooh": return "⚠️  Mushbooh (doubtful — verify source)";
//     case "Haraam":   return "❌ Haraam";
//     default:         return `❓ ${status}`;
//   }
// }

// // =============================================================================
// // MAIN QUERY HANDLER — called on each user message
// // =============================================================================
// async function handleQuery(userInput) {
//   const q = userInput.trim();
//   if (!q) return;

//   process.stdout.write("\n🔍  Thinking...");

//   try {
//     // ── Classify ──────────────────────────────────────────────────────────
//     const classified = await classifyQuery(q);
//     process.stdout.write(` [Type ${classified.type}]\n`);

//     // ── Resolve entities ──────────────────────────────────────────────────
//     let resolvedCompany  = null;
//     let fuzzyWarning     = null;
//     const resolvedCategory = resolveCategory(classified.category);

//     if (classified.company) {
//       const match = fuzzyCompany(classified.company);
//       if (match) {
//         resolvedCompany = match.matched;
//         if (match.dist > 0.05) {
//           fuzzyWarning = `→ Matched company: "${match.matched}" (from "${classified.company}")`;
//         }
//       } else {
//         fuzzyWarning = `→ Company "${classified.company}" not found in database`;
//         resolvedCompany = classified.company;
//       }
//     }

//     if (fuzzyWarning) console.log(`  ${fuzzyWarning}`);

//     // ── Query Qdrant ───────────────────────────────────────────────────────
//     let results = [];

//     switch (classified.type) {
//       case 1:
//         results = await searchByCompany(resolvedCompany, resolvedCategory);
//         break;
//       case 2:
//         results = await searchByProduct(classified.product || q, resolvedCategory);
//         break;
//       case 3:
//         results = await searchByECode(classified.e_code);
//         break;
//       case 4:
//         results = await searchByCategory(resolvedCategory || "Food", classified.product || "");
//         break;
//       default:
//         // Type 5 — try a broad semantic search first
//         results = await searchByProduct(q, resolvedCategory);
//         break;
//     }

//     // ── Confidence check ──────────────────────────────────────────────────
//     const topScore   = results[0]?.score ?? 0;
//     const isENumber  = classified.type === 3;
//     const found      = isENumber ? results.length > 0 : topScore >= SCORE_THRESHOLD;

//     // ── Format and print ──────────────────────────────────────────────────
//     if (found) {
//       const formatted = formatResults(results, classified.type, { e_code: classified.e_code });
//       if (formatted) {
//         console.log(formatted);
//       } else {
//         console.log("\n  No confident matches found.");
//       }
//     } else {
//       // Not in database — show closest + web search
//       console.log(`\n  ❌  Not found in our database (top score: ${topScore.toFixed(3)})`);

//       if (results.length) {
//         const closest = results[0].payload?.norm_name;
//         if (closest) console.log(`  Closest match: "${closest}"`);
//       }

//       console.log(`\n  🌐  Searching the web...`);
//       const webResults = await webSearch(q);
//       console.log(`\n  Web results for "${q} halal certification":`);
//       console.log(webResults);
//       console.log(`\n  ⚠  These are unverified web results, not from our certified database.`);
//     }

//   } catch (err) {
//     console.error(`\n  Error: ${err.message}`);
//   }
// }

// // =============================================================================
// // CLI LOOP
// // =============================================================================
// async function main() {
//   console.log(`
// ╔══════════════════════════════════════════════════════╗
// ║         HALAL PRODUCT CHATBOT                        ║
// ║                                                      ║
// ║  Type your question and press Enter.                 ║
// ║  Type  exit  to quit.                                ║
// ╚══════════════════════════════════════════════════════╝

// Loading company list...`);

//   loadCompanyList();
//   console.log(`✅  Ready — ${knownCompanies.length} companies loaded\n`);

//   console.log(`Try these queries:
//   • "are Abbott food products halal?"          (Type 1 — company)
//   • "is lays chips halal?"                     (Type 2 — brand+product)
//   • "is E471 halal?"                           (Type 3 — E-number)
//   • "show me halal skincare products"          (Type 4 — category browse)
//   • "is KFC burger halal in Pakistan?"         (Type 5 — not in data → web)
// `);

//   const rl = readline.createInterface({
//     input:  process.stdin,
//     output: process.stdout,
//     prompt: "You: ",
//   });

//   rl.prompt();

//   rl.on("line", async (line) => {
//     const input = line.trim();
//     if (!input) { rl.prompt(); return; }
//     if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
//       console.log("\nGoodbye!\n");
//       rl.close();
//       process.exit(0);
//     }
//     await handleQuery(input);
//     console.log();
//     rl.prompt();
//   });

//   rl.on("close", () => process.exit(0));
// }

// main().catch(console.error);

/**
 * =============================================================================
 * HALAL PRODUCT CLI CHATBOT
 * =============================================================================
 * Run:  node chatbot.js
 * =============================================================================
 */

import { QdrantClient }  from "@qdrant/js-client-rest";
import { distance }      from "fastest-levenshtein";
import readline          from "readline";
import fs                from "fs";
import path              from "path";
import { fileURLToPath } from "url";
import dotenv            from "dotenv";
import { loadEnvFile } from "process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname,"..", ".env.local") });


// =============================================================================
// CONFIG
// =============================================================================
const QDRANT_URL         = process.env.QDRANT_URL;
const QDRANT_API_KEY     = process.env.QDRANT_API_KEY    || "";
const FIREWORKS_API_KEY  = process.env.FIREWORKS_API_KEY || "";
const GROQ_API_KEY       = process.env.GROQ_API_KEY     || "";
const GOOGLE_API_KEY     = process.env.GOOGLE_API_KEY || "";
const GOOGLE_CX          = process.env.GOOGLE_CX_ID  || "";

const EMBED_MODEL        = "accounts/fireworks/models/qwen3-embedding-8b";
const VECTOR_SIZE        = 4096;
const SCORE_THRESHOLD    = 0.82;
const TOP_K              = 8;

const COLLECTION_PRODUCTS = "halal_products";
const COLLECTION_ENUMBERS = "halal_enumbers";




// ---------------------------------------------------------------------------
// JSON DATA PATHS
// Set PRODUCTS_PATH and ENUMBERS_PATH in .env.local to point to your output
// folder, OR place the JSON files in the same directory as chatbot.js.
// ---------------------------------------------------------------------------
const PRODUCTS_PATH = process.env.PRODUCTS_PATH
  || path.join(__dirname, "./output/canonical_products.json")
  || path.join(__dirname, "canonical_products.json");

const ENUMBERS_PATH = process.env.ENUMBERS_PATH
  || path.join(__dirname, "./output/e_numbers_lookup.json")
  || path.join(__dirname, "e_numbers_lookup.json");

// =============================================================================
// CLIENTS
// =============================================================================
const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY, checkCompatibility: false });

// =============================================================================
// STARTUP — load company list into memory
// =============================================================================
const knownCompanies = [];   // [{raw, norm}]

function loadCompanyList() {
  if (!fs.existsSync(PRODUCTS_PATH)) {
    console.error(`\n  ❌  canonical_products.json not found at:\n     ${PRODUCTS_PATH}`);
    console.error(`  Add PRODUCTS_PATH=C:\\path\\to\\canonical_products.json to your .env.local\n`);
    return;
  }
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf8"));
  const seen = new Set();
  for (const r of products) {
    for (const c of r.companies || []) {
      if (c && !seen.has(c.toLowerCase())) {
        seen.add(c.toLowerCase());
        knownCompanies.push({ raw: c, norm: c.toLowerCase() });
      }
    }
  }
}

// =============================================================================
// STAGE 1 — CLASSIFY QUERY (LLM)
// Returns { type, company, product, category, e_code }
// =============================================================================
// async function classifyQuery(q) {
//   // Fast path: E-number regex — no LLM needed
//   const eMatch = q.match(/\bE[-\s]?(\d{3,4}[a-z]?)\b/i);
//   if (eMatch) {
//     return { type: 3, e_code: `E${eMatch[1].toUpperCase()}`, company: null, product: null, category: null };
//   }

//   if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing from .env.local");
 
//   const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
//     body: JSON.stringify({
//       model: "llama-3.1-8b-instant",
//       temperature: 0,
//       max_tokens: 120,
//       response_format: { type: "json_object" },
//       messages: [
//         {
//           role: "system",
//           content: `You are a query parser for a halal product database.
// Classify into exactly one type:
//   1 = user asks about a specific COMPANY (e.g. "is Abbott halal", "abbott food products")
//   2 = user asks about a specific PRODUCT or BRAND (e.g. "is lays chips halal", "nutella")
//   4 = user browses a CATEGORY (e.g. "show me halal snacks", "halal beverages")
//   5 = unclear / general question not about a specific product
 
// Extract (null if missing):
//   company:  manufacturer or company name
//   product:  product or brand name  
//   category: food/drink/medicine/cosmetic/supplement/snack/dairy/meat etc
 
// Respond ONLY with JSON: {"type":1|2|4|5,"company":str|null,"product":str|null,"category":str|null}`
//         },
//         { role: "user", content: `Query: "${q}"` }
//       ]
//     })
//   });
//   const data = await res.json();
//   return JSON.parse(data.choices[0].message.content);
// }

async function classifyQuery(q) {
  const eMatch = q.match(/\bE[-\s]?(\d{3,4}[a-z]?)\b/i);
  if (eMatch) {
    return { type: 3, e_code: `E${eMatch[1].toUpperCase()}`, company: null, product: null, category: null };
  }

  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing from .env.local");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0,
          max_tokens: 120,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a query parser for a halal product database.
Classify into exactly one type:
  1 = user asks about a COMPANY only, no product mentioned (e.g. "is Abbott halal", "tell me about nestle")
  2 = user asks about a specific PRODUCT with or without brand (e.g. "is lays chips halal", "is KFC burger halal", "nutella chocolate")
  4 = user browses a CATEGORY, no specific brand (e.g. "show me halal snacks", "halal beverages list")
  5 = unclear or general question (e.g. "what is halal", "is this halal")

Extract fields (null if missing):
  company:  brand or manufacturer name only
  product:  product type only (not the brand name)
  category: food/beverage/medicine/cosmetic/supplement/snack/dairy/meat etc

CRITICAL — always split brand from product:
  "lays chips"       → company="lays",    product="chips"
  "kfc burger"       → company="kfc",     product="burger"
  "nestle water"     → company="nestle",  product="water"
  "nutella"          → company="nutella", product="chocolate spread"
   "california burger"    → company=null,      product="california burger"
  "show me chips"    → company=null,      product="chips"
  "abbott products"  → company="abbott",  product=null,  type=1

Respond ONLY with JSON: {"type":1|2|4|5,"company":str|null,"product":str|null,"category":str|null}`
            },
            { role: "user", content: `Query: "${q}"` }
          ]
        })
      });

      if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);

    } catch (err) {
      if (attempt === 3) throw err;
      console.log(`  ⚠️  Classify attempt ${attempt} failed, retrying...`);
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
}



// =============================================================================
// STAGE 2 — FUZZY COMPANY MATCH
// =============================================================================
const CATEGORY_MAP = {
  food:"Food", foods:"Food", meat:"Food", chicken:"Food", dairy:"Food",
  cheese:"Food", snack:"Food", snacks:"Food", chocolate:"Food", chips:"Food",
  biscuit:"Food", bread:"Food", seafood:"Food", fish:"Food", candy:"Food",
  drink:"Beverage", drinks:"Beverage", juice:"Beverage", beverage:"Beverage",
  beverages:"Beverage", water:"Beverage", coffee:"Beverage", tea:"Beverage",
  medicine:"Pharma", medicines:"Pharma", supplement:"Pharma", supplements:"Pharma",
  vitamin:"Pharma", vitamins:"Pharma", capsule:"Pharma", pharmaceutical:"Pharma",
  health:"Pharma", herbal:"Pharma", tablet:"Pharma",
  cosmetic:"Cosmetic", cosmetics:"Cosmetic", skincare:"Cosmetic",
  "skin care":"Cosmetic", lotion:"Cosmetic", shampoo:"Cosmetic",
  soap:"Cosmetic", perfume:"Cosmetic", fragrance:"Cosmetic",
  additive:"Additive", additives:"Additive", flavoring:"Additive",
  preservative:"Additive",
  skincare: "Cosmetic",
beauty:    "Cosmetic",   
makeup:    "Cosmetic",   
haircare: "Cosmetic",  
haircare:  "Cosmetic",   
hair:      "Cosmetic",
};


// const CATEGORY_KEYWORDS = {
//   Cosmetic: ["soap","lotion","cream","serum","oil","mask","shampoo","face","skin"],
//   Food: ["meat","chicken","cheese","snack","chips","bread","food"],
//   Beverage: ["drink","juice","tea","coffee","water"],
//   Pharma: ["tablet","capsule","medicine","vitamin","supplement"],
// };
 

function getAdaptiveThreshold(results) {
  if (!results || results.length === 0) return SCORE_THRESHOLD;
  const scores = results.map(r => r.score);
  const max    = scores[0];
  const mean   = scores.reduce((a, b) => a + b, 0) / scores.length;
  // 88% of top score — scales automatically for ANY category
  return Math.max(mean * 0.95, max * 0.88);
}


function resolveCategory(raw) {
  if (!raw) return null;
  const r = raw.toLowerCase();
  // Check direct canonical match
  const canonical = ["Food","Beverage","Additive","Cosmetic","Pharma","Non-food","Service"];
  for (const c of canonical) if (r === c.toLowerCase()) return c;
  // Check synonym map
  for (const [k, v] of Object.entries(CATEGORY_MAP)) if (r.includes(k)) return v;
  return null;
}

function fuzzyCompany(token, threshold = 0.38) {
  if (!token || knownCompanies.length === 0) return null;
  const t = token.toLowerCase();
  let best = null, bestDist = Infinity;
  for (const c of knownCompanies) {
    // exact substring match is instant win
    if (c.norm.includes(t) || t.includes(c.norm)) {
      if (c.norm.length < (best?.norm.length ?? Infinity)) {
        best = c; bestDist = 0;
      }
    }
    const d = distance(t, c.norm) / Math.max(t.length, c.norm.length);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return bestDist <= threshold ? { matched: best.raw, dist: bestDist } : null;
}

// =============================================================================
// STAGE 3 — EMBED
// =============================================================================
async function embed(text) {
  if (!FIREWORKS_API_KEY) throw new Error("FIREWORKS_API_KEY is missing from .env.local");

  const res = await fetch("https://api.fireworks.ai/inference/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${FIREWORKS_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: [text] })
  });

  const data = await res.json();

  if (!res.ok || !data.data?.[0]?.embedding) {
    throw new Error(`Embedding API error: ${JSON.stringify(data)}`);
  }

  return data.data[0].embedding;
}

// =============================================================================
// STAGE 4 — QDRANT QUERIES
// =============================================================================

// Type 1: company filter + semantic vector
// async function searchByCompany(company, category) {
//   const must = [{ key: "companies", match: { text: company.toLowerCase() } }];
//   if (category) must.push({ key: "category_l1", match: { value: category } });
//   const vec = await embed(`[${category || ""}] ${company} products`);
//   return qdrant.search(COLLECTION_PRODUCTS, {
//     vector: vec, limit: TOP_K, with_payload: true, filter: { must }
//   });
// }

async function searchByCompany(company, category) {
  // ✅ Sirf semantic search — no filter on companies field
  const vec = await embed(`[${category || ""}] ${company} products`);
  
  // Step 1: category filter ke saath search
  const must = category 
    ? [{ key: "category_l1", match: { value: category } }] 
    : [];
    console.log("filters",must)

  let results = await qdrant.search(COLLECTION_PRODUCTS, {
    vector: vec,
    limit: TOP_K * 2,  // zyada fetch karo taake company match mile
    with_payload: true,
    filter: must.length ? { must } : undefined
  });

  // Step 2: JavaScript mein company filter karo
  const companyResults = results.filter(r =>
    r.payload.companies?.some(c =>
      c.toLowerCase().includes(company.toLowerCase()) ||
      company.toLowerCase().includes(c.toLowerCase())
    )
  );

  // Step 3: Agar company match mila toh woh return karo
  // Warna pure semantic results return karo
  return companyResults.length ? companyResults : results;
}

// Type 2: pure semantic search + optional category filter
// async function searchByProduct(product, category) {
//   const prefix = category ? `[${category}]` : "";
//   const vec = await embed(`${prefix} ${product}`);
//   const must = category ? [{ key: "category_l1", match: { value: category } }] : [];
//   return qdrant.search(COLLECTION_PRODUCTS, {
//     vector: vec, limit: TOP_K, with_payload: true,
//     filter: must.length ? { must } : undefined
//   });
// }


async function searchByProduct(product, category, company = null) {
  const prefix = category ? `[${category}]` : "";
  const vec = await embed(`${prefix} ${product}`);
  
  const must = [];
  if (category) must.push({ key: "category_l1", match: { value: category } });
  if (company) must.push({ key: "companies", match: { text: company.toLowerCase() } });
    console.log("filters",must)

  
  return qdrant.search(COLLECTION_PRODUCTS, {
    vector: vec, limit: TOP_K, with_payload: true,
    filter: must.length ? { must } : undefined
  });
}

// Type 3: E-number direct lookup (no embedding)
async function searchByECode(eCode) {
  const res = await qdrant.scroll(COLLECTION_ENUMBERS, {
    filter: { must: [{ key: "e_code", match: { value: eCode } }] },
    limit: 5, with_payload: true
  });
  return (res.points || []).map(p => ({ score: 1.0, payload: p.payload }));
}

// Type 4: category browse
// async function searchByCategory(category, hint) {
//   const vec = await embed(`[${category}] ${hint || "halal products"}`);
//   const must = [{ key: "category_l1", match: { value: category } }];
//   return qdrant.search(COLLECTION_PRODUCTS, {
//     vector: vec, limit: TOP_K, with_payload: true, filter: { must }
//   });
// }

async function searchByCategory(category, hint) {
  const mapped = resolveCategory(category);
  if (!mapped) return [];
  const cleanHint = hint
    .replace(/\b(show|me|halal|list|find|get|give|please|products?)\b/gi, "")
    .trim() || `${mapped} products`;
    const queryText = cleanHint;
  //  const queryText = hint || `${mapped} products`;
  console.log(`  📌 Embedding query: "${queryText}"`);  // ✅ ADD
  // const vec = await embed(`${mapped} halal ${hint}`);
  const vec = await embed(queryText);

  // Primary: strict category filter
  let results = await qdrant.search(COLLECTION_PRODUCTS, {
    vector: vec,
    limit: TOP_K,
    with_payload: true,
    // filter: { must: [{ key: "category_l1", match: { value: mapped } }] }
    // Primary search mein:
filter: {
  must: [
    { key: "category_l1", match: { value: mapped } },
    { key: "halal_status", match: { value: "Halal" } }  // ✅ ADD
  ]
}
  });

  // Fallback: broad search → filter by category_l1 (no keyword guessing)
  if (!results.length) {
    results = await qdrant.search(COLLECTION_PRODUCTS, {
      vector: vec,
      limit: TOP_K * 3,
      with_payload: true
    });
    results = results.filter(r =>
      r.payload.category_l1?.toLowerCase() === mapped.toLowerCase()
    );
  }

  return results;
}




// =============================================================================
// STAGE 5 — WEB SEARCH FALLBACK (Type 5 / low confidence)
// =============================================================================
async function webSearch(q) {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    return "⚠  Google Search not configured (add GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX to .env.local)";
  }
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("cx",  GOOGLE_CX);
  url.searchParams.set("q",   `${q} halal certification`);
  url.searchParams.set("num", "3");
  const res  = await fetch(url.toString());
  const data = await res.json();
  if (!data.items?.length) return "No web results found.";
  return data.items.map((i, n) =>
    `  ${n+1}. ${i.title}\n     ${i.link}\n     ${i.snippet}`
  ).join("\n\n");
}

// =============================================================================
// FORMAT RESPONSE — turns raw Qdrant results into readable chat output
// =============================================================================
// function formatResults(results, queryType, extra = {}) {
//   const today = new Date().toISOString().slice(0,10).replace(/-/g,"/");

//   if (!results.length) return null;

//   // For E-number (Type 3) direct lookup — special compact format
//   if (queryType === 3) {
//     const p = results[0].payload;
//     const lines = [
//       `\n┌─ E-Number Result ───────────────────────────────────`,
//       `│  Code:    ${extra.e_code}`,
//       `│  Name:    ${p.norm_name}`,
//       `│  Status:  ${statusBadge(p.halal_status)}`,
//       `│  Category: ${p.category_l1} / ${p.category_l2}`,
//     ];
//     if (p.health_info?.length) lines.push(`│  Info:    ${p.health_info[0].slice(0,80)}`);
//     if (p.typical_uses?.length) lines.push(`│  Uses:    ${p.typical_uses.slice(0,3).join(", ")}`);
//     lines.push(`│  Sources: ${(p.source_files||[]).join(", ")}`);
//     lines.push(`└────────────────────────────────────────────────────`);
//     return lines.join("\n");
//   }

//   // For product/company/category results — show each match
//   // const passing = results.filter(r => r.score >= SCORE_THRESHOLD);
//   // const passing = results.filter(r => r.score >= (extra.threshold ?? SCORE_THRESHOLD));
//   // if (!passing.length) return null;

//    const passing = results.filter(r => {
//   if (r.score < (extra.threshold ?? SCORE_THRESHOLD)) return false;
//   if (r.payload.norm_name?.toLowerCase() === "n/a") return false;
//   if (r.payload.cert_expiry && r.payload.cert_expiry < today) return false; // ✅ expired hata do
//   return true;
// });

//   const lines = [`\n┌─ Found ${passing.length} result(s) ─────────────────────────────`];

//   for (const r of passing) {
//     const p = r.payload;
//     const expired = p.cert_expiry && p.cert_expiry < today;
//     lines.push(`│`);
//     lines.push(`│  ${statusBadge(p.halal_status)}  ${p.norm_name}`);
//     lines.push(`│  Category:  ${p.category_l1} / ${p.category_l2}`);
//     if (p.companies?.length)    lines.push(`│  Company:   ${p.companies.slice(0,2).join(", ")}`);
//     if (p.cert_bodies?.length)  lines.push(`│  Certified: ${p.cert_bodies.join(", ")}`);
//     if (p.cert_expiry)          lines.push(`│  Expires:   ${p.cert_expiry}${expired ? "  ⚠ EXPIRED" : ""}`);
//     if (p.sold_in?.length)      lines.push(`│  Sold in:   ${p.sold_in.slice(0,4).join(", ")}`);
//     if (p.marketplace?.length)  lines.push(`│  Channel:   ${p.marketplace.slice(0,3).join(", ")}`);
//     lines.push(`│  Score:     ${r.score.toFixed(3)}`);
//   }

//   lines.push(`└────────────────────────────────────────────────────`);
//   return lines.join("\n");
// }

function formatResults(results, queryType, extra = {}) {
  const today = new Date().toISOString().slice(0,10).replace(/-/g,"/");

  if (!results.length) return null;

  // For E-number (Type 3) direct lookup — special compact format
  if (queryType === 3) {
    const p = results[0].payload;

    // ✅ Fix 4: Status consistency
    let status = p.halal_status;
    if (status === "Halal" && p.health_info?.some(i =>
      i.toLowerCase().includes("mushbooh") || i.toLowerCase().includes("doubtful")
    )) {
      status = "Mushbooh";
    }

    const lines = [
      `\n┌─ E-Number Result ───────────────────────────────────`,
      `│  Code:    ${extra.e_code}`,
      `│  Name:    ${p.norm_name}`,
      `│  Status:  ${statusBadge(status)}`,  // ✅ fixed status use karo
      `│  Category: ${p.category_l1} / ${p.category_l2}`,
    ];
    if (p.health_info?.length) lines.push(`│  Info:    ${p.health_info[0].slice(0,80)}`);
    if (p.typical_uses?.length) lines.push(`│  Uses:    ${p.typical_uses.slice(0,3).join(", ")}`);
    lines.push(`│  Sources: ${(p.source_files||[]).join(", ")}`);
    lines.push(`└────────────────────────────────────────────────────`);
    return lines.join("\n");
  }

  // ✅ Fix 2: Expired + n/a filter
  const passing = results.filter(r => {
    if (r.score < (extra.threshold ?? SCORE_THRESHOLD)) return false;
    if (r.payload.norm_name?.toLowerCase() === "n/a") return false;
    if (r.payload.cert_expiry && r.payload.cert_expiry < today) return false;
    return true;
  });

  if (!passing.length) return null;

  const lines = [`\n┌─ Found ${passing.length} result(s) ─────────────────────────────`];

  for (const r of passing) {
    const p = r.payload;
    lines.push(`│`);
    lines.push(`│  ${statusBadge(p.halal_status)}  ${p.norm_name}`);
    lines.push(`│  Category:  ${p.category_l1} / ${p.category_l2}`);
    if (p.companies?.length)   lines.push(`│  Company:   ${p.companies.slice(0,2).join(", ")}`);
    if (p.cert_bodies?.length) lines.push(`│  Certified: ${p.cert_bodies.join(", ")}`);
    if (p.cert_expiry)         lines.push(`│  Expires:   ${p.cert_expiry}`);  // ✅ expired pehle hi filter ho gaya
    if (p.sold_in?.length)     lines.push(`│  Sold in:   ${p.sold_in.slice(0,4).join(", ")}`);
    if (p.marketplace?.length) lines.push(`│  Channel:   ${p.marketplace.slice(0,3).join(", ")}`);
    lines.push(`│  Score:     ${r.score.toFixed(3)}`);
  }

  lines.push(`└────────────────────────────────────────────────────`);
  return lines.join("\n");
}

function statusBadge(status) {
  switch(status) {
    case "Halal":    return "✅ Halal";
    case "Mushbooh": return "⚠️  Mushbooh (doubtful — verify source)";
    case "Haraam":   return "❌ Haraam";
    default:         return `❓ ${status}`;
  }
}

// =============================================================================
// MAIN QUERY HANDLER — called on each user message
// =============================================================================
async function handleQuery(userInput) {
  const q = userInput.trim();
  if (!q) return;

  process.stdout.write("\n🔍  Thinking...");

  try {
    // ── Classify ──────────────────────────────────────────────────────────
    const classified = await classifyQuery(q);
    console.log(`  📋 Classified:`, JSON.stringify(classified));  // ✅ ADD
    process.stdout.write(` [Type ${classified.type}]\n`);

    // ── Resolve entities ──────────────────────────────────────────────────
    let resolvedCompany  = null;
    let fuzzyWarning     = null;
    const resolvedCategory = resolveCategory(classified.category);

    if (classified.company) {
      const match = fuzzyCompany(classified.company);
      if (match) {
        resolvedCompany = match.matched;
        if (match.dist > 0.05) {
          fuzzyWarning = `→ Matched company: "${match.matched}" (from "${classified.company}")`;
        }
      } else {
        // fuzzyWarning = `→ Company "${classified.company}" not found in database`;
        // resolvedCompany = classified.company;
        resolvedCompany = null;

      }
    }

    if (fuzzyWarning) console.log(`  ${fuzzyWarning}`);

    // ── Query Qdrant ───────────────────────────────────────────────────────
    let results = [];

    switch (classified.type) {
      
  //     case 1:
  // results = await searchByCompany(resolvedCompany, resolvedCategory);
  
  // // ✅ Agar koi bhi result company se match nahi karta → web search
  // if (results.length) {
  //   const hasMatch = results.some(r =>
  //     r.payload.companies?.some(c =>
  //       c.toLowerCase().includes(resolvedCompany.toLowerCase()) ||
  //       resolvedCompany.toLowerCase().includes(c.toLowerCase())
  //     )
  //   );
  //   if (!hasMatch) {
  //     console.log(`\n  ℹ️  "${resolvedCompany}" hamare database mein nahi hai.`);
  //     console.log(`  🌐  Web se check karte hain...\n`);
  //     const webResults = await webSearch(q);
  //     console.log(`  Web results for "${q}":`);
  //     console.log(webResults);
  //     console.log(`\n  ⚠️  Yeh unverified web results hain.`);
  //     return;
  //   }
  // }
  // break;
    
      case 1:
  results = await searchByCompany(resolvedCompany, resolvedCategory);

  if (results.length) {
    const hasMatch = results.some(r =>
      r.payload.companies?.some(c =>
        c.toLowerCase().includes(resolvedCompany.toLowerCase()) ||
        resolvedCompany.toLowerCase().includes(c.toLowerCase())
      )
    );
    if (!hasMatch) {
      console.log(`\n  ℹ️  "${resolvedCompany}" hamare database mein nahi hai.`);
      console.log(`  🌐  Web se check karte hain...\n`);
      const webResults = await webSearch(q);
      console.log(`  Web results for "${q}":`);
      console.log(webResults);
      console.log(`\n  ⚠️  Yeh unverified web results hain.`);
      return;
    }

    // ✅ Summary add karo
    const halal    = results.filter(r => r.payload.halal_status === "Halal").length;
    const haram    = results.filter(r => r.payload.halal_status === "Haraam").length;
    const mushbooh = results.filter(r => r.payload.halal_status === "Mushbooh").length;
    console.log(`\n  📊 ${resolvedCompany} summary: ✅ Halal: ${halal}  ❌ Haraam: ${haram}  ⚠️ Mushbooh: ${mushbooh}`);
  }
  break;
  
//   case 2: {
//   const productQuery = classified.product || q;
//   const companyName  = resolvedCompany || classified.company;

//   // Zyada results fetch karo taake company match mile
//   results = await searchByProduct(productQuery, resolvedCategory);

//   if (companyName) {
//     const b = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
//     console.log(`  🔎 Company filter: "${companyName}" → normalized: "${b}"`);

//     const companyFiltered = results.filter(r =>
//       r.payload.companies?.some(c => {
//         const a = c.toLowerCase().replace(/[^a-z0-9]/g, "");
//         return a.includes(b) || b.includes(a);
//       })
//     );

//     console.log(`  🔎 Matched: ${companyFiltered.length}/${results.length}`);

//     if (companyFiltered.length) {
//       // ✅ Company ke products mile
//       results = companyFiltered;
//     } else {
//       // ❌ Company database mein nahi — web search
//       console.log(`\n  ℹ️  "${companyName}" ka yeh product hamare database mein nahi hai.`);
//       console.log(`  🌐  Web se check karte hain...\n`);
//       const webResults = await webSearch(q);
//       console.log(`  Web results for "${q}":`);
//       console.log(webResults);
//       console.log(`\n  ⚠️  Yeh unverified web results hain.`);
//       return;
//     }
//   }
//   break;
// }

case 2: {
  const productQuery = classified.product || q;

  // ✅ Company mention ki lekin database mein nahi → seedha web search
  if (classified.company && !resolvedCompany) {
    console.log(`\n  ℹ️  "${classified.company}" hamare database mein nahi hai.`);
    console.log(`  🌐  Web se check karte hain...\n`);
    const webResults = await webSearch(q);
    console.log(`  Web results for "${q}":`);
    console.log(webResults);
    console.log(`\n  ⚠️  Yeh unverified web results hain.`);
    return;
  }

  results = await searchByProduct(productQuery, resolvedCategory);

  if (resolvedCompany) {
    // ✅ Company exist karti hai — sirf us company ke products
    const b = resolvedCompany.toLowerCase().replace(/[^a-z0-9]/g, "");
    const companyFiltered = results.filter(r =>
      r.payload.companies?.some(c => {
        const a = c.toLowerCase().replace(/[^a-z0-9]/g, "");
        return a.includes(b) || b.includes(a);
      })
    );

    if (companyFiltered.length) {
      results = companyFiltered;  // ✅ Sirf us company ke products
    } else {
      // Company hai lekin yeh product nahi
      console.log(`\n  ℹ️  "${resolvedCompany}" ka "${productQuery}" hamare database mein nahi hai.`);
      console.log(`  🌐  Web se check karte hain...\n`);
      const webResults = await webSearch(q);
      console.log(`  Web results for "${q}":`);
      console.log(webResults);
      console.log(`\n  ⚠️  Yeh unverified web results hain.`);
      return;
    }
  }
  break;
}
      case 3:
        results = await searchByECode(classified.e_code);
        break;
      // case 4:
      //   results = await searchByCategory(resolvedCategory || "Food", classified.product || "");
      //   break;
      // default:
     case 4:
  if (!resolvedCategory) {
    console.log("\n  ⚠️  Category not recognized.");
    results = [];
  } else {
    // ✅ poori user query hint ke taur pe pass karo
    results = await searchByCategory(resolvedCategory, q);
  }
  break;
  default:

        // Type 5 — try a broad semantic search first
        results = await searchByProduct(q, resolvedCategory);
        break;
    }

    // ── Confidence check ──────────────────────────────────────────────────
    const topScore   = results[0]?.score ?? 0;
    const isENumber  = classified.type === 3;
    // const found      = isENumber ? results.length > 0 : topScore >= SCORE_THRESHOLD;
    const threshold = isENumber ? 0 : getAdaptiveThreshold(results);
const found     = isENumber ? results.length > 0 : topScore >= threshold;

    // ── Format and print ──────────────────────────────────────────────────
    if (found) {
      // const formatted = formatResults(results, classified.type, { e_code: classified.e_code });
      const formatted = formatResults(results, classified.type, {
  e_code: classified.e_code,
  threshold   // ✅ dynamic pass karo
});
      if (formatted) {
        console.log(formatted);
      } else {
        console.log("\n  No confident matches found.");
      }
    } else {
      // Not in database — show closest + web search
      console.log(`\n  ❌  Not found in our database (top score: ${topScore.toFixed(3)})`);

      if (results.length) {
        const closest = results[0].payload?.norm_name;
        if (closest) console.log(`  Closest match: "${closest}"`);
      }

      console.log(`\n  🌐  Searching the web...`);
      const webResults = await webSearch(q);
      console.log(`\n  Web results for "${q} halal certification":`);
      console.log(webResults);
      console.log(`\n  ⚠  These are unverified web results, not from our certified database.`);
    }

  } catch (err) {
    console.error(`\n  Error: ${err.message}`);
  }
}

// =============================================================================
// CLI LOOP
// =============================================================================
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║         HALAL PRODUCT CHATBOT                        ║
║                                                      ║
║  Type your question and press Enter.                 ║
║  Type  exit  to quit.                                ║
╚══════════════════════════════════════════════════════╝

Loading company list...`);

  loadCompanyList();
  console.log(`✅  Ready — ${knownCompanies.length} companies loaded\n`);

  console.log(`Try these queries:
  • "are Abbott food products halal?"          (Type 1 — company)
  • "is lays chips halal?"                     (Type 2 — brand+product)
  • "is E471 halal?"                           (Type 3 — E-number)
  • "show me halal skincare products"          (Type 4 — category browse)
  • "is KFC burger halal in Pakistan?"         (Type 5 — not in data → web)
`);

  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
    prompt: "You: ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }
    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      console.log("\nGoodbye!\n");
      rl.close();
      process.exit(0);
    }
    await handleQuery(input);
    console.log();
    rl.prompt();
  });

  rl.on("close", () => process.exit(0));
}

main().catch(console.error);