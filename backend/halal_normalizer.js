
import { parse } from "csv-parse/sync";
import { distance } from "fastest-levenshtein";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    // Some files (THIDAA) use BOM markers; `bom: true` strips them silently
    bom: true,
  });
}

function readCSVRelaxed(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_quotes: true,        // tolerate malformed quotes
    skip_records_with_error: true,
  });
}

// =============================================================================
// STAGE 1 — LOAD SOURCES
// =============================================================================

console.log("\n📂  STAGE 1 — Loading sources...\n");

// ---------------------------------------------------------------------------
// SOURCE A: halal_e_numbers_india.csv
// Columns: E-Code | Name | Category | Description
//
// This source is ADDITIVE-level data (E100, E102 …), not finished products.
// It carries halal STATUS per additive (Halal / Mushbooh / Haraam).
// We treat each E-number as its own record with category = "Additive".
// ---------------------------------------------------------------------------
function loadENumbers(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const rows = JSON.parse(raw)
  return rows.map((r) => {
    const description = r["Description"] || "";

    return {
      rawName: `${r["E-Code"] || ""} ${r["Name"] || ""}`.trim(),
      rawCategory: r["Category"] || "Additive",
      rawCompany: null, // E-number records have no company
      rawStatus: r["Status"] || "",
      soldIn: [],
      certBody: "HFCI India",
      certNum: null,
      certIssue: null,   // E-number records carry no issue date
      certExpiry: null,
      healthInfo:  description,
      typicalUses: [],
      marketplace: null,
      sourceId: `enumbers_${r["E-Code"]?.replace(/\s+/g, "_")}`,
      sourceFile: "halal_e_numbers_india",
      fda_number:    null,
      barcode:       null,
      company_contact: null,
    };
  });
}

// ---------------------------------------------------------------------------
// SOURCE B: hfce_halal_products.csv
// Columns: Product | URL | Sold_In | Company | Marketplace | Category
//
// HFCE is a European halal certification directory.
// Product names are messy: HTML entities like &#8211; (–), trailing codes
// like "PNG2 WPC35", and multi-value categories like
// "Nutritional Supplement, Nutritional Supplement - Tablet".
// ---------------------------------------------------------------------------
function loadHFCE(filePath) {
  const rows = readCSV(filePath);
  return rows.map((r) => ({ 
    rawName: r["Product"] || "",
    rawCategory: r["Category"] || "", 
    rawCompany: r["Company"] || null,
    rawStatus: "Halal", 
    soldIn: r["Sold_In"] ? [r["Sold_In"].trim()] : [],
    certBody: "HFCE",
    certNum: null,
    certIssue: null,   
    certExpiry: null,
    healthInfo:  null,
    typicalUses: [],
    marketplace: r["Marketplace"] || null,
    sourceId: `hfce_${slugify(r["Product"] || "")}`,
    sourceFile: "hfce_halal_products",    
    fda_number:    null,
    barcode:       null,
    company_contact: null,
  }));
}

// ---------------------------------------------------------------------------
// SOURCE C: Halal-Quality-Certification.csv  (Croatian HQC directory)
// Columns: Logo | Company | Address | Category | Products List
//
// This source is COMPANY-centric, not product-centric.
// Many rows have no Products List at all — they certify the whole company.
// We expand each row into one record per product if available, or keep one
// company-level record when the product list is empty.
// ---------------------------------------------------------------------------
function loadHQC(filePath) {
  const rows = readCSV(filePath);
  const records = [];

  rows.forEach((r) => {
    const addr    = r["Address"] ? ` (${r["Address"].trim()})` : "";
    const company = `${r["Company"] || ""}${addr}`.trim();
    const category = r["Category"] || "";
    const productList = r["Products List"] || "";

    // If no products listed, make one company-level record
    if (!productList || productList.trim() === "") {
      records.push({
        rawName: company, // company name is the best we have
        rawCategory: category,
        rawCompany: company,
        rawStatus: "Halal",
        soldIn: [],
        certBody: "HQC Croatia",
        certNum: null,
        certIssue: null,   // HQC source has no issue date column
        certExpiry: null,
        healthInfo:  null,
        typicalUses: [],
        marketplace: null,
        sourceId: `hqc_${slugify(company)}`,
        sourceFile: "halal_quality_cert",
        fda_number:    null,
        barcode:       null,
        company_contact: null,
      });
    } else {
      // Split on commas/semicolons if multiple products listed
      const products = productList.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
      products.forEach((product, i) => {
        records.push({
          rawName: product,
          rawCategory: category,
          rawCompany: company,
          rawStatus: "Halal",
          soldIn: [],
          certBody: "HQC Croatia",
          certNum: null,
          certIssue: null,
          certExpiry: null,
          healthInfo:  null,
          typicalUses: [],
          marketplace: null,
          sourceId: `hqc_${slugify(company)}_${i}`,
          sourceFile: "halal_quality_cert",
          fda_number:    null,
          barcode:       null,
          company_contact: null,
        });
      });
    }
  });

  return records;
}

// ---------------------------------------------------------------------------
// SOURCE D: hfsaa_certified_products.csv  (HFSAA — US-based certifier)
// Columns: Company Name | Certified Products
//
// Very minimal. "Certified Products" is free text like "All Products" or
// "Chicken - Whole & Parts". We keep it as-is; the normaliser will clean it.
// ---------------------------------------------------------------------------
function loadHFSAA(filePath) {
  const rows = readCSV(filePath);
  const records = [];

  rows.forEach((r) => {
    const company = r["Company Name"] || null;
    const productList = r["Certified Products"] || "";

    // "All Products" or "All Meals" — keep as one company-level record
    if (productList.toLowerCase().startsWith("all")) {
      records.push({
        rawName: productList,
        rawCategory: "",
        rawCompany: company,
        rawStatus: "Halal",
        soldIn: [],
        certBody: "HFSAA",
        certNum: null,
        certIssue: null,
        certExpiry: null,
        healthInfo:  null,
        typicalUses: [],
        marketplace: null,
        sourceId: `hfsaa_${slugify(company || "")}_all`,
        sourceFile: "hfsaa_certified",
        fda_number:    null,
        barcode:       null,
        company_contact: null,
      });
    } else {
      const products = productList.split(",").map((p) => p.trim()).filter(Boolean);
      products.forEach((product, i) => {
        records.push({
          rawName: product,
          rawCategory: "",
          rawCompany: company,
          rawStatus: "Halal",
          soldIn: [],
          certBody: "HFSAA",
          certNum: null,
          certIssue: null,
          certExpiry: null,
          healthInfo:  null,
          typicalUses: [],
          marketplace: null,
          sourceId: `hfsaa_${slugify(company || "")}_${i}`,
          sourceFile: "hfsaa_certified",
          fda_number:    null,
          barcode:       null,
          company_contact: null,
        });
      });
    }
  });

  return records;
}

// ---------------------------------------------------------------------------
// SOURCE E: THIDAA.csv  (Taiwan halal certification body)
// Columns: Serial Number | Establishments with Certified Products |
//          Certified Products | Category | Certificate Number |
//          Date of Issue | Date of Expiry | Remark
//
// Row 0 is Chinese headers — skip it (it's where Serial Number = "序號").
// Product descriptions often bundle multiple items: "Item A, Item B (Total 2)".
// We store the whole bundle as one record; the name normaliser will clean it.
// ---------------------------------------------------------------------------


