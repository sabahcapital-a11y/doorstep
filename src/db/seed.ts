/**
 * Seed data for OffPlanIQ development environment.
 * Populates the database with realistic Dubai real estate data.
 *
 * Run: bun run src/db/seed.ts
 */

import { getDb, closeDb } from "./index";

function seed(): void {
  const db = getDb();

  // Clear existing seed data (order matters for FK constraints)
  db.exec(`
    DELETE FROM portfolio_units;
    DELETE FROM portfolios;
    DELETE FROM analyses;
    DELETE FROM audit_log;
    DELETE FROM units;
    DELETE FROM payment_plans;
    DELETE FROM service_charges;
    DELETE FROM area_trends;
    DELETE FROM projects;
    DELETE FROM developers;
    DELETE FROM disclaimers;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  // ─── Disclaimers ────────────────────────────────────────────────────────

  db.prepare(
    `INSERT INTO disclaimers (key, text) VALUES (?1, ?2)`
  ).run(
    "standard",
    "OffPlanIQ provides data-driven analytics tools for informational purposes only. " +
    "This is not investment advice, a recommendation, or a solicitation to buy or sell real estate. " +
    "Past performance and modeled projections do not guarantee future results. " +
    "All investment decisions should be made in consultation with a qualified financial advisor " +
    "and a RERA-licensed real estate professional. OffPlanIQ is not a brokerage and does not " +
    "facilitate property transactions."
  );

  db.prepare(
    `INSERT INTO disclaimers (key, text) VALUES (?1, ?2)`
  ).run(
    "yield_model",
    "Net yield and IRR projections are model estimates based on current market data, " +
    "assumed rental rates, and projected service charges. Actual returns may vary " +
    "significantly due to market conditions, rental demand shifts, construction delays, " +
    "currency fluctuations, and changes in regulatory fees."
  );

  // ─── Developers ─────────────────────────────────────────────────────────

  const insertDev = db.prepare(`
    INSERT INTO developers (name, registration_number, years_active, projects_delivered,
      projects_delayed, avg_delay_months, risk_score, escrow_violations, rera_rating)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
  `);

  insertDev.run("Emaar Properties", "DLD-DEV-001", 28, 45, 2, 3.5, 8, 0, 5);
  insertDev.run("Damac Properties", "DLD-DEV-002", 22, 38, 8, 9.2, 28, 1, 3);
  insertDev.run("Sobha Realty", "DLD-DEV-003", 15, 18, 1, 4.0, 12, 0, 4);
  insertDev.run("Meraas", "DLD-DEV-004", 18, 22, 0, 0, 5, 0, 5);
  insertDev.run("Azizi Developments", "DLD-DEV-005", 16, 25, 5, 7.0, 35, 1, 3);

  // ─── Projects ───────────────────────────────────────────────────────────

  const insertProj = db.prepare(`
    INSERT INTO projects (developer_id, name, area, completion_qtr, status, total_units, dld_project_id)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
  `);

  insertProj.run(1, "Dubai Creek Harbour – Creek Rise", "Dubai Creek Harbour", "Q4 2026", "under_construction", 450, "DLD-PROJ-1001");
  insertProj.run(1, "Emaar Beachfront – Sunrise Bay", "Emaar Beachfront", "Q2 2027", "launched", 320, "DLD-PROJ-1002");
  insertProj.run(2, "Damac Lagoons – Mykonos", "Damac Lagoons", "Q3 2027", "under_construction", 560, "DLD-PROJ-2001");
  insertProj.run(2, "Damac Hills 2 – Violet", "Damac Hills 2", "Q1 2026", "near_completion", 210, "DLD-PROJ-2002");
  insertProj.run(3, "Sobha Hartland – Waves", "Sobha Hartland", "Q4 2027", "under_construction", 380, "DLD-PROJ-3001");
  insertProj.run(4, "City Walk – Central Park Towers", "City Walk", "Q2 2026", "under_construction", 280, "DLD-PROJ-4001");
  insertProj.run(5, "Azizi Riviera – Phase 3", "Meydan", "Q2 2027", "under_construction", 640, "DLD-PROJ-5001");

  // ─── Payment Plans ──────────────────────────────────────────────────────

  const insertPlan = db.prepare(`
    INSERT INTO payment_plans (project_id, plan_name, down_payment_pct, during_construction_pct,
      on_handover_pct, post_handover_pct, post_handover_months, dld_waiver)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
  `);

  insertPlan.run(1, "80/20", 10, 50, 20, 20, 36, 0);
  insertPlan.run(2, "90/10", 5, 55, 30, 10, 24, 1);
  insertPlan.run(3, "60/40", 10, 40, 10, 40, 48, 0);
  insertPlan.run(4, "70/30", 10, 40, 20, 30, 36, 0);
  insertPlan.run(5, "80/20", 10, 50, 20, 20, 30, 0);
  insertPlan.run(6, "75/25", 10, 45, 20, 25, 36, 0);
  insertPlan.run(7, "60/40", 10, 40, 10, 40, 60, 0);

  // ─── Units ──────────────────────────────────────────────────────────────

  const insertUnit = db.prepare(`
    INSERT INTO units (project_id, type, size_sqft, list_price, floor, unit_number)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `);

  // Project 1: Creek Rise (Emaar)
  insertUnit.run(1, "1br", 720, 1350000, 5, "501");
  insertUnit.run(1, "2br", 1100, 2100000, 8, "802");
  insertUnit.run(1, "3br", 1650, 3400000, 12, "1201");

  // Project 2: Sunrise Bay (Emaar)
  insertUnit.run(2, "studio", 450, 950000, 3, "301");
  insertUnit.run(2, "1br", 780, 1600000, 7, "702");
  insertUnit.run(2, "2br", 1200, 2500000, 10, "1001");

  // Project 3: Mykonos (Damac)
  insertUnit.run(3, "2br", 1050, 1200000, 3, "303");
  insertUnit.run(3, "3br", 1500, 1800000, 6, "602");
  insertUnit.run(3, "4br", 2100, 2600000, 9, "901");

  // Project 4: Violet (Damac)
  insertUnit.run(4, "1br", 680, 750000, 2, "205");
  insertUnit.run(4, "2br", 980, 1050000, 5, "503");

  // Project 5: Waves (Sobha)
  insertUnit.run(5, "1br", 800, 1800000, 4, "401");
  insertUnit.run(5, "2br", 1250, 2800000, 8, "802");
  insertUnit.run(5, "3br", 1800, 4200000, 11, "1101");

  // Project 6: Central Park Towers (Meraas)
  insertUnit.run(6, "1br", 750, 2200000, 6, "602");
  insertUnit.run(6, "2br", 1150, 3400000, 9, "901");

  // Project 7: Azizi Riviera Phase 3
  insertUnit.run(7, "studio", 400, 550000, 2, "201");
  insertUnit.run(7, "1br", 650, 850000, 5, "503");
  insertUnit.run(7, "2br", 1000, 1300000, 7, "701");

  // ─── Area Trends ────────────────────────────────────────────────────────

  const insertTrend = db.prepare(`
    INSERT INTO area_trends (area, period, avg_price_per_sqft, avg_rent_per_sqft, transaction_volume, appreciation_rate)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `);

  insertTrend.run("Dubai Creek Harbour", "Q1 2025", 1850, 78, 320, 0.06);
  insertTrend.run("Dubai Creek Harbour", "Q2 2025", 1920, 80, 345, 0.07);
  insertTrend.run("Dubai Creek Harbour", "Q3 2025", 1980, 82, 310, 0.071);

  insertTrend.run("Emaar Beachfront", "Q1 2025", 2200, 95, 180, 0.05);
  insertTrend.run("Emaar Beachfront", "Q2 2025", 2280, 98, 205, 0.055);
  insertTrend.run("Emaar Beachfront", "Q3 2025", 2350, 100, 195, 0.06);

  insertTrend.run("Damac Lagoons", "Q1 2025", 1100, 55, 420, 0.04);
  insertTrend.run("Damac Lagoons", "Q2 2025", 1140, 57, 450, 0.045);
  insertTrend.run("Damac Lagoons", "Q3 2025", 1180, 58, 430, 0.048);

  insertTrend.run("Damac Hills 2", "Q1 2025", 750, 42, 280, 0.03);
  insertTrend.run("Damac Hills 2", "Q2 2025", 770, 43, 295, 0.032);
  insertTrend.run("Damac Hills 2", "Q3 2025", 790, 44, 270, 0.035);

  insertTrend.run("Sobha Hartland", "Q1 2025", 2100, 90, 250, 0.065);
  insertTrend.run("Sobha Hartland", "Q2 2025", 2180, 93, 275, 0.068);
  insertTrend.run("Sobha Hartland", "Q3 2025", 2250, 95, 260, 0.07);

  insertTrend.run("City Walk", "Q1 2025", 2800, 120, 90, 0.04);
  insertTrend.run("City Walk", "Q2 2025", 2880, 123, 105, 0.042);

  insertTrend.run("Meydan", "Q1 2025", 950, 48, 380, 0.055);
  insertTrend.run("Meydan", "Q2 2025", 980, 50, 400, 0.058);
  insertTrend.run("Meydan", "Q3 2025", 1020, 52, 390, 0.06);

  // ─── Service Charges ────────────────────────────────────────────────────

  const insertSC = db.prepare(`
    INSERT INTO service_charges (project_id, area, year, rate_per_sqft, mollak_source)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `);

  insertSC.run(1, null, 2025, 12.5, 1);
  insertSC.run(2, null, 2025, 15.0, 1);
  insertSC.run(3, null, 2025, 8.5, 1);
  insertSC.run(4, null, 2025, 7.0, 1);
  insertSC.run(5, null, 2025, 14.0, 1);
  insertSC.run(6, null, 2025, 18.0, 1);
  insertSC.run(7, null, 2025, 9.0, 1);

  // Area-level service charges
  insertSC.run(null, "Dubai Marina", 2025, 15.0, 1);
  insertSC.run(null, "Downtown Dubai", 2025, 18.0, 1);
  insertSC.run(null, "JVC", 2025, 6.5, 1);

  // ─── Sample User ────────────────────────────────────────────────────────

  db.prepare(`
    INSERT INTO users (email, name, tier, subscription_status)
    VALUES (?1, ?2, ?3, ?4)
  `).run("demo@offplaniq.ae", "Demo Investor", "investor_pro", "trialing");

  console.log("✅ Seed data loaded successfully.");
  console.log("   - 5 developers (Emaar, Damac, Sobha, Meraas, Azizi)");
  console.log("   - 7 projects across 6 areas");
  console.log("   - 22 units with payment plans");
  console.log("   - 20 area trend records");
  console.log("   - 10 service charge entries");
  console.log("   - 1 demo user (demo@offplaniq.ae)");

  closeDb();
}

seed();
