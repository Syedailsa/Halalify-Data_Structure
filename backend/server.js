/**
 * =============================================================================
 * HALAL PRODUCT API SERVER
 * =============================================================================
 * REST API server for the Halal Product Chatbot
 * =============================================================================
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
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
  resolveCategory,
  fuzzyCompany,
} from "./chat/chatbotService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env.local") });

// =============================================================================
// CONFIG
// =============================================================================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

// =============================================================================
// EXPRESS APP SETUP
// =============================================================================
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    initialized: isInitialized,
    companiesLoaded: knownCompanies.length,
    timestamp: new Date().toISOString(),
  });
});

// Get all known companies
app.get("/api/companies", (req, res) => {
  if (!isInitialized) {
    return res.status(503).json({
      success: false,
      error: "Service not initialized. Please try again later.",
    });
  }

  const { search } = req.query;
  let companies = knownCompanies.map((c) => c.raw);

  if (search) {
    const searchLower = search.toLowerCase();
    companies = companies.filter((c) =>
      c.toLowerCase().includes(searchLower)
    );
  }

  res.json({
    success: true,
    count: companies.length,
    companies: companies.sort(),
  });
});

// Get available categories
app.get("/api/categories", (req, res) => {
  const categories = [
    "Food",
    "Beverage",
    "Additive",
    "Cosmetic",
    "Pharma",
    "Non-food",
    "Service",
  ];

  res.json({
    success: true,
    categories,
  });
});

// Main query endpoint
app.post("/api/query", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({
      success: false,
      error: "Query is required and must be a string",
    });
  }

  try {
    const result = await handleQuery(query);
    res.json(result);
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process query",
    });
  }
});

// Search by company
app.get("/api/search/company", async (req, res) => {
  const { company, category } = req.query;

  if (!company) {
    return res.status(400).json({
      success: false,
      error: "Company parameter is required",
    });
  }

  try {
    const resolvedCategory = category ? resolveCategory(category) : null;
    const results = await searchByCompany(company, resolvedCategory);

    res.json({
      success: true,
      query: { company, category: resolvedCategory },
      results: results.map((r) => ({
        score: r.score,
        payload: r.payload,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error("Company search error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to search by company",
    });
  }
});

// Search by product
app.get("/api/search/product", async (req, res) => {
  const { product, category, company } = req.query;

  if (!product) {
    return res.status(400).json({
      success: false,
      error: "Product parameter is required",
    });
  }

  try {
    const resolvedCategory = category ? resolveCategory(category) : null;
    const results = await searchByProduct(product, resolvedCategory, company);

    res.json({
      success: true,
      query: { product, category: resolvedCategory, company },
      results: results.map((r) => ({
        score: r.score,
        payload: r.payload,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error("Product search error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to search by product",
    });
  }
});

// Search by E-number
app.get("/api/search/enumbers/:eCode", async (req, res) => {
  const { eCode } = req.params;

  if (!eCode) {
    return res.status(400).json({
      success: false,
      error: "E-code parameter is required",
    });
  }

  try {
    const normalizedCode = eCode.toUpperCase().startsWith("E")
      ? eCode.toUpperCase()
      : `E${eCode.toUpperCase()}`;
    const results = await searchByECode(normalizedCode);

    res.json({
      success: true,
      query: { eCode: normalizedCode },
      results: results.map((r) => ({
        score: r.score,
        payload: r.payload,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error("E-number search error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to search by E-number",
    });
  }
});

// Search by category
app.get("/api/search/category", async (req, res) => {
  const { category, hint } = req.query;

  if (!category) {
    return res.status(400).json({
      success: false,
      error: "Category parameter is required",
    });
  }

  try {
    const results = await searchByCategory(category, hint || "");

    res.json({
      success: true,
      query: { category, hint },
      results: results.map((r) => ({
        score: r.score,
        payload: r.payload,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error("Category search error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to search by category",
    });
  }
});

// Classify query endpoint
app.post("/api/classify", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({
      success: false,
      error: "Query is required and must be a string",
    });
  }

  try {
    const classified = await classifyQuery(query);
    res.json({
      success: true,
      query,
      classified,
    });
  } catch (error) {
    console.error("Classify error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to classify query",
    });
  }
});

// Web search endpoint
app.post("/api/websearch", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({
      success: false,
      error: "Query is required and must be a string",
    });
  }

  try {
    const results = await webSearch(query);
    res.json({
      success: true,
      query,
      results,
    });
  } catch (error) {
    console.error("Web search error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to perform web search",
    });
  }
});

// Fuzzy company match endpoint
app.get("/api/match/company", (req, res) => {
  const { company, threshold } = req.query;

  if (!company) {
    return res.status(400).json({
      success: false,
      error: "Company parameter is required",
    });
  }

  if (!isInitialized) {
    return res.status(503).json({
      success: false,
      error: "Service not initialized. Please try again later.",
    });
  }

  const match = fuzzyCompany(company, threshold ? parseFloat(threshold) : undefined);

  res.json({
    success: true,
    query: { company, threshold },
    match,
  });
});

// Resolve category endpoint
app.get("/api/resolve/category", (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({
      success: false,
      error: "Category parameter is required",
    });
  }

  const resolved = resolveCategory(category);

  res.json({
    success: true,
    query: { category },
    resolved,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// =============================================================================
// START SERVER
// =============================================================================
async function startServer() {
  console.log("🚀 Starting Halal Product API Server...");

  // Initialize company list
  console.log("📋 Loading company list...");
  const loaded = loadCompanyList();

  if (!loaded) {
    console.error("❌ Failed to load company list. Server will start but may not function properly.");
  } else {
    console.log(`✅ Loaded ${knownCompanies.length} companies`);
  }

  // Start listening
  app.listen(PORT, HOST, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║         HALAL PRODUCT API SERVER                    ║
║                                                      ║
║  Server running at: http://${HOST}:${PORT}         ║
║                                                      ║
║  Available endpoints:                                ║
║  • GET  /api/health                                 ║
║  • GET  /api/companies                              ║
║  • GET  /api/categories                             ║
║  • POST /api/query                                  ║
║  • GET  /api/search/company                         ║
║  • GET  /api/search/product                         ║
║  • GET  /api/search/enumbers/:eCode                 ║
║  • GET  /api/search/category                        ║
║  • POST /api/classify                               ║
║  • POST /api/websearch                              ║
║  • GET  /api/match/company                          ║
║  • GET  /api/resolve/category                       ║
╚══════════════════════════════════════════════════════╝
    `);
  });
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});