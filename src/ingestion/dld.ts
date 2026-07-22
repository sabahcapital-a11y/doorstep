/**
 * DLD (Dubai Land Department) data pipeline.
 * Ingests transaction records from Dubai Pulse CSV downloads and
 * surfaces them through typed query interfaces.
 *
 * Data source: Dubai Pulse (dubaipulse.gov.ae) — CKAN-based open data portal.
 * Manual CSV download required when the CKAN API is unreachable.
 *
 * Usage:
 *   // CLI ingestion (run from project root):
 *   bun run src/ingestion/dld-cli.ts ./dld_transactions.csv
 *
 *   // Programmatic:
 *   import { ingestDLDFromCSV, fetchDLDTransactions } from "./dld";
 *   await ingestDLDFromCSV("./data.csv");
 *   const txns = await fetchDLDTransactions({ area: "Dubai Marina" });
 */

import type { Database } from "bun:sqlite";
import { getDb } from "../db/index";
import { parseDLDCSV, filterDLDRows, type ParsedDLDTransaction } from "./dld-parser";
import { loadDLDData, type IngestionStats } from "./dld-loader";
import type { Project } from "../types";

// Re-export types for consumers
export type { ParsedDLDTransaction } from "./dld-parser";
export type { IngestionStats } from "./dld-loader";

// ── Public interfaces (preserved from original stub) ────────────────────────

export interface DLDTransaction {
  transaction_id: string;
  project_id: string;
  property_type: string;
  area_sqft: number;
  price_aed: number;
  transaction_date: string;
  buyer_nationality: string | null;
}

export interface DLDQueryParams {
  projectId?: string;
  area?: string;
  fromDate?: string;
  toDate?: string;
  transactionType?: string;
  limit?: number;
}

// ── Core ingestion function ─────────────────────────────────────────────────

/**
 * Ingest a DLD CSV file (local path or buffer) into the database.
 * Returns ingestion statistics.
 */
export async function ingestDLDFromCSV(
  source: string | Uint8Array,
  db?: Database
): Promise<IngestionStats> {
  const database = db ?? getDb();

  // Read file if path string
  const buffer: Uint8Array =
    typeof source === "string"
      ? new Uint8Array(await Bun.file(source).arrayBuffer())
      : source;

  const rows = await parseDLDCSV(buffer);
  const { valid, skipped } = filterDLDRows(rows);
  const stats = loadDLDData(database, valid);

  stats.totalDownloaded = rows.length;
  stats.totalSkipped = skipped.reduce((s, r) => s + r.count, 0);
  stats.skippedReasons = skipped;
  stats.totalValid = valid.length;

  return stats;
}

// ── Public query functions (backed by database) ─────────────────────────────

/**
 * Fetch DLD transactions from the local database.
 * Queries the `units` table joined with `projects` for area-level filtering.
 */
export async function fetchDLDTransactions(
  params: DLDQueryParams = {}
): Promise<DLDTransaction[]> {
  const db = getDb();

  let query = `
    SELECT
      u.id as transaction_id,
      u.project_id,
      u.type as property_type,
      u.size_sqft as area_sqft,
      u.list_price as price_aed,
      u.created_at as transaction_date,
      NULL as buyer_nationality
    FROM units u
    JOIN projects p ON u.project_id = p.id
    WHERE 1=1
  `;

  const bindings: any[] = [];

  if (params.area) {
    query += ` AND p.area = ?`;
    bindings.push(params.area);
  }
  if (params.projectId) {
    query += ` AND u.project_id = ?`;
    bindings.push(params.projectId);
  }
  if (params.fromDate) {
    query += ` AND u.created_at >= ?`;
    bindings.push(params.fromDate);
  }
  if (params.toDate) {
    query += ` AND u.created_at <= ?`;
    bindings.push(params.toDate);
  }

  query += ` ORDER BY u.created_at DESC`;

  if (params.limit) {
    query += ` LIMIT ?`;
    bindings.push(params.limit);
  }

  const rows = db.prepare(query).all(...bindings) as DLDTransaction[];
  return rows;
}

/**
 * Fetch DLD-registered project metadata from the local database.
 */
export async function fetchDLDProject(
  dldProjectId: string
): Promise<Partial<Project> | null> {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM projects WHERE dld_project_id = ?`)
    .get(dldProjectId) as Project | undefined;

  return row ?? null;
}

/**
 * Normalize and validate DLD price data.
 * Strips formatting artifacts; output in AED.
 */
export function normalizeDLDPrice(rawPrice: number, _currency: string = "AED"): number {
  return Math.round(rawPrice * 100) / 100;
}

// ── Bulk ingestion from parsed rows (used by CLI) ───────────────────────────

/**
 * Load pre-parsed DLD transactions directly into the database.
 * Used by the CLI pipeline after CSV parsing.
 */
export function loadTransactionsFromParsed(
  rows: ParsedDLDTransaction[],
  db?: Database
): IngestionStats {
  const database = db ?? getDb();
  const { valid, skipped } = filterDLDRows(rows);
  const stats = loadDLDData(database, valid);

  stats.totalDownloaded = rows.length;
  stats.totalSkipped = skipped.reduce((s, r) => s + r.count, 0);
  stats.skippedReasons = skipped;
  stats.totalValid = valid.length;

  return stats;
}
