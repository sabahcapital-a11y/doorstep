/**
 * DLD Data Ingestion Pipeline — CLI Entry Point
 *
 * Usage:
 *   bun run src/ingestion/dld-cli.ts [path/to/dld_transactions.csv]
 *
 * If no path is provided, attempts to download from Dubai Pulse CKAN API
 * (which may not be reachable from all environments).
 *
 * Data source: Dubai Pulse (dubaipulse.gov.ae) DLD transaction datasets.
 * Download a CSV manually and pass it as an argument to this script.
 *
 * How to get the CSV:
 *   1. Visit https://www.dubaipulse.gov.ae
 *   2. Search for "DLD transactions" or "real estate transactions"
 *   3. Download the latest CSV/XLSX export
 *   4. Run: bun run src/ingestion/dld-cli.ts ./dld_transactions.csv
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getDb, closeDb } from "../db/index";
import { parseDLDCSV, filterDLDRows } from "./dld-parser";
import { loadDLDData, formatStats } from "./dld-loader";

const DUBAI_PULSE_API = "https://www.dubaipulse.gov.ae/api/3/action/package_show?id=dld-transactions";

async function main(): Promise<void> {
  console.log("🏗️  OffPlanIQ — DLD Data Ingestion Pipeline");
  console.log("=" .repeat(50));

  const args = process.argv.slice(2);
  let csvPath: string | null = args.find((a) => a.endsWith(".csv")) ?? null;

  // ── Mode: local CSV file ──────────────────────────────────────────────────
  if (csvPath) {
    csvPath = resolve(csvPath);
    if (!existsSync(csvPath)) {
      console.error(`❌ File not found: ${csvPath}`);
      process.exit(1);
    }

    console.log(`📂 Reading: ${csvPath}`);
    const fileContent = readFileSync(csvPath);
    await ingestFromBuffer(fileContent, csvPath);
    return;
  }

  // ── Mode: Dubai Pulse CKAN API ────────────────────────────────────────────
  console.log("🌐 Attempting Dubai Pulse CKAN API...");
  console.log(`   ${DUBAI_PULSE_API}`);

  try {
    const resp = await fetch(DUBAI_PULSE_API, {
      headers: { "User-Agent": "OffPlanIQ/0.1 (data ingestion pipeline)" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    const json = (await resp.json()) as any;
    if (!json.success || !json.result?.resources?.length) {
      throw new Error("CKAN response missing resources array");
    }

    // Find a CSV resource
    const csvResource = json.result.resources.find(
      (r: any) =>
        r.format?.toLowerCase() === "csv" ||
        r.url?.endsWith(".csv") ||
        r.name?.toLowerCase().includes("csv"),
    );

    if (!csvResource) {
      console.log("📋 Available resources:");
      for (const r of json.result.resources) {
        console.log(`   - ${r.name || "unnamed"} (${r.format || "unknown"}): ${r.url}`);
      }
      console.error("❌ No CSV resource found in CKAN response.");
      console.error("   Please download the CSV manually and pass it as an argument.");
      process.exit(1);
    }

    console.log(`📥 Downloading: ${csvResource.name || csvResource.url}`);
    const csvResp = await fetch(csvResource.url, {
      signal: AbortSignal.timeout(60_000),
    });

    if (!csvResp.ok) {
      throw new Error(`CSV download failed: HTTP ${csvResp.status}`);
    }

    const buffer = Buffer.from(await csvResp.arrayBuffer());
    await ingestFromBuffer(buffer, csvResource.url);
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.message?.includes("timeout")) {
      console.error("⏱️  Dubai Pulse is not reachable (timeout).");
    } else if (err.message?.includes("fetch")) {
      console.error("🌐 Dubai Pulse is not reachable (network error).");
    } else {
      console.error(`❌ API error: ${err.message}`);
    }

    console.log("");
    console.log("📋 To use the local-file mode:");
    console.log("   1. Visit https://www.dubaipulse.gov.ae");
    console.log('   2. Search for "DLD transactions" or "real estate transactions"');
    console.log("   3. Download the latest CSV export");
    console.log("   4. Run: bun run src/ingestion/dld-cli.ts ./dld_transactions.csv");
    process.exit(1);
  }
}

async function ingestFromBuffer(
  buffer: Buffer | Uint8Array,
  sourceLabel: string,
): Promise<void> {
  console.log(`📄 Parsing CSV (${(buffer.byteLength / 1024).toFixed(1)} KB)...`);

  const rows = await parseDLDCSV(
    buffer instanceof Buffer ? new Uint8Array(buffer) : buffer,
    sourceLabel,
  );

  console.log(`   Raw rows: ${rows.length.toLocaleString()}`);

  const { valid, skipped } = filterDLDRows(rows);
  console.log(`   Valid: ${valid.length.toLocaleString()}`);
  console.log(`   Skipped: ${skipped.reduce((s, r) => s + r.count, 0).toLocaleString()}`);

  if (valid.length === 0) {
    console.error("❌ No valid rows after filtering. Check CSV format.");
    process.exit(1);
  }

  console.log("");
  console.log("💾 Loading into database...");

  const db = getDb();
  const stats = loadDLDData(db, valid);

  // Merge skipped reasons
  stats.totalSkipped = skipped.reduce((s, r) => s + r.count, 0);
  stats.skippedReasons = skipped;

  console.log("");
  console.log(formatStats(stats));
  console.log("");
  console.log("✅ DLD ingestion complete.");

  closeDb();
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