function loadTHIDAA(filePath) {
  const rows = readCSV(filePath);
  const records = [];

  rows
    .filter((r) => r["Serial Number"] !== "序號" && r["Serial Number"] !== "") //ghost row
    .forEach((r) => {
      const company = r["Establishments with Certified Products"] || null;
      const category = r["Category"] || "";
      const certNum  = r["Certificate Number"] || null;
      const certIssue  = r["Date of Issue"]  || null;
      const certExpiry = r["Date of Expiry"] || null;
      const rawFull  = r["Certified Products"] || "";

      // "series" rows don't list individual products — keep as one record
      const isSeries = /series|系列/i.test(rawFull);

      if (isSeries) {
        records.push({
          rawName:     rawFull,
          rawCategory: category,
          rawCompany:  company,
          rawStatus:   "Halal",
          soldIn: [],
          certBody:    "THIDAA Taiwan",
          certNum,
          certIssue,
          certExpiry,
          healthInfo:  null,
          typicalUses: [],
          marketplace: null,
          sourceId:    `thidaa_${certNum || r["Serial Number"]}`,
          sourceFile:  "thidaa",
          fda_number:    null,
          barcode:       null,
          company_contact: null,
        });

      } else {
        // Strip Chinese characters + count markers before splitting
        const englishOnly = rawFull
          .replace(/[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]+/g, "")
          .replace(/無中文品名|無中文名稱/g, "")
          .replace(/\(Total\s+\d+\s+Items?\)/gi, "")
          .replace(/（共[^）]*）/g, "")
          .replace(/\(\s*\d+\s*Items?\s*\)/gi, "")
          .replace(/\n/g, " ")
          .trim();

        // Split on "),  NextProduct" — closing paren followed by capital letter
        const parts = englishOnly
          .split(/\)\s*[,.]\s*(?=[A-Z])/)
          .map((p) => {
            p = p.trim();
            // Re-attach closing paren if it was the split boundary
            if (p && !p.endsWith(")") && !p.endsWith(".")) p = p + ")";
            return p;
          })
          .map((p) => p.replace(/\)+$/, ")").trim())
          .filter((p) => p.length > 5);

        // If splitting yielded nothing useful, fall back to the whole string
        const products = parts.length > 0 ? parts : [rawFull];

        products.forEach((product, i) => {
          records.push({
            rawName:     product,
            rawCategory: category,
            rawCompany:  company,
            rawStatus:   "Halal",
            soldIn: [],
            certBody:    "THIDAA Taiwan",
            certNum,
            certIssue,
            certExpiry,
            healthInfo:  null,
            typicalUses: [],
            marketplace: null,
            sourceId:    `thidaa_${certNum || r["Serial Number"]}_${i}`,
            sourceFile:  "thidaa",
            fda_number:    null,
            barcode:       null,
            company_contact: null,
          });
        });
      }
    });

  return records;
}

// ---------------------------------------------------------------------------
// SOURCE F: Thailand Halal files (halal.co.th)
// Files: Chemical, Food, Drinks, Meat, Health & Beauty, Others,
//        Services, Herbal Medicine, Utilities
//
// All 9 files share the same schema:
//   name | product_name | halal_code | fda_number | barcode | expiry_date |
//   company_name | company_address | company_email | cordinator_name |
//   cordinator_contact | long_product_detail | image_link | category
//
// "name" = brand name. "product_name" = product. Both can be "-" or "N/A".
// halal_code is the Thai halal certificate number — store as certNum.
// expiry_date is DD/MM/YYYY — normaliseDate handles this already.
// All records are certified halal — being listed means certified.
// ---------------------------------------------------------------------------
function loadThailand(filePath) {
  const rows = readCSVRelaxed(filePath);
  const records = [];

  rows.forEach((r) => {
    const brand     = (r["name"]         || "").trim().replace(/^-$/, "");
    const product   = (r["product_name"] || "").trim().replace(/^-$|^N\/A$/i, "");
    const company   = (r["company_name"] || "").trim().replace(/^-$/, "");
    const category  = (r["category"]     || "").trim();
    const halalCode = (r["halal_code"]   || "").trim().replace(/^N\/A$/i, "") || null;
    const fdaNum    = (r["fda_number"]   || "").trim().replace(/^N\/A$/i, "") || null;
    const barcode   = (r["barcode"]      || "").trim().replace(/^N\/A$/i, "") || null;
    const expiry    = normaliseDate(r["expiry_date"] || null);
    const address = sanitizeString((r["company_address"]     || "").trim().replace(/^-$/, "")) || null;
    const email   = sanitizeString((r["company_email"]       || "").trim().replace(/^-$/, "")) || null;
    const detail  = sanitizeString((r["long_product_detail"] || "").trim().replace(/^-$/, "")) || null;
    // Don't store detail if it's just a repeat of the product name
    const healthInfo = (detail && detail.toLowerCase() !== (product || brand).toLowerCase()) 
      ? detail 
      : null;
    const contact = [email, (r["cordinator_contact"] || "").trim().replace(/^-$/, "")]
    .filter(Boolean)
    .join(" | ") || null;

    if (!brand && !product) return;

    const rawName    = product || brand
    const rawCompany = company
      ? (address ? `${company} (${address})` : company)
      : brand || null;

    records.push({
      rawName,
      rawCategory: category,
      rawCompany,
      rawStatus:   "Halal",
      soldIn: [],
      certBody:    "Halal.co.th Thailand",
      certNum:     halalCode,      
      certIssue:   null,
      certExpiry:  expiry,
      healthInfo:  healthInfo || null,
      typicalUses: [],
      marketplace: null,
      sourceId:    `thailand_${halalCode || slugify(rawName).slice(0, 40)}`,
      sourceFile:  "thailand_halal",
      fda_number:      fdaNum,
      barcode:         barcode,
      company_contact:   contact,
    });
  });

  return records;
}

// ---------------------------------------------------------------------------
// SOURCE G: sanha_halal_v5.csv  (SANHA — South Africa)
// Columns: E-Number | Name | Alternative Name | Function | Status | Source |
//          Health Info | Uses | Link
//
// This is a second E-number source, richer than halal_e_numbers_india.csv.
// E-Number field looks like "E-number: 100" so we extract just the code.
// Status is "Halaal" (South African spelling) — normalise to "Halal".
// We route these into the same Additive collection as the India E-numbers.
// ---------------------------------------------------------------------------
function loadSANHA(filePath) {
  const rows = readCSVRelaxed(filePath); 
  return rows
  .filter((r) => /^E-number:/i.test((r["E-Number"] || "").trim()))
  .map((r) => {
    // Extract just the numeric/alphanumeric code from "E-number: 100"
    const rawEField = r["E-Number"] || "";
    const codeMatch = rawEField.match(/E-number[:\s]+([0-9a-z()]+)/i);
    const eCode = codeMatch ? `E${codeMatch[1]}` : rawEField;
    // Extract clean name — truncate at first noise marker
    const rawNameField = (r["Name"] || "").trim();

    // Split out the alternative names if they bled into the Name field
    // Split out the alternative names if they bled into the Name field
    const altNameMatch = rawNameField.match(/Alternative Names?\s*[:\s]+([^.]+?)(?:Function:|Status:|Source:|$)/i);
    let altName = altNameMatch 
      ? altNameMatch[1].trim().replace(/\s+/g, " ").replace(/[.;,]+$/, "")
      : (r["Alternative Name"] || "").trim()
          .replace(/^Alternative Names?\s*[:\s]+/i, "")
          .replace(/[.;,]+$/, "")
          .trim();

    // ← ADD THIS: strip any remaining noise that bled in
    altName = altName
      .replace(/Function\s*:.*/i, "")
      .replace(/Status\s*:.*/i, "")
      .replace(/Source\s*:.*/i, "")
      .replace(/Colouring.*/i, "")
      .replace(/\s+/g, " ")
      .trim();

    // If altName ended up empty after cleaning, treat as no alt name
    if (!altName) altName = null;
    // Clean the main name
    const cleanBaseName = rawNameField
      .replace(/Alternative Names?\s*:?.*/i, "")
      .replace(/Function\s*:.*/i, "")
      .replace(/Status\s*:.*/i, "")
      .replace(/Source\s*:.*/i, "")
      .replace(/\s+/g, " ")
      .trim();

    // Build final rawName: "E100 Curcumin (Turmeric Yellow; Diferuloylmethane)"
    const rawName = altName
      ? `${eCode} ${cleanBaseName} (${altName})`.trim()
      : `${eCode} ${cleanBaseName}`.trim();

    // Extract source from the Name field or Source column
    const sourceRaw = (r["Source"] || "")
      .trim()
      .replace(/^Source\s*[:\s]+/i, "")  // strip "Source:" prefix if present
      .trim() || null;

    // Build healthInfo: combine source + existing health info
    const healthRaw = (r["Health Info"] || "").trim();
    const healthClean = healthRaw
      .replace(/^Health Code:\s*(Green|Red\+*|Yellow)\s*/i, "")
      .trim() || null;

    const healthInfo = [sourceRaw, healthClean]
      .filter(Boolean)
      .join(" | ") || null;

    // SANHA uses "Halaal" spelling — map to canonical "Halal"
    const nameBlob = (r["Name"] || "").trim();
    const statusMatch = nameBlob.match(/Status\s*:\s*(\w+)/i);
    const rawSt = statusMatch
      ? statusMatch[1].trim()           // extract from blob if present
      : (r["Status"] || "").trim();     // fall back to Status column

    let status = "Halal";
    if (/haram/i.test(rawSt))     status = "Haraam";
    if (/mushbooh/i.test(rawSt))  status = "Mushbooh";
    if (/mash?booh/i.test(rawSt)) status = "Mushbooh";
  
    const usesRaw = (r["Uses"] || "").trim();
    const usesClean = usesRaw
      .replace(/\s*Other Uses:.*$/i, "")
      .replace(/Other\s*$/, "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    return {
      rawName:     rawName,
      rawCategory: r["Function"] || "Additive",
      rawCompany:  null,
      rawStatus:   status,
      soldIn: [],
      certBody:    "SANHA South Africa",
      certNum:     null,
      certIssue:   null,
      certExpiry:  null,
      healthInfo:  healthInfo,
      typicalUses: usesClean,
      marketplace: null,
      sourceId:    `sanha_${slugify(eCode)}`,
      sourceFile:  "sanha_halal",
      fda_number:    null,
      barcode:       null,
      company_contact: null,
    };
  });
}

