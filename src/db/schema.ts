/**
 * OffPlanIQ Database Schema
 * SQLite schema creation and migrations for local development.
 * Uses Bun's built-in SQLite (bun:sqlite).
 * Production uses Neon serverless Postgres — this schema is the canonical source.
 */

import type { Database } from "bun:sqlite";

export function createSchema(db: Database): void {
  db.exec(`
    -- Developers table: Dubai real estate developers with track record data
    CREATE TABLE IF NOT EXISTS developers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      registration_number TEXT NOT NULL UNIQUE,
      years_active INTEGER NOT NULL DEFAULT 0,
      projects_delivered INTEGER NOT NULL DEFAULT 0,
      projects_delayed INTEGER NOT NULL DEFAULT 0,
      avg_delay_months REAL NOT NULL DEFAULT 0,
      risk_score REAL NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
      escrow_violations INTEGER NOT NULL DEFAULT 0,
      rera_rating INTEGER CHECK (rera_rating >= 1 AND rera_rating <= 5),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Projects table: off-plan and completed projects
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      developer_id INTEGER NOT NULL REFERENCES developers(id),
      name TEXT NOT NULL,
      area TEXT NOT NULL,
      completion_qtr TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'announced'
        CHECK (status IN ('announced','launched','under_construction','near_completion','completed','cancelled','on_hold')),
      total_units INTEGER NOT NULL DEFAULT 0,
      dld_project_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Payment plans: milestone schedules per project
    CREATE TABLE IF NOT EXISTS payment_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      plan_name TEXT NOT NULL,
      down_payment_pct REAL NOT NULL DEFAULT 0,
      during_construction_pct REAL NOT NULL DEFAULT 0,
      on_handover_pct REAL NOT NULL DEFAULT 0,
      post_handover_pct REAL NOT NULL DEFAULT 0,
      post_handover_months INTEGER NOT NULL DEFAULT 0,
      dld_waiver INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Units: individual properties within projects
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      type TEXT NOT NULL
        CHECK (type IN ('studio','1br','2br','3br','4br','5br','penthouse','villa','townhouse')),
      size_sqft REAL NOT NULL,
      list_price REAL NOT NULL,
      floor INTEGER,
      unit_number TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Area trends: market data per area per period
    CREATE TABLE IF NOT EXISTS area_trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area TEXT NOT NULL,
      period TEXT NOT NULL,
      avg_price_per_sqft REAL NOT NULL,
      avg_rent_per_sqft REAL NOT NULL,
      transaction_volume INTEGER NOT NULL DEFAULT 0,
      appreciation_rate REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Service charges: from Mollak and other sources
    CREATE TABLE IF NOT EXISTS service_charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id),
      area TEXT,
      year INTEGER NOT NULL,
      rate_per_sqft REAL NOT NULL,
      mollak_source INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Users: account data
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'investor_pro'
        CHECK (tier IN ('investor_pro','broker_team','institutional')),
      subscription_status TEXT NOT NULL DEFAULT 'trialing'
        CHECK (subscription_status IN ('active','past_due','cancelled','trialing','expired')),
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_ends_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Portfolios: user-created collections of units
    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Portfolio units: units within a portfolio with purchase data
    CREATE TABLE IF NOT EXISTS portfolio_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portfolio_id INTEGER NOT NULL REFERENCES portfolios(id),
      unit_id INTEGER NOT NULL REFERENCES units(id),
      purchase_price REAL NOT NULL,
      purchase_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Analyses: saved deal analyses
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      project_id INTEGER REFERENCES projects(id),
      unit_id INTEGER REFERENCES units(id),
      input_params TEXT NOT NULL,
      results TEXT NOT NULL,
      disclaimer_key TEXT NOT NULL DEFAULT 'standard',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Disclaimers: legal text templates
    CREATE TABLE IF NOT EXISTS disclaimers (
      key TEXT PRIMARY KEY,
      text TEXT NOT NULL
    );

    -- Audit log: compliance and event tracking
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      event_type TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id),
      details TEXT
    );

    -- Indexes for common query patterns
    CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer_id);
    CREATE INDEX IF NOT EXISTS idx_projects_area ON projects(area);
    CREATE INDEX IF NOT EXISTS idx_units_project ON units(project_id);
    CREATE INDEX IF NOT EXISTS idx_area_trends_area ON area_trends(area);
    CREATE INDEX IF NOT EXISTS idx_area_trends_period ON area_trends(period);
    CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_units_portfolio ON portfolio_units(portfolio_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_type ON audit_log(event_type);
  `);
}

/** Run migrations — versioned schema changes beyond initial creation go here. */
export function runMigrations(_db: Database, _fromVersion: number, _toVersion: number): void {
  // Placeholder: add ALTER TABLE / CREATE TABLE migration steps as the schema evolves.
}
