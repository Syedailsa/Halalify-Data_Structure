/**
 * =============================================================================
 * HALAL PRODUCT CHATBOT SERVICE
 * =============================================================================
 * Core service functions that can be used by both CLI and HTTP server
 * =============================================================================
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { distance } from "fastest-levenshtein";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// =============================================================================
// CONFIG
// =============================================================================
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || "";
const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const GOOGLE_CX = process.env.GOOGLE_CX_ID || "";

const EMBED_MODEL = "accounts/fireworks/models/qwen3-embedding-8b";
const VECTOR_SIZE = 4096;
const SCORE_THRESHOLD = 0.82;
const TOP_K = 8;

const COLLECTION_PRODUCTS = "halal_products";
const COLLECTION_ENUMBERS = "halal_enumbers";

// JSON DATA PATHS
const PRODUCTS_PATH =
  process.env.PRODUCTS_PATH ||
  path.join(__dirname, "../output/canonical_products.json") ||
  path.join(__dirname, "canonical_products.json");

const ENUMBERS_PATH =
  process.env.ENUMBERS_PATH ||
  path.join(__dirname, "../output/e_numbers_lookup.json") ||
  path.join(__dirname, "e_numbers_lookup.json");

// =============================================================================
// CLIENTS
// =============================================================================
const qdrant = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
  checkCompatibility: false,
});

// =============================================================================
// STARTUP — load company list into memory
// =============================================================================
let knownCompanies = []; // [{raw, norm}]
let isInitialized = false;

function loadCompanyList() {
  if (!fs.existsSync(PRODUCTS_PATH)) {
    console.error(
      `\n  ❌  canonical_products.json not found at:\n     ${PRODUCTS_PATH}`
    );
    console.error(
      `  Add PRODUCTS_PATH=C:\\path\\to\\canonical_products.json to your .env.local\n`
    );
    return false;
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
  isInitialized = true;
  return true;
}

// =============================================================================
// CATEGORY MAP
// =============================================================================
const CATEGORY_MAP = {
  food: "Food",
  foods: "Food",
  meat: "Food",
  chicken: "Food",
  dairy: "Food",
  cheese: "Food",
  snack: "Food",
  snacks: "Food",
  chocolate: "Food",
  chips: "Food",
  biscuit: "Food",
  bread: "Food",
  seafood: "Food",
  fish: "Food",
  candy: "Food",
  drink: "Beverage",
  drinks: "Beverage",
  juice: "Beverage",
  beverage: "Beverage",
  beverages: "Beverage",
  water: "Beverage",
  coffee: "Beverage",
  tea: "Beverage",
  medicine: "Pharma",
  medicines: "Pharma",
  supplement: "Pharma",
  supplements: "Pharma",
  vitamin: "Pharma",
  vitamins: "Pharma",
  capsule: "Pharma",
  pharmaceutical: "Pharma",
  health: "Pharma",
  herbal: "Pharma",
  tablet: "Pharma",
  cosmetic: "Cosmetic",
  cosmetics: "Cosmetic",
  skincare: "Cosmetic",
  "skin care": "Cosmetic",
  lotion: "Cosmetic",
  shampoo: "Cosmetic",
  soap: "Cosmetic",
  perfume: "Cosmetic",
  fragrance: "Cosmetic",
  additive: "Additive",
  additives: "Additive",
  flavoring: "Additive",
  preservative: "Additive",
  beauty: "Cosmetic",
  makeup: "Cosmetic",
  haircare: "Cosmetic",
  hair: "Cosmetic",
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
function getAdaptiveThreshold(results) {
  if (!results || results.length === 0) return SCORE_THRESHOLD;
  const scores = results.map((r) => r.score);
  const max = scores[0];
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.max(mean * 0.95, max * 0.88);
}

function resolveCategory(raw) {
  if (!raw) return null;
  const r = raw.toLowerCase();
  const canonical = [
    "Food",
    "Beverage",
    "Additive",
    "Cosmetic",
    "Pharma",
    "Non-food",
    "Service",
  ];
  for (const c of canonical) if (r === c.toLowerCase()) return c;
  for (const [k, v] of Object.entries(CATEGORY_MAP))
    if (r.includes(k)) return v;
  return null;
}

function fuzzyCompany(token, threshold = 0.38) {
  if (!token || knownCompanies.length === 0) return null;
  const t = token.toLowerCase();
  let best = null,
    bestDist = Infinity;
  for (const c of knownCompanies) {
    if (c.norm.includes(t) || t.includes(c.norm)) {
      if (c.norm.length < (best?.norm.length ?? Infinity)) {
        best = c;
        bestDist = 0;
      }
    }
    const d = distance(t, c.norm) / Math.max(t.length, c.norm.length);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return bestDist <= threshold ? { matched: best.raw, dist: bestDist } : null;
}

function statusBadge(status) {
  switch (status) {
    case "Halal":
      return "✅ Halal";
    case "Mushbooh":
      return "⚠️ Mushbooh (doubtful — verify source)";
    case "Haraam":
      return "❌ Haraam";
    default:
      return `❓ ${status}`;
  }
}

// =============================================================================
// STAGE 1 — CLASSIFY QUERY (LLM)
// =============================================================================
async function classifyQuery(q) {
  const eMatch = q.match(/\bE[-\s]?(\d{3,4}[a-z]?)\b/i);
  if (eMatch) {
    return {
      type: 3,
      e_code: `E${eMatch[1].toUpperCase()}`,
      company: null,
      product: null,
      category: null,
    };
  }

  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing from .env.local");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
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

Respond ONLY with JSON: {"type":1|2|4|5,"company":str|null,"product":str|null,"category":str|null}`,
              },
              { role: "user", content: `Query: "${q}"` },
            ],
          }),
        }
      );

      if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (err) {
      if (attempt === 3) throw err;
      console.log(`  ⚠️  Classify attempt ${attempt} failed, retrying...`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

// =============================================================================
// STAGE 3 — EMBED
// =============================================================================
async function embed(text) {
  if (!FIREWORKS_API_KEY)
    throw new Error("FIREWORKS_API_KEY is missing from .env.local");

  const res = await fetch("https://api.fireworks.ai/inference/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIREWORKS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: [text] }),
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
async function searchByCompany(company, category) {
  const vec = await embed(`[${category || ""}] ${company} products`);

  const must = category
    ? [{ key: "category_l1", match: { value: category } }]
    : [];

  let results = await qdrant.search(COLLECTION_PRODUCTS, {
    vector: vec,
    limit: TOP_K * 2,
    with_payload: true,
    filter: must.length ? { must } : undefined,
  });

  const companyResults = results.filter((r) =>
    r.payload.companies?.some(
      (c) =>
        c.toLowerCase().includes(company.toLowerCase()) ||
        company.toLowerCase().includes(c.toLowerCase())
    )
  );

  return companyResults.length ? companyResults : results;
}

async function searchByProduct(product, category, company = null) {
  const prefix = category ? `[${category}]` : "";
  const vec = await embed(`${prefix} ${product}`);

  const must = [];
  if (category) must.push({ key: "category_l1", match: { value: category } });
  if (company)
    must.push({ key: "companies", match: { text: company.toLowerCase() } });

  return qdrant.search(COLLECTION_PRODUCTS, {
    vector: vec,
    limit: TOP_K,
    with_payload: true,
    filter: must.length ? { must } : undefined,
  });
}

async function searchByECode(eCode) {
  const res = await qdrant.scroll(COLLECTION_ENUMBERS, {
    filter: { must: [{ key: "e_code", match: { value: eCode } }] },
    limit: 5,
    with_payload: true,
  });
  return (res.points || []).map((p) => ({ score: 1.0, payload: p.payload }));
}

async function searchByCategory(category, hint) {
  const mapped = resolveCategory(category);
  if (!mapped) return [];
  const cleanHint =
    hint
      .replace(/\b(show|me|halal|list|find|get|give|please|products?)\b/gi, "")
      .trim() || `${mapped} products`;
  const queryText = cleanHint;
  const vec = await embed(queryText);

  let results = await qdrant.search(COLLECTION_PRODUCTS, {
    vector: vec,
    limit: TOP_K,
    with_payload: true,
    filter: {
      must: [
        { key: "category_l1", match: { value: mapped } },
        { key: "halal_status", match: { value: "Halal" } },
      ],
    },
  });

  if (!results.length) {
    results = await qdrant.search(COLLECTION_PRODUCTS, {
      vector: vec,
      limit: TOP_K * 3,
      with_payload: true,
    });
    results = results.filter(
      (r) => r.payload.category_l1?.toLowerCase() === mapped.toLowerCase()
    );
  }

  return results;
}

// =============================================================================
// STAGE 5 — WEB SEARCH FALLBACK
// =============================================================================
async function webSearch(q) {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    return "⚠ Google Search not configured (add GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX to .env.local)";
  }
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("cx", GOOGLE_CX);
  url.searchParams.set("q", `${q} halal certification`);
  url.searchParams.set("num", "3");
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.items?.length) return "No web results found.";
  return data.items
    .map((i, n) => `  ${n + 1}. ${i.title}\n     ${i.link}\n     ${i.snippet}`)
    .join("\n\n");
}

// =============================================================================
// FORMAT RESPONSE
// =============================================================================
function formatResults(results, queryType, extra = {}) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "/");

  if (!results.length) return null;

  if (queryType === 3) {
    const p = results[0].payload;

    let status = p.halal_status;
    if (
      status === "Halal" &&
      p.health_info?.some(
        (i) =>
          i.toLowerCase().includes("mushbooh") ||
          i.toLowerCase().includes("doubtful")
      )
    ) {
      status = "Mushbooh";
    }

    const lines = [
      `\n┌─ E-Number Result ───────────────────────────────────`,
      `│  Code:    ${extra.e_code}`,
      `│  Name:    ${p.norm_name}`,
      `│  Status:  ${statusBadge(status)}`,
      `│  Category: ${p.category_l1} / ${p.category_l2}`,
    ];
    if (p.health_info?.length)
      lines.push(`│  Info:    ${p.health_info[0].slice(0, 80)}`);
    if (p.typical_uses?.length)
      lines.push(`│  Uses:    ${p.typical_uses.slice(0, 3).join(", ")}`);
    lines.push(`│  Sources: ${(p.source_files || []).join(", ")}`);
    lines.push(`└────────────────────────────────────────────────────`);
    return lines.join("\n");
  }

  const passing = results.filter((r) => {
    if (r.score < (extra.threshold ?? SCORE_THRESHOLD)) return false;
    if (r.payload.norm_name?.toLowerCase() === "n/a") return false;
    if (r.payload.cert_expiry && r.payload.cert_expiry < today) return false;
    return true;
  });

  if (!passing.length) return null;

  const lines = [
    `\n┌─ Found ${passing.length} result(s) ─────────────────────────────`,
  ];

  for (const r of passing) {
    const p = r.payload;
    lines.push(`│`);
    lines.push(`│  ${statusBadge(p.halal_status)}  ${p.norm_name}`);
    lines.push(`│  Category:  ${p.category_l1} / ${p.category_l2}`);
    if (p.companies?.length)
      lines.push(`│  Company:   ${p.companies.slice(0, 2).join(", ")}`);
    if (p.cert_bodies?.length)
      lines.push(`│  Certified: ${p.cert_bodies.join(", ")}`);
    if (p.cert_expiry) lines.push(`│  Expires:   ${p.cert_expiry}`);
    if (p.sold_in?.length)
      lines.push(`│  Sold in:   ${p.sold_in.slice(0, 4).join(", ")}`);
    if (p.marketplace?.length)
      lines.push(`│  Channel:   ${p.marketplace.slice(0, 3).join(", ")}`);
    lines.push(`│  Score:     ${r.score.toFixed(3)}`);
  }

  lines.push(`└────────────────────────────────────────────────────`);
  return lines.join("\n");
}

// =============================================================================
// MAIN QUERY HANDLER
// =============================================================================
async function handleQuery(userInput) {
  const q = userInput.trim();
  if (!q) return { error: "Empty query" };

  try {
    const classified = await classifyQuery(q);

    let resolvedCompany = null;
    let fuzzyWarning = null;
    const resolvedCategory = resolveCategory(classified.category);

    if (classified.company) {
      const match = fuzzyCompany(classified.company);
      if (match) {
        resolvedCompany = match.matched;
        if (match.dist > 0.05) {
          fuzzyWarning = `Matched company: "${match.matched}" (from "${classified.company}")`;
        }
      } else {
        resolvedCompany = null;
      }
    }

    let results = [];
    let summary = null;
    let webResults = null;
    let notInDatabase = false;

    switch (classified.type) {
      case 1:
        results = await searchByCompany(resolvedCompany, resolvedCategory);

        if (results.length) {
          const hasMatch = results.some((r) =>
            r.payload.companies?.some(
              (c) =>
                c.toLowerCase().includes(resolvedCompany.toLowerCase()) ||
                resolvedCompany.toLowerCase().includes(c.toLowerCase())
            )
          );
          if (!hasMatch) {
            notInDatabase = true;
            webResults = await webSearch(q);
          } else {
            const halal = results.filter(
              (r) => r.payload.halal_status === "Halal"
            ).length;
            const haram = results.filter(
              (r) => r.payload.halal_status === "Haraam"
            ).length;
            const mushbooh = results.filter(
              (r) => r.payload.halal_status === "Mushbooh"
            ).length;
            summary = {
              company: resolvedCompany,
              halal,
              haram,
              mushbooh,
            };
          }
        }
        break;

      case 2: {
        const productQuery = classified.product || q;

        if (classified.company && !resolvedCompany) {
          notInDatabase = true;
          webResults = await webSearch(q);
          break;
        }

        results = await searchByProduct(productQuery, resolvedCategory);

        if (resolvedCompany) {
          const b = resolvedCompany.toLowerCase().replace(/[^a-z0-9]/g, "");
          const companyFiltered = results.filter((r) =>
            r.payload.companies?.some((c) => {
              const a = c.toLowerCase().replace(/[^a-z0-9]/g, "");
              return a.includes(b) || b.includes(a);
            })
          );

          if (companyFiltered.length) {
            results = companyFiltered;
          } else {
            notInDatabase = true;
            webResults = await webSearch(q);
          }
        }
        break;
      }
      case 3:
        results = await searchByECode(classified.e_code);
        break;
      case 4:
        if (!resolvedCategory) {
          results = [];
        } else {
          results = await searchByCategory(resolvedCategory, q);
        }
        break;
      default:
        results = await searchByProduct(q, resolvedCategory);
        break;
    }

    const topScore = results[0]?.score ?? 0;
    const isENumber = classified.type === 3;
    const threshold = isENumber ? 0 : getAdaptiveThreshold(results);
    const found = isENumber ? results.length > 0 : topScore >= threshold;

    let formatted = null;
    if (found) {
      formatted = formatResults(results, classified.type, {
        e_code: classified.e_code,
        threshold,
      });
    }

    return {
      success: true,
      query: q,
      classified,
      resolvedCompany,
      resolvedCategory,
      fuzzyWarning,
      summary,
      results: results.map((r) => ({
        score: r.score,
        payload: r.payload,
      })),
      formatted,
      topScore,
      threshold,
      found,
      notInDatabase,
      webResults,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      query: q,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================
export {
  loadCompanyList,
  knownCompanies,
  isInitialized,
  handleQuery,
  classifyQuery,
  searchByCompany,
  searchByProduct,
  searchByECode,
  searchByCategory,
  webSearch,
  formatResults,
  statusBadge,
  resolveCategory,
  fuzzyCompany,
  getAdaptiveThreshold,
};