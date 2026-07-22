#!/usr/bin/env bun
/**
 * Mollak (service charge) data pipeline.
 * Ingests service charge and maintenance fee data from multiple sources.
 *
 * Mollak is the RERA-mandated system for Owners Association service charge
 * disclosure in Dubai. Since Mollak does not provide a public API, this
 * pipeline uses a curated configuration as its primary source, with CSV
 * import as a secondary input.
 *
 * Usage:
 *   bun run src/ingestion/mollak.ts                # load from config
 *   bun run src/ingestion/mollak.ts ./charges.csv  # CSV mode
 *
 * The pipeline is idempotent — running it twice produces no duplicates.
 */

import { getDb, closeDb } from "../db/index";
import {
  projectCharges,
  areaCharges,
  configStats,
} from "./mollak-config";
import type { MollakConfigCharge, MollakAreaCharge } from "./mollak-config";
import type { ServiceCharge } from "../types";

// ─── Public interface (preserved from original stub) ──────────────────────

export interface MollakRecord {
  project_name: string;
  building_name: string | null;
  year: number;
  total_service_charge_aed: number;
  charge_per_sqft: number;
  audited: boolean;
}

/**
 * Fetch Mollak service charge records for a project or area.
 * Queries the local database (populated by this pipeline).
 */