// ---------------------------------------------------------------------------
// SOURCE H: products.json  (HMA — Halal product ruling database)
// Fields: category | brandname | productname | ruling | checkdate | remarks
//
// JSON format — use fs.readFileSync + JSON.parse instead of readCSV.
// Has 4 ruling types:
//   "HMA Certified" → Halal
//   "Approved"      → Halal  
//   "Not Approved"  → Haraam
//   "Undetermined"  → Mushbooh
// checkdate format: "Mar 12, 2026" — normaliseDate handles this.
// ---------------------------------------------------------------------------
function loadHMA(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const rows = JSON.parse(raw);

  return rows.map((r) => {
    const ruling = (r["ruling"] || "").trim();

    let status = "Halal";
    if (ruling === "Not Approved")  status = "Haraam";
    if (ruling === "Undetermined")  status = "Mushbooh";
    // "HMA Certified" and "Approved" both stay as "Halal"

    const brand   = (r["brandname"]   || "").trim();
    const product = (r["productname"] || "").trim();

    return {
      rawName:     product,
      rawCategory: r["category"] || "",
      rawCompany:  brand || null,
      rawStatus:   status,
      soldIn: [],
      certBody:    "HMA",
      certNum:     null,
      certIssue:   normaliseDate(r["checkdate"] || null),
      certExpiry:  null,
      healthInfo:  r["remarks"] || null,
      typicalUses: [],
      marketplace: null,
      sourceId:    `hma_${slugify(product)}`,
      sourceFile:  "hma_products",
      fda_number:    null,
      barcode:       null,
      company_contact: null,
    };
  });
}

// ---------------------------------------------------------------------------
// SOURCE I: NIHT.csv  (NIHT — National Independent Halaal Trust, South Africa)
// Columns: Company | Categories | Province | Commencement of Certification |
//          Certificate Issue Date | Certificate Expiry Date | Certificate Number
//
// Company-centric like HQC — no individual product names, just certified companies.
// We create one record per company. Province is extra metadata we store in company.
// Date formats are mixed: "10 Oct 25", "06/10/2025", "3 Oct 2025" — store as-is,
// the canonical layer picks earliest expiry by string sort which works for ISO dates.
// For non-ISO dates (e.g. "28/02/2026") we normalise to YYYY/MM/DD for safe sorting.
// ---------------------------------------------------------------------------

function loadNIHT(filePath) {
  const rows = readCSV(filePath);
  return rows.map((r) => {
    const company  = r["Company"] || "";
    const province = r["PROVINCE"] || "";
    const fullCompany = province ? `${company} (${province})` : company;

    return {
      rawName:     company,          
      rawCategory: r["Categories"] || "",
      rawCompany:  fullCompany,
      rawStatus:   "Halal",
      soldIn: [],
      certBody:    "NIHT South Africa",
      certNum:     r["CERTIFICATE NUMBER"] || null,
      certIssue:  normaliseDate(r["CERTIFICATE ISSUE DATE"] || null),
      certExpiry:  normaliseDate(r["CERTIFICATE EXPIRY DATE"] || null),
      healthInfo:  null,
      typicalUses: [],
      marketplace: null,
      sourceId:    `niht_${slugify(r["CERTIFICATE NUMBER"] || company)}`,
      sourceFile:  "niht",
      fda_number:    null,
      barcode:       null,
      company_contact: null,
    };
  });
}

// ---------------------------------------------------------------------------
// SOURCE J: halal_products.csv + halal_products__2_.csv  (IFANCA)
// IFANCA = Islamic Food and Nutrition Council of America
// Columns: Product Category | Product Title (or Product_title) | Company Name |
//          Sold In | Marketplace Availability
//
// Two files with identical schema except the title column name differs:
//   File 1: "Product Title"  (space)
//   File 2: "Product_title"  (underscore)
// We handle both with a fallback in the loader.
//
// 272 rows in file 1 have null Sold In — these are still certified halal,
// they just don't have geographic data. We store soldIn as [] in that case.
//
// Marketplace Availability tells us the sales channel (Retail, Direct
// Marketing, Industry, FoodService). Stored as a new `marketplace` field
// and unioned into the canonical record alongside sold_in.
//
// Filter: two ghost header rows exist where Product Category = "Product Category"
// — these are CSV artefacts and must be skipped.
// ---------------------------------------------------------------------------
function loadIFANCA(filePath) {
  const rows = readCSV(filePath);
  const records = [];

  rows.forEach((r) => {
    // Skip ghost header rows that slipped through the CSV export
    if (r["Product Category"] === "Product Category") return;

    // Handle the column name inconsistency between file 1 and file 2
    const rawTitle = (r["Product Title"] || r["Product_title"] || "").trim();
    if (!rawTitle) return; // skip genuinely empty rows

    const soldInRaw = (r["Sold In"] || "").trim();
    const marketplace = (r["Marketplace Availability"] || "").trim();

    records.push({
      rawName:     rawTitle,
      rawCategory: r["Product Category"] || "",
      rawCompany:  r["Company Name"] || null,
      rawStatus:   "Halal", // IFANCA listing = certified halal
      soldIn:      soldInRaw ? [soldInRaw] : [],
      certBody:    "IFANCA",
      certNum:     null,
      certIssue:   null,
      certExpiry:  null,
      healthInfo:  null,
      typicalUses: [],
      marketplace: marketplace || null,
      sourceId:    `ifanca_${slugify(rawTitle).slice(0, 50)}`,
      sourceFile:  "ifanca",
      fda_number:      null,
      barcode:         null,
      company_contact: null,
    });
  });

  return records;
}

// SOURCE K: JAKIM_products.csv

function loadJAKIM(filePath) {
  const rows = readCSV(filePath);
  const records = [];

  rows.forEach((r) => {
    const productName = (r["product_name"] || "").trim();
    const brandName = (r["brand_name"] || "").trim();
    const companyName = (r["company_name"] || "").trim();

    if (!productName && !brandName) return;

    const rawName = brandName && productName && brandName !== productName
      ? `${brandName} ${productName}`
      : productName || brandName;

    records.push({
      rawName: rawName,
      rawCategory: "", 
      rawCompany: companyName || brandName || null,
      rawStatus: "Halal",
      soldIn: ["Malaysia"], 
      certBody: r["certifying_body"] || "JAKIM", 
      certNum: null,
      certIssue: null,
      certExpiry: normaliseDate(r["expiry_date"]), 
      healthInfo: null,
      typicalUses: [],
      marketplace: null,
      sourceId: `jakim_${slugify(rawName)}_${slugify(companyName || "").slice(0, 20)}`,
      sourceFile: "jakim",
      fda_number: null,
      barcode: null,
      company_contact: null,
    });
  });

  return records;
}

