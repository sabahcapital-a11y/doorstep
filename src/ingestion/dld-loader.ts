/**
 * DLD Database Loader
 * Loads parsed DLD transaction records into the OffPlanIQ SQLite database.
 * Uses upsert logic to be idempotent — running twice doesn't duplicate.
 */

import type { Database } from "bun:sqlite";
import type { ParsedDLDTransaction } from "./dld-parser";
import { dateToPeriod, mapToUnitType } from "./dld-parser";

export interface IngestionStats {
  totalDownloaded: number;
  totalParsed: number;
  totalValid: number;
  totalSkipped: number;
  skippedReasons: { reason: string; count: number }[];
  newDevelopers: number;
  existingDevelopers: number;
  newProjects: number;
  existingProjects: number;
  newUnits: number;
  existingUnits: number;
  newTrendRecords: number;
  aggregatesGenerated: number;
}

const BATCH_SIZE = 250;

/** Ensure dedup indexes exist for idempotent ingestion. */
function ensureIngestionIndexes(db: Database): void {
  // Unique composite index for unit deduplication (DLD source data)
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_units_dedup
      ON units(project_id, type, size_sqft, list_price)
  `);
  // Unique index for developer names
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_developers_name
      ON developers(name)
  `);
  // Unique index for project deduplication
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_dedup
      ON projects(developer_id, name)
  `);
  // Unique index for area trends deduplication
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_area_trends_dedup
      ON area_trends(area, period)
  `);
}