export async function fetchMollakCharges(
  params: { projectName?: string; area?: string; year?: number }
): Promise<MollakRecord[]> {
  const db = getDb();
  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  if (params.projectName) {
    conditions.push("p.name = ?");
    bindings.push(params.projectName);
  }
  if (params.area) {
    conditions.push("(sc.area = ? OR (sc.project_id IS NULL AND sc.area = ?))");
    bindings.push(params.area, params.area);
  }
  if (params.year) {
    conditions.push("sc.year = ?");
    bindings.push(params.year);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT
         COALESCE(p.name, sc.area) as project_name,
         NULL as building_name,
         sc.year,
         0 as total_service_charge_aed,
         sc.rate_per_sqft as charge_per_sqft,
         CASE WHEN sc.mollak_source = 1 THEN 1 ELSE 0 END as audited
       FROM service_charges sc
       LEFT JOIN projects p ON sc.project_id = p.id
       ${where}
       ORDER BY sc.year DESC, project_name`
    )
    .all(...bindings) as MollakRecord[];

  return rows;
}

/** Convert Mollak record to internal ServiceCharge type. */
export function toServiceCharge(
  record: MollakRecord,
  projectId: number | null
): Omit<ServiceCharge, "id" | "created_at"> {
  return {
    project_id: projectId,
    area: projectId === null ? record.project_name : null,
    year: record.year,
    rate_per_sqft: record.charge_per_sqft,
    mollak_source: true,
  };
}

// ─── CSV parsing ──────────────────────────────────────────────────────────

interface CSVMollakRow {
  project_name?: string;
  area?: string;
  year?: string;
  rate_per_sqft?: string;
  source?: string;
  audited?: string;
}

function parseCSV(content: string): CSVMollakRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Detect header
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: CSVMollakRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: CSVMollakRow = {};
    header.forEach((col, idx) => {
      if (values[idx] !== undefined) {
        (row as Record<string, string>)[col] = values[idx];
      }
    });
    if (row.rate_per_sqft || row.project_name || row.area) {
      rows.push(row);
    }
  }

  return rows;
}

// ─── Project matching ─────────────────────────────────────────────────────

interface ProjectRow {
  id: number;
  name: string;
  area: string;
}

function getAllProjects(): ProjectRow[] {
  const db = getDb();
  return db.prepare("SELECT id, name, area FROM projects ORDER BY name").all() as ProjectRow[];
}

/**
 * Match a project name from config/CSV to a projects table row.
 * Tries: exact match → normalized match (lowercase, trimmed) →
 *        substring match (config name is contained in project name or vice versa).
 */
function matchProject(
  configName: string,
  projects: ProjectRow[]
): ProjectRow | null {
  const normalized = configName.trim();

  // 1. Exact match
  const exact = projects.find((p) => p.name === normalized);
  if (exact) return exact;

  // 2. Case-insensitive exact
  const ciExact = projects.find(
    (p) => p.name.toLowerCase() === normalized.toLowerCase()
  );
  if (ciExact) return ciExact;

  // 3. Substring match: config name is contained within project name
  const subMatch = projects.find((p) =>
    p.name.toLowerCase().includes(normalized.toLowerCase())
  );
  if (subMatch) return subMatch;

  // 4. Reverse substring: project name is contained within config name
  const revMatch = projects.find((p) =>
    normalized.toLowerCase().includes(p.name.toLowerCase())
  );
  if (revMatch) return revMatch;

  // 5. Word-level matching: check if significant words overlap
  const configWords = new Set(
    normalized
      .toLowerCase()
      .split(/[\s–\-]+/)
      .filter((w) => w.length > 2)
  );
  const best = projects
    .map((p) => {
      const projWords = p.name.toLowerCase().split(/[\s–\-]+/);
      const overlap = projWords.filter((w) => configWords.has(w)).length;
      return { project: p, overlap };
    })
    .filter((x) => x.overlap >= 2)
    .sort((a, b) => b.overlap - a.overlap)[0];

  return best?.project ?? null;
}

// ─── Upsert logic (idempotent) ────────────────────────────────────────────

/**
 * Check if a service charge record already exists.
 * Handles NULL project_id correctly (NULL != NULL in SQL, so we use IS NULL).
 */
function recordExists(
  projectId: number | null,
  area: string | null,
  year: number,
  ratePerSqft: number
): boolean {
  const db = getDb();

  let query: string;
  let params: (number | string | null)[];

  if (projectId !== null) {
    query = `SELECT 1 FROM service_charges
             WHERE project_id = ?1 AND year = ?2 AND rate_per_sqft = ?3
             LIMIT 1`;
    params = [projectId, year, ratePerSqft];
  } else if (area !== null) {
    query = `SELECT 1 FROM service_charges
             WHERE project_id IS NULL AND area = ?1 AND year = ?2 AND rate_per_sqft = ?3
             LIMIT 1`;
    params = [area, year, ratePerSqft];
  } else {
    // Both null — shouldn't happen in practice
    return false;
  }

  const row = db.prepare(query).get(...params);
  return row !== null && row !== undefined;
}

function insertServiceCharge(
  projectId: number | null,
  area: string | null,
  year: number,
  ratePerSqft: number,
  mollakSource: boolean
): boolean {
  if (recordExists(projectId, area, year, ratePerSqft)) {
    return false; // already exists, skip
  }

  getDb()
    .prepare(
      `INSERT INTO service_charges (project_id, area, year, rate_per_sqft, mollak_source)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
    .run(projectId, area, year, ratePerSqft, mollakSource ? 1 : 0);

  return true;
}

// ─── Pipeline stages ──────────────────────────────────────────────────────

interface PipelineResult {
  totalLoaded: number;
  matchedToProject: number;
  areaFallback: number;
  skipped: number;
  details: string[];
}

function loadFromConfig(): PipelineResult {
  const projects = getAllProjects();
  const result: PipelineResult = {
    totalLoaded: 0,
    matchedToProject: 0,
    areaFallback: 0,
    skipped: 0,
    details: [],
  };

  // 1. Project-specific charges
  for (const charge of projectCharges) {
    const project = matchProject(charge.project_name, projects);
    if (project) {
      const inserted = insertServiceCharge(
        project.id,
        null,
        charge.year,
        charge.charge_per_sqft,
        charge.audited
      );
      if (inserted) {
        result.matchedToProject++;
        result.totalLoaded++;
        result.details.push(
          `  ✓ ${charge.project_name} → project #${project.id} (${project.name}) @ AED ${charge.charge_per_sqft}/sqft`
        );
      } else {
        result.skipped++;
        result.details.push(
          `  · ${charge.project_name} → project #${project.id} (already exists, skipped)`
        );
      }
    } else {
      // No project match — fall back to area-level
      result.details.push(
        `  ⚠ ${charge.project_name}: no project match, skipping project-specific insert`
      );
      result.skipped++;
    }
  }

  // 2. Area-level charges
  for (const areaCharge of areaCharges) {
    const inserted = insertServiceCharge(
      null,
      areaCharge.area,
      areaCharge.year,
      areaCharge.rate_per_sqft,
      areaCharge.audited
    );
    if (inserted) {
      result.areaFallback++;
      result.totalLoaded++;
      result.details.push(
        `  ✓ [area] ${areaCharge.area} (${areaCharge.year}) @ AED ${areaCharge.rate_per_sqft}/sqft`
      );
    } else {
      result.skipped++;
    }
  }

  return result;
}

async function loadFromCSV(filePath: string, projects: ProjectRow[]): Promise<PipelineResult> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const content = await file.text();
  const rows = parseCSV(content);

  const result: PipelineResult = {
    totalLoaded: 0,
    matchedToProject: 0,
    areaFallback: 0,
    skipped: 0,
    details: [],
  };

  for (const row of rows) {
    const year = parseInt(row.year ?? "2025", 10);
    const ratePerSqft = parseFloat(row.rate_per_sqft ?? "0");
    const audited = (row.audited ?? "false").toLowerCase() === "true";

    if (isNaN(ratePerSqft) || ratePerSqft <= 0) {
      result.details.push(`  ⚠ Skipping row with invalid rate: ${JSON.stringify(row)}`);
      result.skipped++;
      continue;
    }

    // Try project match first
    let matched = false;
    if (row.project_name) {
      const project = matchProject(row.project_name, projects);
      if (project) {
        if (insertServiceCharge(project.id, null, year, ratePerSqft, audited)) {
          result.matchedToProject++;
          result.totalLoaded++;
          matched = true;
          result.details.push(
            `  ✓ ${row.project_name} → project #${project.id} @ AED ${ratePerSqft}/sqft`
          );
        } else {
          result.skipped++;
          matched = true; // treat as handled even if skipped (duplicate)
        }
      }
    }

    // Fall back to area
    if (!matched && row.area) {
      if (insertServiceCharge(null, row.area, year, ratePerSqft, audited)) {
        result.areaFallback++;
        result.totalLoaded++;
        result.details.push(
          `  ✓ [area] ${row.area} (${year}) @ AED ${ratePerSqft}/sqft`
        );
      } else {
        result.skipped++;
      }
    } else if (!matched) {
      result.details.push(
        `  ⚠ No project_name or area in row: ${JSON.stringify(row)}`
      );
      result.skipped++;
    }
  }

  return result;
}