//---------------------------------------------------------------------------
// HELPER: Normalise mixed date formats to YYYY/MM/DD for consistent sorting.
// Handles: "06/10/2025", "10 Oct 25", "3 Oct 2025", "28/02/2026"
// Returns null if unparseable.
// ---------------------------------------------------------------------------
function normaliseDate(raw) {
  if (!raw) return null;
  const s = raw.trim();

  // Already YYYY/MM/DD or YYYY-MM-DD
  if (/^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(s)) return s.replace(/-/g, "/");

  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}/${dmy[2].padStart(2,"0")}/${dmy[1].padStart(2,"0")}`;

  // "3 Oct 2025" or "10 Oct 25"
  const months = { jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
                   jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12" };
  const textDate = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})$/);
  if (textDate) {
    const mm = months[textDate[2].toLowerCase()];
    const yyyy = textDate[3].length === 2 ? `20${textDate[3]}` : textDate[3];
    return mm ? `${yyyy}/${mm}/${textDate[1].padStart(2,"0")}` : null;
  }

  // "Mar 12, 2026" — month name first (HMA format)
  const mdy = s.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (mdy) {
    const mm = months[mdy[1].toLowerCase()];
    const yyyy = mdy[3];
    return mm ? `${yyyy}/${mm}/${mdy[2].padStart(2, "0")}` : null;
  }

  return null; // unparseable — return null rather than garbage
}


// ---------------------------------------------------------------------------
// HELPER: Extract halal status keyword from a description string.
// Used for E-numbers which embed status as text ("Halal if …", "Mushbooh").
// Returns one of three canonical statuses.
// ---------------------------------------------------------------------------
function extractHalalStatus(description) {
  const d = description.toLowerCase();

  // Patterns that mean "unconditionally Haraam" — the whole additive is Haraam
  // E.g. "Haraam" alone, or "Haraam - derived from pork"
  const unconditionalHaraam = /^haraa?m\b/i.test(description.trim());
  if (unconditionalHaraam) return "Haraam";

  // If description ONLY mentions Haraam in a conditional clause,
  // don't let it override the primary status.
  // "Haraam if X" / "Haraam when X" = still usable, not blanket Haraam
  const conditionalHaraamOnly =
    (d.includes("haraam") || d.includes("haram")) &&
    !d.includes("halal") &&
    !/^haraa?m\s*$/i.test(d.trim()); // not just the single word "Haraam"
  if (conditionalHaraamOnly) return "Halal";

  // Count mentions — if Halal appears more, it's the dominant status
  const halalaCount  = (d.match(/halal/gi) || []).length;
  const haraamCount  = (d.match(/haraa?m/gi) || []).length;
  const mushboohCount = (d.match(/mushbooh|masbooh|mashbooh/gi) || []).length;

  // Unconditional single-word "Haraam" — genuinely prohibited
  if (/^haraa?m\s*$/i.test(d.trim())) return "Haraam";

  // Mushbooh mentioned more than or equal to Halal → doubtful
  if (mushboohCount > 0 && mushboohCount >= halalaCount) return "Mushbooh";

  if (haraamCount > 0 && halalaCount > 0) return "Mushbooh";

  // Haraam mentioned with no Halal context at all
  if (haraamCount > 0 && halalaCount === 0) return "Haraam";

  return "Halal";
}

// ---------------------------------------------------------------------------
// HELPER: Create a URL-safe slug from any string (used for stable sourceIds).
// e.g. "Al-Kawthar Poultry" → "al-kawthar-poultry"
// ---------------------------------------------------------------------------
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, "")        // strip leading/trailing hyphens
    .slice(0, 60);                 // cap length so IDs stay readable
}

// =============================================================================
// RUN STAGE 1: Load all 5 sources into one flat array
// =============================================================================

const SOURCE_DIR = path.join(__dirname, "data");

let allRecords = [
  ...loadENumbers(path.join(SOURCE_DIR, "halal_e_numbers_india.json")),
  ...loadHFCE(path.join(SOURCE_DIR, "hfce_halal_products.csv")),
  ...loadHQC(path.join(SOURCE_DIR, "Halal-Quality-Certification.csv")),
  ...loadHFSAA(path.join(SOURCE_DIR, "hfsaa_certified_products.csv")),
  ...loadTHIDAA(path.join(SOURCE_DIR, "THIDAA.csv")),
  ...loadSANHA(path.join(SOURCE_DIR, "sanha_halal_v5.csv")),
  ...loadHMA(path.join(SOURCE_DIR, "HMA-products.json")),
  ...loadNIHT(path.join(SOURCE_DIR, "NIHT.csv")),
  ...loadThailand(path.join(SOURCE_DIR, "Chemical_Thailand_Cleaned.csv")),
  ...loadThailand(path.join(SOURCE_DIR, "Food_Thailand_Cleaned.csv")),
  ...loadThailand(path.join(SOURCE_DIR, "Halal_Drinks_Thailand.csv")),
  ...loadThailand(path.join(SOURCE_DIR, "Meat_Thailand.csv")),
  ...loadThailand(path.join(SOURCE_DIR, "Health_and_Beauty_Products_Thailand.csv")),
  ...loadThailand(path.join(SOURCE_DIR, "Others_Thailand.csv")),
  ...loadThailand(path.join(SOURCE_DIR, "Services_Thailand.csv")),
  ...loadThailand(path.join(SOURCE_DIR, "Herbal_medicine_Thailand.csv")),
  ...loadThailand(path.join(SOURCE_DIR, "Utilities_Thailand.csv")),
  ...loadIFANCA(path.join(SOURCE_DIR, "halal_products.csv")),
  ...loadIFANCA(path.join(SOURCE_DIR, "halal_products_2.csv")),
  ...loadJAKIM(path.join(SOURCE_DIR, "JAKIM_products.csv")),
];
console.log(`      (E-numbers: ${loadENumbers(path.join(SOURCE_DIR,"halal_e_numbers_india.json")).length})`);
console.log(`      (HFCE: ${loadHFCE(path.join(SOURCE_DIR,"hfce_halal_products.csv")).length})`);
console.log(`      (HQC: ${loadHQC(path.join(SOURCE_DIR,"Halal-Quality-Certification.csv")).length})`);
console.log(`      (HFSAA: ${loadHFSAA(path.join(SOURCE_DIR,"hfsaa_certified_products.csv")).length})`);
console.log(`      (THIDAA: ${loadTHIDAA(path.join(SOURCE_DIR,"THIDAA.csv")).length})`);
console.log(`      (NIHT: ${loadNIHT(path.join(SOURCE_DIR,"NIHT.csv")).length})`);
console.log(`      (SANHA: ${loadSANHA(path.join(SOURCE_DIR,"sanha_halal_v5.csv")).length})`);
console.log(`      (Thailand: ${[
  "Chemical_Thailand_Cleaned.csv",
  "Food_Thailand_Cleaned.csv", 
  "Halal_Drinks_Thailand.csv",
  "Meat_Thailand.csv",
  "Health_and_Beauty_Products_Thailand.csv",
  "Others_Thailand.csv",
  "Services_Thailand.csv",
  "Herbal_medicine_Thailand.csv",
  "Utilities_Thailand.csv"
].reduce((sum, f) => sum + loadThailand(path.join(SOURCE_DIR, f)).length, 0)})`);
console.log(`      (IFANCA: ${
  loadIFANCA(path.join(SOURCE_DIR, "halal_products.csv")).length +
  loadIFANCA(path.join(SOURCE_DIR, "halal_products_2.csv")).length
})`);
console.log(`    (JAKIM: ${loadJAKIM(path.join(SOURCE_DIR, "JAKIM_products.csv")).length})`);

console.log(`  ✅  Loaded ${allRecords.length} raw records from 20 sources`);
// =============================================================================
// STAGE 2 — NAME NORMALISATION
// =============================================================================
//
// Each product name comes with noise that has nothing to do with what the
// product actually IS. If we embed dirty names, two records for the same
// product will land far apart in vector space just because one has "&#8211;"
// and the other doesn't.
//
// We apply a chain of cleaning transforms in a deliberate order:
//   HTML decode → lowercase → strip cert codes → collapse whitespace → trim
//
// The ORDER matters: lowercase before regex matching so patterns don't need
// case variants. HTML decode before anything else so entities don't survive.
// =============================================================================

console.log("\n🧹  STAGE 2 — Normalising names...\n");

// ---------------------------------------------------------------------------
// HTML entity decoder — handles the most common named + numeric entities.
// HFCE is the main offender: &#8211; (–), &#8482; (™), &amp; (&), etc.
// We do this manually rather than pulling in a DOM library to keep deps light.
// ---------------------------------------------------------------------------
function decodeHTMLEntities(str) {
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#8211;/g, "-")   // en-dash → hyphen
    .replace(/&#8212;/g, "-")   // em-dash → hyphen
    .replace(/&#8482;/g, "")    // ™ → remove
    .replace(/&#174;/g, "")     // ® → remove
    .replace(/&#\d+;/g, " ")    // any remaining numeric entities → space
    .replace(/&[a-z]+;/gi, " "); // any remaining named entities → space
}

// ---------------------------------------------------------------------------
// Strip certification/batch codes that appear inside product names.
// Examples from THIDAA: "(Total 2 Items)", "（共七項產品）"
// Examples from HFCE:   "PNG2 WPC35", "FOF Probiotic"
//
// We remove patterns like:
//   - "(Total N Items)" or "(N Items)" in English
//   - Parenthetical Chinese text: （...）
//   - Standalone all-caps codes 3+ chars with digits: "WPC35", "PNG2"
//   - Newlines embedded in multi-item descriptions (\n)
// ---------------------------------------------------------------------------
function stripCertCodes(str) {
  return str
    .replace(/\(total\s+\d+\s+items?\)/gi, "")  // "(Total 2 Items)"
    .replace(/（[^）]*）/g, "")                   // （Chinese parenthetical）
    .replace(/\([^)]*共[^)]*\)/g, "")            // (共N項) Chinese count markers
    .replace(/\b[A-Z]{2,}\d+\b/g, "")            // standalone codes: PNG2, WPC35
    .replace(/\b\d+[A-Z]{2,}\b/g, "")            // reverse: 35WPC
    .replace(/\n/g, " ");                         // embedded newlines → space
}

// ---------------------------------------------------------------------------
// The main normalise function: applies the full cleaning chain.
// Returns a lowercase, compact, noise-free name string.
// ---------------------------------------------------------------------------
function normaliseName(rawName) {
  if (!rawName) return "";

  let name = rawName;

  // Step 1: Decode HTML entities first — must happen before any text matching
  name = decodeHTMLEntities(name);

  // Step 2: Lowercase — so "Chicken" and "chicken" match in later dedup
  name = name.toLowerCase();

  // Step 3: Remove cert codes and Chinese count markers
  name = stripCertCodes(name);

  // Step 4: Remove content inside square brackets (often footnotes or codes)
  name = name.replace(/\[[^\]]*\]/g, "");

  // Step 5: Strip leading punctuation/numbers that are just source artifacts
  // e.g. "1. Prince Pharmaceutical" → "Prince Pharmaceutical"
  name = name.replace(/^\d+[\.\)]\s*/, "");

  // Step 6: Collapse multiple spaces into one, then trim edges
  name = name.replace(/\s+/g, " ").trim();

  return name;
}

// ---------------------------------------------------------------------------
// Apply normalisation to every record.
// We keep the original rawName so we can show it in the audit output.
// ---------------------------------------------------------------------------
allRecords = allRecords.map((record) => ({
  ...record,
  normName: normaliseName(record.rawName),
  normCompany: normaliseName(record.rawCompany || ""),
}));

console.log("  ✅  Names normalised");
console.log("  Sample transforms:");
// Show a few before/after examples so you can sanity-check the output
const examples = allRecords
  .filter((r) => r.rawName !== r.normName && r.normName.length > 3)
  .slice(0, 5);
examples.forEach((r) =>
  console.log(`      "${r.rawName.slice(0, 55)}" → "${r.normName.slice(0, 55)}"`)
);

// =============================================================================
// STAGE 3 — CATEGORY MAPPING
// =============================================================================
//
// Every source uses its own category vocabulary:
//   HFCE:   "Skin Care products, Skincare Products"
//   THIDAA: "Healthy Food", "Leisure Food", "Flavoring"
//   HQC:    "Producers", "Slaughterhouses", "Travel agencies"
//   HFSAA:  (empty — no category column)
//
// We map ALL of these onto a two-level canonical taxonomy:
//   L1 (broad):   Food, Beverage, Additive, Cosmetic, Pharma, Non-food, Service
//   L2 (specific): Meat & Poultry, Dairy, Sauce & Paste, Skin Care, etc.
//
// Why two levels?
//   - Cluster WITHIN L1 groups (don't mix "Skin Cream" with "Chicken Burger")
//   - L2 gives finer grouping once you're already inside an L1 bucket
// =============================================================================

console.log("\n🗂️   STAGE 3 — Mapping categories...\n");

// ---------------------------------------------------------------------------
// The mapping table: keys are lowercase fragments that appear in raw category
// strings. Values are [l1, l2] canonical labels.
//
// Matching strategy: we check if the raw category CONTAINS the key string.
// Longer/more-specific keys are checked first to avoid "meat" matching
// before "meat & poultry" would.

const CATEGORY_MAP = [
  // ── HMA-specific categories (add inside CATEGORY_MAP, before broad entries) ──

  // ── E-number acids/salts not caught (Group 2) ─────────────
  ["acid",         ["Additive", "Preservative"]],     // acetic acid, lactic acid etc.
  ["phosphate",    ["Additive", "Food Additive"]],
  ["carbonate",    ["Additive", "Food Additive"]],
  ["carbon dioxide",["Additive","Food Additive"]],
  ["lactate",      ["Additive", "Food Additive"]],
  ["tartrate",     ["Additive", "Food Additive"]],
  ["citrate",      ["Additive", "Food Additive"]],

  // Dairy additions
  ["paneer",              ["Food", "Dairy"]],
  ["ghee",                ["Food", "Dairy"]],
  ["butter",              ["Food", "Dairy"]],
  ["yogurt",              ["Food", "Dairy"]],
  ["yoghurt",             ["Food", "Dairy"]],
  ["cream",               ["Food", "Dairy"]],
  ["rasmalai",            ["Food", "Dairy"]],    // Indian dairy sweet

  // Bakery additions  
  ["croissant",           ["Food", "Bakery"]],
  ["pastry",              ["Food", "Bakery"]],
  ["danish",              ["Food", "Bakery"]],
  ["muffin",              ["Food", "Bakery"]],
  ["waffle",              ["Food", "Bakery"]],
  ["pretzel",             ["Food", "Snacks & Confectionery"]],

  // Snacks additions
  ["chip",                ["Food", "Snacks & Confectionery"]],   // chips
  ["crisp",               ["Food", "Snacks & Confectionery"]],   // crisps
  ["popcorn",             ["Food", "Snacks & Confectionery"]],
  ["cracker",             ["Food", "Snacks & Confectionery"]],
  ["cookie",              ["Food", "Snacks & Confectionery"]],
  ["granola",             ["Food", "Snacks & Confectionery"]],
  ["candy",               ["Food", "Snacks & Confectionery"]],   // already there but confirm
  ["gummy",               ["Food", "Snacks & Confectionery"]],

  // Meat clarifications
  ["sausage",             ["Food", "Meat & Poultry"]],
  ["deli",                ["Food", "Meat & Poultry"]],
  ["jerky",               ["Food", "Meat & Poultry"]],
  ["pepperoni",           ["Food", "Meat & Poultry"]],
  ["salami",              ["Food", "Meat & Poultry"]],
  ["hot dog",             ["Food", "Meat & Poultry"]],
  ["burger patty",        ["Food", "Meat & Poultry"]],

  // Condiment additions
  ["ketchup",             ["Food", "Sauce & Paste"]],
  ["mustard",             ["Food", "Sauce & Paste"]],
  ["mayo",                ["Food", "Sauce & Paste"]],
  ["mayonnaise",          ["Food", "Sauce & Paste"]],
  ["salsa",               ["Food", "Sauce & Paste"]],
  ["hummus",              ["Food", "Sauce & Paste"]],
  ["pesto",               ["Food", "Sauce & Paste"]],
  ["vinegar",             ["Food", "Sauce & Paste"]],

  // Frozen food
  ["frozen",              ["Food", "General Food"]],
  ["pizza",               ["Food", "General Food"]],
  ["dumpling",            ["Food", "General Food"]],
  ["noodle",              ["Food", "General Food"]],
  ["ramen",               ["Food", "General Food"]],
  ["pasta",               ["Food", "General Food"]],

  // Flour / grain
  ["flour",               ["Food", "General Food"]],
  ["grain",               ["Food", "General Food"]],
  ["rice",                ["Food", "General Food"]],
  ["oat",                 ["Food", "General Food"]],
  ["cereal",              ["Food", "Snacks & Confectionery"]],

  // ── Food ──────────────────────────────────────────────────────────────────
  ["honey",                 ["Food",     "Condiment & Spice"]],
  ["flatbread",             ["Food",     "Bakery"]],
  ["pita",                  ["Food",     "Bakery"]],
  ["bagel",                 ["Food",     "Bakery"]],
  ["naan",                  ["Food",     "Bakery"]],
  ["almond",                ["Food",     "Nuts & Seeds"]],     // also covers "almond base"
  ["cashew",                ["Food",     "Nuts & Seeds"]],
  ["walnut",                ["Food",     "Nuts & Seeds"]],
  ["pistachio",             ["Food",     "Nuts & Seeds"]],
  ["hummus",                ["Food",     "Sauce & Paste"]],
  ["pickle",                ["Food",     "Sauce & Paste"]],
  ["gyro",                  ["Food",     "Meat & Poultry"]],
  ["lahmacun",              ["Food",     "Meat & Poultry"]],
  ["panko",                 ["Food",     "Bakery"]],
  ["saffron",               ["Food",     "Condiment & Spice"]],
  ["glass cleaner",         ["Non-food", "Cleaning Product"]],
  ["chicken",               ["Food", "Meat & Poultry"]],
  ["poultry",               ["Food", "Meat & Poultry"]],
  ["meat",                  ["Food", "Meat & Poultry"]],
  ["beef",                  ["Food", "Meat & Poultry"]],
  ["lamb",                  ["Food", "Meat & Poultry"]],
  ["slaughterhouse",        ["Food", "Meat & Poultry"]],
  ["seafood",               ["Food", "Seafood"]],            // ← moved here, specific before "food"
  ["egg",                   ["Food", "Egg Products"]],       // ← moved here
  ["dairy",                 ["Food", "Dairy"]],
  ["cheese",                ["Food", "Dairy"]],
  ["milk",                  ["Food", "Dairy"]],
  ["ice cream",             ["Food", "Dairy"]],
  ["frozen yogurt",         ["Food", "Dairy"]],
  ["frozen novel",          ["Food", "Dairy"]],              // "Frozen Novelties" IFANCA category
  ["sauce",                 ["Food", "Sauce & Paste"]],
  ["paste",                 ["Food", "Sauce & Paste"]],
  ["condiment",             ["Food", "Sauce & Paste"]],
  ["dressing",              ["Food", "Sauce & Paste"]],      // "Sauces & Dressings" IFANCA
  ["baby food",             ["Food", "Baby & Infant"]],
  ["infant",                ["Food", "Baby & Infant"]],
  ["snack",                 ["Food", "Snacks & Confectionery"]],
  ["candy",                 ["Food", "Snacks & Confectionery"]], // ← moved here
  ["leisure food",          ["Food", "Snacks & Confectionery"]],
  ["confection",            ["Food", "Snacks & Confectionery"]],
  ["biscuit",               ["Food", "Snacks & Confectionery"]],
  ["chocolate",             ["Food", "Snacks & Confectionery"]],
  ["bakery",                ["Food", "Bakery"]],
  ["bread",                 ["Food", "Bakery"]],
  ["spice",                 ["Food", "Condiment & Spice"]],
  ["seasoning",             ["Food", "Condiment & Spice"]],
  ["fresh produce",         ["Food", "Fresh Produce"]],
  ["fruit",                 ["Food", "Fresh Produce"]],
  ["vegetable",             ["Food", "Fresh Produce"]],
  ["nut",                   ["Food", "Nuts & Seeds"]],       // "Nuts & Seeds" IFANCA
  ["seed",                  ["Food", "Nuts & Seeds"]],
  ["food material",         ["Food", "General Food"]],
  ["food product",          ["Food", "General Food"]],
  ["food",                  ["Food", "General Food"]],       // broad catch-all — AFTER all specifics

  // ── Beverage ──────────────────────────────────────────────────────────────
  ["lemonade",            ["Beverage", "Juice"]],
  ["squash",            ["Beverage", "Juice"]],
  ["smoothie",            ["Beverage", "General Beverage"]],
  ["kombucha",            ["Beverage", "General Beverage"]],
  ["soda",                ["Beverage", "General Beverage"]],
  ["sparkling",           ["Beverage", "Water"]],
  ["energy drink",        ["Beverage", "General Beverage"]],
  ["sports drink",        ["Beverage", "General Beverage"]],
  ["root beer",           ["Beverage", "General Beverage"]],
  ["slurpee",             ["Beverage", "General Beverage"]],
  ["beverage",              ["Beverage", "General Beverage"]],
  ["drink",                 ["Beverage", "General Beverage"]],
  ["juice",                 ["Beverage", "Juice"]],
  ["water treatment",       ["Non-food", "Chemical"]],       // ← MUST be before "water"
  ["water",                 ["Beverage", "Water"]],
  ["tea",                   ["Beverage", "Tea & Coffee"]],
  ["coffee",                ["Beverage", "Tea & Coffee"]],
  ["syrup",                 ["Beverage", "Syrup & Concentrate"]],
  ["concentrate",           ["Beverage", "Syrup & Concentrate"]], // "Beverage Concentrates" IFANCA

  // ── Additive ──────────────────────────────────────────────────────────────
  ["additive",              ["Additive", "Food Additive"]],
  ["flavoring",             ["Additive", "Flavoring"]],
  ["flavour",               ["Additive", "Flavoring"]],
  ["flavor",                ["Additive", "Flavoring"]],      // "Flavors" IFANCA (no u)
  ["enzyme",                ["Additive", "Enzyme & Probiotic"]],
  ["probiotic",             ["Additive", "Enzyme & Probiotic"]],
  ["preservative",          ["Additive", "Preservative"]],
  ["color",                 ["Additive", "Colorant"]],
  ["colour",                ["Additive", "Colorant"]],
  ["coloring",              ["Additive", "Colorant"]],       // "Colorings" IFANCA
  ["emulsifier",            ["Additive", "Emulsifier"]],
  ["gelatin",               ["Additive", "Emulsifier"]],     // ← before "gel"
  ["antioxidant",           ["Additive", "Antioxidant"]],
  ["sugar alcohol",         ["Additive", "Sweetener"]],
  ["sweetener",             ["Additive", "Sweetener"]],      // "Sweeteners" IFANCA
  ["whey",                  ["Additive", "Dairy Ingredient"]], // ← MUST be before "protein"
  ["soy",                   ["Additive", "Soy Ingredient"]],
  ["botanical",             ["Additive", "Botanical Extract"]], // "Botanical Extracts" IFANCA
  ["extract",               ["Additive", "Botanical Extract"]],
  ["oil",                   ["Additive", "Vegetable Oil"]],  // "Vegetable Oils" IFANCA
  ["protein",               ["Pharma",   "Nutritional Supplement"]],

  // ── Cosmetic & Personal Care ───────────────────────────────────────────────
  ["cologne",             ["Cosmetic", "Fragrance"]],
  ["perfume",             ["Cosmetic", "Fragrance"]],
  ["deodorant",           ["Cosmetic", "Personal Care"]],
  ["toothpaste",          ["Cosmetic", "Personal Care"]],
  ["mouthwash",           ["Cosmetic", "Personal Care"]],
  ["sunscreen",           ["Cosmetic", "Skin Care"]],
  ["moisturizer",         ["Cosmetic", "Skin Care"]],
  ["moisturiser",         ["Cosmetic", "Skin Care"]],
  ["foundation",          ["Cosmetic", "Makeup"]],
  ["lipstick",            ["Cosmetic", "Makeup"]],
  ["mascara",             ["Cosmetic", "Makeup"]],
  ["skin care",             ["Cosmetic", "Skin Care"]],
  ["skincare",              ["Cosmetic", "Skin Care"]],
  ["cosmetic",              ["Cosmetic", "General Cosmetic"]],
  ["personal care",         ["Cosmetic", "Personal Care"]],
  ["fragrance",             ["Cosmetic", "Fragrance"]],
  ["essential oil",         ["Cosmetic", "Fragrance"]],      // ← before "oil"
  ["hair",                  ["Cosmetic", "Hair Care"]],
  ["shampoo",               ["Cosmetic", "Hair Care"]],
  ["lotion",                ["Cosmetic", "Skin Care"]],
  ["gel",                   ["Cosmetic", "Personal Care"]],
  ["soap",                  ["Cosmetic", "Personal Care"]],
  ["makeup",                ["Cosmetic", "Makeup"]],

  // ── Pharma & Health ───────────────────────────────────────────────────────
  ["protein powder",      ["Pharma", "Nutritional Supplement"]],
  ["collagen",            ["Pharma", "Nutritional Supplement"]],
  ["omega",               ["Pharma", "Nutritional Supplement"]],
  ["probiotic",           ["Additive", "Enzyme & Probiotic"]],  // already there
  ["multivitamin",        ["Pharma", "Vitamin"]],
  ["melatonin",           ["Pharma", "Health Product"]],
  ["nutritional supplement",["Pharma", "Nutritional Supplement"]],
  ["nutritional food",      ["Pharma", "Nutritional Food"]],
  ["nutritional",           ["Pharma", "Nutritional"]],
  ["healthy food",          ["Pharma", "Health Food"]],
  ["health",                ["Pharma", "Health Product"]],
  ["capsule",               ["Pharma", "Capsule"]],
  ["pharmaceutical",        ["Pharma", "Pharmaceutical"]],
  ["medical",               ["Pharma", "Medical"]],
  ["vitamin",               ["Pharma", "Vitamin"]],
  ["herbal",                ["Pharma", "Herbal Medicine"]],
  ["supplement",            ["Pharma", "Nutritional Supplement"]],

  // ── Non-food ──────────────────────────────────────────────────────────────
  ["non-food",              ["Non-food", "General Non-food"]],
  ["sanitation",            ["Non-food", "Cleaning Product"]],
  ["cleaning",              ["Non-food", "Cleaning Product"]],
  ["detergent",             ["Non-food", "Cleaning Product"]],
  ["chemical",              ["Non-food", "Chemical"]],       // catOnly matching — see mapCategory
  ["utility",               ["Non-food", "Utility"]],        // catOnly matching — see mapCategory
  ["candle",                ["Non-food", "General Non-food"]],

  // ── Services ──────────────────────────────────────────────────────────────
  ["restaurant",            ["Service", "Restaurant"]],
  ["hotel",                 ["Service", "Hospitality"]],
  ["hotelier",              ["Service", "Hospitality"]],
  ["travel",                ["Service", "Travel"]],
  ["school",                ["Service", "Education"]],
  ["retail",                ["Service", "Retail"]],
  ["spa",                   ["Service", "Wellness"]],
  ["sme",                   ["Service", "General Business"]],
  ["producer",              ["Service", "Producer / Manufacturer"]],

  // ── Catch-all ─────────────────────────────────────────────────────────────
  ["",                      ["Uncategorised", "Unknown"]],
];

// ---------------------------------------------------------------------------
// Map a raw category string to [l1, l2].
// We lowercase the input and check if it contains each key in order.
// The first match wins — so put specific keys before broad ones.
// ---------------------------------------------------------------------------
function mapCategory(rawCategory, productName = "") {
  // We check both the category field AND the product name,
  // because HFSAA has no category column so we must infer from the product name.
  const haystack = `${rawCategory} ${productName}`.toLowerCase();
  const catOnly  = rawCategory.toLowerCase();

  // Keys that are too common as substrings in product names
  // must only match the raw category field, not the product name
  const categoryOnlyKeys = new Set(["chemical", "utility", "chicken", "beef", "lamb", "poultry", "slaughterhouse",]);

  for (const [key, [l1, l2]] of CATEGORY_MAP) {
    if (key === "") return { l1, l2 };
    const target = categoryOnlyKeys.has(key) ? catOnly : haystack;

    if (target.includes(key)) {
      return { l1, l2 };
    }
  } 

  // Should never reach here because "" always matches — but TypeScript safety
  return { l1: "Uncategorised", l2: "Unknown" };
}

// Apply category mapping to every record
allRecords = allRecords.map((record) => {
  const { l1, l2 } = mapCategory(record.rawCategory, record.normName);
  return { ...record, categoryL1: l1, categoryL2: l2 };
});

// Show a distribution summary so you can see if the mapping is working
const l1Dist = {};
allRecords.forEach((r) => { l1Dist[r.categoryL1] = (l1Dist[r.categoryL1] || 0) + 1; });
console.log("  ✅  Categories mapped. Distribution:");
Object.entries(l1Dist)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => console.log(`      ${cat.padEnd(18)} ${count} records`));

// =============================================================================
// STAGE 4 — ENTITY RESOLUTION (fuzzy dedup)
// =============================================================================
//
// The same product will appear in multiple sources with slightly different names:
//   "Osmolite 1.2"  vs  "osmolite 1.2 ready to hang"
//   "Gain Plus PNG2" vs  "gain plus advance png2"
//
// If we keep both as separate records and embed them, they'll form TWO nearby
// points in vector space — a false split. Worse, queries will only hit one.
//
// STRATEGY:
//   Within each L1 category, compare every pair of normalised names using
//   Levenshtein edit distance. If the distance is below a threshold (relative
//   to string length), we call them the same entity and merge them.
//
// WHY LEVENSHTEIN?
//   It counts character edits needed to turn one string into another.
//   "osmolite" → "osmolite 1.2" = 4 edits. Short relative distance = same product.
//   TF-IDF cosine would be better for long product descriptions, but Levenshtein
//   is zero-dependency and works well for short-to-medium product names.
//
// WHY WITHIN L1 ONLY?
//   "Gain" (food supplement) should never be compared to "Gain" (detergent).
//   Restricting to same-category cuts comparisons and prevents cross-domain merges.
//
// COMPLEXITY NOTE:
//   Naive O(n²) pairwise comparison. For n=11,000 records this is ~60M pairs —
//   too slow. We speed it up with a prefix-block: only compare pairs that share
//   their first 3 characters. This brings comparisons down to ~2-5% of naive.
// =============================================================================

console.log("\n🔗  STAGE 4 — Entity resolution (fuzzy dedup)...\n");

// ---------------------------------------------------------------------------
// SIMILARITY THRESHOLD: how similar must two names be to merge?
//
// We use a *normalised* edit distance: editDist / maxLength
//   0.0 = identical strings
//   1.0 = completely different
//
// THRESHOLD = 0.25 means: if you need to change more than 25% of the longer
// string's characters, they're different products.
// Lower = stricter (fewer merges). Raise if you want more aggressive dedup.
// ---------------------------------------------------------------------------
const SIMILARITY_THRESHOLD = 0.25;

// ---------------------------------------------------------------------------
// Build prefix blocks: group records by their first 3 chars of normName.
// Only records in the same block AND same L1 category are compared.
// ---------------------------------------------------------------------------
function buildPrefixBlocks(records) {
  const blocks = {};
  records.forEach((r, idx) => {
    if (r.normName.length < 3) return; // too short to block reliably
    const prefix = r.normName.slice(0, 3);
    const key = `${r.categoryL1}::${prefix}`; // block by category + prefix
    if (!blocks[key]) blocks[key] = [];
    blocks[key].push(idx); // store index into records array, not the record itself
  });
  return blocks;
}

// ---------------------------------------------------------------------------
// Union-Find (Disjoint Set Union) data structure.
//
// Why? We're doing pairwise comparisons and need to group records into clusters
// efficiently. Union-Find does this in near O(1) per operation.
//
// Think of it as a "which group does this record belong to?" tracker.
// When A and B are similar, we union() them into the same group.
// At the end, find(x) returns the group leader (canonical ID) for record x.
// ---------------------------------------------------------------------------
class UnionFind {
  constructor(n) {
    // Initially each record is its own group (parent[i] = i)
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  // find() with path compression: flattens the tree as it traverses,
  // so future finds are O(1) amortised
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // path compression
    }
    return this.parent[x];
  }

  // union() by rank: attach smaller tree under larger to keep depth shallow
  union(x, y) {
    const px = this.find(x);
    const py = this.find(y);
    if (px === py) return; // already in the same group
    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
    } else {
      this.parent[py] = px;
      this.rank[px]++;
    }
  }
}

// ---------------------------------------------------------------------------
// Run the dedup: build blocks, compare pairs, union similar ones.
// ---------------------------------------------------------------------------
const uf = new UnionFind(allRecords.length);

function extractECode(normName) {
  const m = normName.match(/^(e\d+[a-z(),-]*)/i);
  return m ? m[1].toLowerCase() : null;
}

const eCodeGroups = {};
allRecords.forEach((r, idx) => {
  if (r.sourceFile !== "halal_e_numbers_india" && r.sourceFile !== "sanha_halal") return;
  const code = extractECode(r.normName);
  if (!code) return;
  if (!eCodeGroups[code]) eCodeGroups[code] = [];
  eCodeGroups[code].push(idx);
});

for (const indices of Object.values(eCodeGroups)) {
  for (let i = 1; i < indices.length; i++) {
    uf.union(indices[0], indices[i]);
  }
}
console.log(`  E-code pre-merge: ${Object.keys(eCodeGroups).length} unique E-codes grouped`);
const blocks = buildPrefixBlocks(allRecords);
let comparisons = 0;
let merges = 0;

for (const indices of Object.values(blocks)) {
  // Compare every pair within this prefix block
  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      const idxA = indices[i];
      const idxB = indices[j];
      const a = allRecords[idxA].normName;
      const b = allRecords[idxB].normName;

      // Skip if either name is empty or very short (unreliable matches)
      if (a.length < 4 || b.length < 4) continue;

      comparisons++;
      const editDist = distance(a, b);               // Levenshtein distance
      const maxLen = Math.max(a.length, b.length);
      const normDist = editDist / maxLen;             // normalise to [0,1]

      if (normDist <= SIMILARITY_THRESHOLD) {
        uf.union(idxA, idxB); // mark as same entity
        merges++;
      }
    }
  }
}

console.log(`  Compared ${comparisons.toLocaleString()} pairs (prefix-blocked)`);
console.log(`  Found ${merges} near-duplicate pairs → merging into canonical records`);

// =============================================================================
// STAGE 5 — BUILD CANONICAL RECORDS
// =============================================================================
//
// We now group all records by their Union-Find root (canonical group leader).
// For each group:
//   - canonical_id: a stable ID based on the group leader's sourceId
//   - norm_name: use the LONGEST normName in the group (usually the most complete)
//   - category: use the most common l1/l2 across group members
//   - halal_status: use most common status (Haraam > Mushbooh > Halal if conflict)
//   - company: collect all unique company names (may span sources)
//   - cert_bodies: all certifiers that list this product
//   - source_ids: all original source record IDs (audit trail)
// =============================================================================

console.log("\n📦  STAGE 5 — Building canonical records...\n");

// Group records by their Union-Find root index
const groups = new Map(); // root index → [record, ...]
allRecords.forEach((record, idx) => {
  const root = uf.find(idx);
  if (!groups.has(root)) groups.set(root, []);
  groups.get(root).push(record);
});

// ---------------------------------------------------------------------------
// HELPER: Given an array of values, return the most frequently occurring one.
// Ties broken by first occurrence.
// ---------------------------------------------------------------------------
function mostCommon(arr) {
  const freq = {};
  arr.forEach((v) => { if (v) freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

const SOLD_IN_FIXES = {
  "wordwide": "Worldwide", "wolrdwide": "Worldwide",
  "worldwide": "Worldwide", "honk kong": "Hong Kong",
};
function normaliseSoldIn(values) {
  return values.map(v => SOLD_IN_FIXES[v.toLowerCase()] || v);
}

function sanitizeString(str) {
  if (!str) return str;
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

// ---------------------------------------------------------------------------
// Build one canonical record per group.
// ---------------------------------------------------------------------------
const canonicalRecords = [];
let canonicalIdCounter = 1;

for (const members of groups.values()) {
  // Pick the longest normName as the canonical name —
  // it tends to be the most descriptive version across sources
  const bestName = members
    .map((m) => m.normName)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || "";

  // Resolve status conflicts: Haraam > Mushbooh > Halal
  // If ANY source says Haraam, the product is Haraam in our canonical record.
  const statusPriority = { Haraam: 3, Mushbooh: 2, Halal: 1 };
  const resolvedStatus = members
    .map((m) => m.rawStatus)
    .sort((a, b) => (statusPriority[b] || 0) - (statusPriority[a] || 0))[0] || "Halal";

  // Collect unique, non-empty company names and cert bodies
  const companies = [...new Set(members.map((m) => m.normCompany).filter(Boolean))];
  const certBodies = [...new Set(members.map((m) => m.certBody).filter(Boolean))];
  const certNum = [...new Set(members.map((m) => m.certNum).filter(Boolean))];
  const sold_in = normaliseSoldIn([...new Set(members.flatMap((m) => m.soldIn || []))]);
  const marketplace = [...new Set(
    members.map((m) => m.marketplace).filter(Boolean)
  )];
  const sourceIds = [...new Set(members.map((m) => m.sourceId).filter(Boolean))];

  // For expiry: pick the EARLIEST date found across all merged members.
  // "Most conservative" — if any cert expires sooner, we surface that.
  const certExpiry = members
    .map((m) => m.certExpiry)
    .filter(Boolean)
    .sort()[0] || null;   // ISO/YYYY-MM-DD strings sort lexicographically = chronologically

  // For issue date: pick the EARLIEST date found across members.
  // This tells you when the product first received any halal certification.
  // Only THIDAA provides this today; other sources will contribute nulls.
  const certIssue = members
    .map((m) => m.certIssue)
    .filter(Boolean)
    .sort()[0] || null;

  canonicalRecords.push({
    // Stable identifier for this product across all sources
    canonical_id: `halal_${String(canonicalIdCounter++).padStart(6, "0")}`,

    // The cleaned, merged product name
    norm_name: bestName,

    // Two-level category from our taxonomy
    category_l1: mostCommon(members.map((m) => m.categoryL1)),
    category_l2: mostCommon(members.map((m) => m.categoryL2)),

    // Halal status (conflict-resolved)
    halal_status: resolvedStatus,

    sold_in,
    marketplace, 

    // All company names that produce/sell this product
    companies,

    // Which certification bodies certify this product
    cert_bodies: certBodies,
    cert_numbers: certNum,

    // Earliest expiry date found (most conservative)
    cert_expiry: certExpiry,

    // Earliest issue date found across all merged sources.
    // Only populated for records that came through THIDAA (other sources
    // don't carry this field). null means "issue date not available".
    cert_issue: certIssue,

    // How many source records were merged into this canonical record
    source_count: members.length,

    health_info:   [...new Set(members.map((m) => m.healthInfo).filter(Boolean))],

    typical_uses: [
      ...new Set(
        members
          .flatMap((m) => m.typicalUses || [])
          .filter(Boolean)
      )
    ],

    // IDs of all original records (audit trail — lets you trace back to raw data)
    source_ids: sourceIds,

    // Which source files contributed to this record
    source_files: [...new Set(members.map((m) => m.sourceFile))],
    fda_numbers:     [...new Set(members.map((m) => m.fda_number).filter(Boolean))],
    barcodes:        [...new Set(members.map((m) => m.barcode).filter(Boolean))],
    company_contact: [...new Set(members.map((m) => m.company_contact).filter(Boolean))],
  });
}

console.log(`  ✅  ${canonicalRecords.length.toLocaleString()} canonical records from ${allRecords.length.toLocaleString()} raw records`);
console.log(`      (${allRecords.length - canonicalRecords.length} duplicates merged)`);

// Show status breakdown
const statusDist = {};
canonicalRecords.forEach((r) => { statusDist[r.halal_status] = (statusDist[r.halal_status] || 0) + 1; });
console.log("\n  Halal status distribution:");
Object.entries(statusDist).forEach(([s, c]) => console.log(`      ${s.padEnd(12)} ${c}`));

// Show L1 category breakdown
const catDist = {};
canonicalRecords.forEach((r) => { catDist[r.category_l1] = (catDist[r.category_l1] || 0) + 1; });
console.log("\n  Category L1 distribution:");
Object.entries(catDist)
  .sort((a, b) => b[1] - a[1])
  .forEach(([c, n]) => console.log(`      ${c.padEnd(18)} ${n}`));

// =============================================================================
// OUTPUT
// =============================================================================
//
// We write three files:
//
//   1. canonical_products.json  — the full normalised dataset.
//      This is what you feed into your embedding pipeline.
//      Each record has a `norm_name` + `category_l1` you can concatenate
//      before embedding: `"[Food] chicken whole & parts"` so the model
//      understands domain context without you having to fine-tune.
//
//   2. e_numbers_lookup.json    — just the E-number records, isolated.
//      Use this as an ingredient enrichment table: when you see "E102"
//      in a product's ingredient list, look it up here for halal status.
//
//   3. audit_log.json           — every raw record with its canonical_id.
//      Critical for debugging: if a canonical record looks wrong, trace
//      back through source_ids → raw record → original CSV row.
// =============================================================================

console.log("\n💾  Writing output files...\n");

const outDir = path.join(__dirname, "output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 1. Main canonical dataset
fs.writeFileSync(
  path.join(outDir, "canonical_products.json"),
  JSON.stringify(canonicalRecords, null, 2)
);
console.log(`  ✅  canonical_products.json  (${canonicalRecords.length} records)`);

// 2. E-number lookup table (subset of canonical records from e-numbers source)
const eNumberLookup = canonicalRecords.filter((r) =>
  r.source_files.includes("halal_e_numbers_india") ||
  r.source_files.includes("sanha_halal")
);
fs.writeFileSync(
  path.join(outDir, "e_numbers_lookup.json"),
  JSON.stringify(eNumberLookup, null, 2)
);
console.log(`  ✅  e_numbers_lookup.json    (${eNumberLookup.length} additives)`);

// 3. Audit log: raw record + its assigned canonical_id
const auditLog = allRecords.map((record, idx) => {
  const root = uf.find(idx);
  const canonIdx = [...groups.keys()].indexOf(root);
  const canonical = canonicalRecords[canonIdx] || null;
  return {
    sourceId: record.sourceId,
    rawName: record.rawName,
    normName: record.normName,
    canonical_id: canonical?.canonical_id || null,
    canonical_name: canonical?.norm_name || null,
    merged_with: canonical?.source_count > 1,
  };
});
fs.writeFileSync(
  path.join(outDir, "audit_log.json"),
  JSON.stringify(auditLog, null, 2)
);
console.log(`  ✅  audit_log.json           (${auditLog.length} raw records traced)`);

// =============================================================================
// NEXT STEPS (printed as a reminder)
// =============================================================================

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨  DONE — Pipeline complete

NEXT STEPS for embedding + clustering:
1. For each canonical record, build the embedding input string:
     "[{category_l1}] {norm_name} {companies.join(' ')}"
   This gives the model semantic context before clustering.

2. Embed using OpenAI text-embedding-3-small or similar.
   Store vectors in a FAISS index or pgvector.

3. Cluster WITHIN each category_l1 group using HDBSCAN.
   (Never cluster across all L1 groups at once — "Skin Cream"
    and "Chicken" should never compete for the same cluster.)

4. For ingredient-level halal lookups, use e_numbers_lookup.json
   as a side table — don't mix additives into your product clusters.

5. Use audit_log.json to trace any weird cluster back to its raw source.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);