/** Load parsed DLD transactions into the database. */
export function loadDLDData(
  db: Database,
  rows: ParsedDLDTransaction[],
): IngestionStats {
  ensureIngestionIndexes(db);
  const stats: IngestionStats = {
    totalDownloaded: rows.length,
    totalParsed: rows.length,
    totalValid: rows.length,
    totalSkipped: 0,
    skippedReasons: [],
    newDevelopers: 0,
    existingDevelopers: 0,
    newProjects: 0,
    existingProjects: 0,
    newUnits: 0,
    existingUnits: 0,
    newTrendRecords: 0,
    aggregatesGenerated: 0,
  };

  // ── Track in-memory caches for developer/project lookups ──────────────────
  const devNameToId = new Map<string, number>();
  const projKeyToId = new Map<string, number>(); // "devId::projectName" → project id
  const projIdToDevId = new Map<number, number>(); // project id → dev id

  // Preload existing developers
  const existingDevs = db.prepare("SELECT id, name FROM developers").all() as {
    id: number;
    name: string;
  }[];
  for (const d of existingDevs) {
    devNameToId.set(d.name.toLowerCase().trim(), d.id);
  }

  // Preload existing projects
  const existingProjects = db.prepare(
    "SELECT id, developer_id, name FROM projects",
  ).all() as { id: number; developer_id: number; name: string }[];
  for (const p of existingProjects) {
    projKeyToId.set(`${p.developer_id}::${p.name.toLowerCase().trim()}`, p.id);
    projIdToDevId.set(p.id, p.developer_id);
  }

  const insertDev = db.prepare(`
    INSERT OR IGNORE INTO developers (name, registration_number, years_active, projects_delivered,
      projects_delayed, avg_delay_months, risk_score, escrow_violations, rera_rating)
    VALUES (?1, ?2, 0, 0, 0, 0, 50, 0, NULL)
  `);

  const getDevId = db.prepare("SELECT id FROM developers WHERE name = ?1");

  const insertProj = db.prepare(`
    INSERT OR IGNORE INTO projects (developer_id, name, area, completion_qtr, status, total_units, dld_project_id)
    VALUES (?1, ?2, ?3, 'Unknown', 'launched', 0, NULL)
  `);

  const getProjId = db.prepare(
    "SELECT id FROM projects WHERE developer_id = ?1 AND name = ?2",
  );

  const insertUnit = db.prepare(`
    INSERT OR IGNORE INTO units (project_id, type, size_sqft, list_price, floor, unit_number)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `);

  // Batch transaction for performance
  const runBatch = (fn: () => void) => {
    db.transaction(() => fn())();
  };

  let batchCount = 0;
  const areaPeriodData = new Map<string, { sumPrice: number; sumSize: number; count: number }>(); // "area::period" → aggregate

  const processBatch = () => {
    // Nothing to flush in a single-pass approach; we use db.transaction per BATCH_SIZE
  };

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    runBatch(() => {
      for (const row of batch) {
        // ── 1. Upsert developer ──────────────────────────────────────────
        let devId: number | undefined;
        const devName = row.developerName || "Unknown Developer";

        const existingDevId = devNameToId.get(devName.toLowerCase().trim());
        if (existingDevId) {
          stats.existingDevelopers++;
          devId = existingDevId;
        } else {
          const devResult = insertDev.run(devName, `DLD-CSV-${devName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 20)}`);
          if (devResult.changes > 0) {
            stats.newDevelopers++;
          }
          const result = getDevId.get(devName) as { id: number } | undefined;
          if (result) {
            devId = result.id;
            devNameToId.set(devName.toLowerCase().trim(), devId);
          }
          if (devResult.changes === 0) {
            stats.existingDevelopers++;
          }
        }

        if (!devId) continue;

        // ── 2. Upsert project ────────────────────────────────────────────
        let projId: number | undefined;
        const projName = row.projectName || `${row.area} - Unnamed`;

        const projKey = `${devId}::${projName.toLowerCase().trim()}`;
        const existingProjId = projKeyToId.get(projKey);
        if (existingProjId) {
          stats.existingProjects++;
          projId = existingProjId;
        } else {
          const projResult = insertProj.run(devId, projName, row.area);
          if (projResult.changes > 0) {
            stats.newProjects++;
          }
          const projResult2 = getProjId.get(devId, projName) as { id: number } | undefined;
          if (projResult2) {
            projId = projResult2.id;
            projKeyToId.set(projKey, projId);
            projIdToDevId.set(projId, devId);
          }
          if (projResult.changes === 0) {
            stats.existingProjects++;
          }
        }

        if (!projId) continue;

        // ── 3. Upsert unit (DB unique index handles dedup) ───────────────
        const unitType = mapToUnitType(row.propertyType, row.rooms);
        const size = row.sizeSqft ?? 0;
        const price = row.priceAed;

        const result = insertUnit.run(
          projId, unitType, size, price,
          row.floor ?? null, row.unitNumber
        );
        if (result.changes > 0) {
          stats.newUnits++;
        } else {
          stats.existingUnits++;
        }

        // ── 4. Aggregate for area_trends ──────────────────────────────────
        const period = dateToPeriod(row.transactionDate);
        if (period !== "Unknown") {
          const apKey = `${row.area.toLowerCase().trim()}::${period}`;
          const existing = areaPeriodData.get(apKey);
          if (existing) {
            existing.sumPrice += price;
            existing.sumSize += size > 0 ? size : 0;
            existing.count++;
          } else {
            areaPeriodData.set(apKey, {
              sumPrice: price,
              sumSize: size > 0 ? size : 0,
              count: 1,
            });
          }
        }
      }
    });

    batchCount++;
  }

  // ── 5. Upsert area trends ──────────────────────────────────────────────
  const insertTrend = db.prepare(`
    INSERT OR IGNORE INTO area_trends (area, period, avg_price_per_sqft, avg_rent_per_sqft, transaction_volume, appreciation_rate)
    VALUES (?1, ?2, ?3, 0, ?4, 0)
  `);

  runBatch(() => {
    for (const [key, agg] of areaPeriodData) {
      const lastColon = key.lastIndexOf("::");
      const area = key.slice(0, lastColon);
      const period = key.slice(lastColon + 2);
      const avgPricePerSqft =
        agg.sumSize > 0 ? Math.round((agg.sumPrice / agg.sumSize) * 100) / 100 : 0;

      if (avgPricePerSqft > 0 && agg.count > 0) {
        const trendResult = insertTrend.run(area, period, avgPricePerSqft, agg.count);
        if (trendResult.changes > 0) {
          stats.newTrendRecords++;
        }
      }
    }
    stats.aggregatesGenerated = areaPeriodData.size;
  });

  return stats;
}

/** Format ingestion stats for console output. */
export function formatStats(stats: IngestionStats): string {
  const lines = [
    `📥 Downloaded: ${stats.totalDownloaded.toLocaleString()} records`,
    `🔍 Parsed: ${stats.totalParsed.toLocaleString()} records`,
    `✅ Valid: ${stats.totalValid.toLocaleString()} records`,
    `⏭️  Skipped: ${stats.totalSkipped.toLocaleString()} records`,
    ...stats.skippedReasons.map(
      (s) => `   - ${s.reason}: ${s.count.toLocaleString()}`,
    ),
    ``,
    `🏢 Developers: ${stats.newDevelopers} new, ${stats.existingDevelopers} existing`,
    `🏗️  Projects: ${stats.newProjects} new, ${stats.existingProjects} existing`,
    `🏠 Units: ${stats.newUnits.toLocaleString()} new, ${stats.existingUnits.toLocaleString()} existing`,
    `📊 Area trends: ${stats.newTrendRecords} records from ${stats.aggregatesGenerated} area-period groups`,
  ];
  return lines.join("\n");
}