// ─── Entry point ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = Bun.argv.slice(2);
  const stats = configStats();

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  OffPlanIQ — Mollak Service Charge Pipeline ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");

  const projects = getAllProjects();
  console.log(`  Database: ${projects.length} projects loaded`);

  if (args.length > 0 && args[0].endsWith(".csv")) {
    // ── CSV mode ──────────────────────────────────────────────────────────
    console.log(`  Mode: CSV import (${args[0]})`);
    console.log("");

    const csvResult = await loadFromCSV(args[0], projects);
    for (const detail of csvResult.details) {
      console.log(detail);
    }

    console.log("");
    console.log(`  ─── Summary ───`);
    console.log(`  Loaded:   ${csvResult.totalLoaded} records`);
    console.log(`  Matched:  ${csvResult.matchedToProject} to projects`);
    console.log(`  Fallback: ${csvResult.areaFallback} area-level`);
    console.log(`  Skipped:  ${csvResult.skipped} (duplicates/invalid)`);
    console.log("");
  } else {
    // ── Config mode (default) ─────────────────────────────────────────────
    console.log(
      `  Config:  ${stats.projectEntries} project + ${stats.areaEntries} area entries`
    );
    console.log("");

    const result = loadFromConfig();
    for (const detail of result.details) {
      console.log(detail);
    }

    console.log("");
    console.log(`  ─── Summary ───`);
    console.log(
      `  Loaded ${result.totalLoaded} service charge records → ` +
        `Matched ${result.matchedToProject} to projects → ` +
        `${result.areaFallback} area-level fallbacks`
    );
    console.log(`  Skipped: ${result.skipped} (duplicates)`);
    console.log("");

    // Verify total count in DB
    const db = getDb();
    const total = (
      db.prepare("SELECT COUNT(*) as cnt FROM service_charges").get() as {
        cnt: number;
      }
    ).cnt;
    const projectSc = (
      db
        .prepare(
          "SELECT COUNT(*) as cnt FROM service_charges WHERE project_id IS NOT NULL"
        )
        .get() as { cnt: number }
    ).cnt;
    const areaSc = (
      db
        .prepare(
          "SELECT COUNT(*) as cnt FROM service_charges WHERE project_id IS NULL"
        )
        .get() as { cnt: number }
    ).cnt;

    console.log(`  Database total: ${total} records (${projectSc} project, ${areaSc} area)`);
    console.log("");
  }

  closeDb();
  console.log("  ✅ Pipeline complete.");
}

main();
