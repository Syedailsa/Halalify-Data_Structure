/**
 * =============================================================================
 * HALAL PRODUCT CLI CHATBOT
 * =============================================================================
 * Run:  node chatbot.js
 * =============================================================================
 */

import readline from "readline";
import {
  loadCompanyList,
  knownCompanies,
  handleQuery,
} from "./chatbotService.js";

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
    input: process.stdin,
    output: process.stdout,
    prompt: "You: ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }
    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      console.log("\nGoodbye!\n");
      rl.close();
      process.exit(0);
    }

    process.stdout.write("\n🔍  Thinking...");

    try {
      const result = await handleQuery(input);

      if (result.success) {
        process.stdout.write(` [Type ${result.classified.type}]\n`);

        if (result.fuzzyWarning) {
          console.log(`  ${result.fuzzyWarning}`);
        }

        if (result.summary) {
          console.log(
            `\n  📊 ${result.summary.company} summary: ✅ Halal: ${result.summary.halal}  ❌ Haraam: ${result.summary.haram}  ⚠️ Mushbooh: ${result.summary.mushbooh}`
          );
        }

        if (result.formatted) {
          console.log(result.formatted);
        } else if (result.notInDatabase) {
          console.log(
            `\n  ℹ️  "${result.resolvedCompany || result.query}" hamare database mein nahi hai.`
          );
          console.log(`  🌐  Web se check karte hain...\n`);
          console.log(`  Web results for "${result.query}":`);
          console.log(result.webResults);
          console.log(`\n  ⚠️  Yeh unverified web results hain.`);
        } else {
          console.log("\n  No confident matches found.");
        }
      } else {
        console.error(`\n  Error: ${result.error}`);
      }
    } catch (err) {
      console.error(`\n  Error: ${err.message}`);
    }

    console.log();
    rl.prompt();
  });

  rl.on("close", () => process.exit(0));
}

main().catch(console.error);