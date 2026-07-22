/**
 * Database connection singleton.
 * Uses Bun's built-in SQLite (bun:sqlite) for local development;
 * Neon serverless Postgres for production.
 *
 * The DB file lives at the site root as `offplaniq.db` (git-ignored).
 */

import { Database } from "bun:sqlite";
import { createSchema } from "./schema";

const DB_PATH = `${import.meta.dir}/../../offplaniq.db`;

let _db: Database | null = null;

export function getDb(): Database {
  if (_db) return _db;

  _db = new Database(DB_PATH, { create: true });

  // Enable WAL mode for better concurrent read performance
  _db.exec("PRAGMA journal_mode = WAL");
  _db.exec("PRAGMA foreign_keys = ON");

  // Create schema on first connection
  createSchema(_db);

  return _db;
}

/** Close the database connection (for clean shutdown). */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * Server-only SQL helper — returns the bun:sqlite Database instance.
 * Use inside createServerFn() or API routes only.
 */
export function sql(): Database {
  return getDb();
}

// Re-export for convenience
export { Database };
