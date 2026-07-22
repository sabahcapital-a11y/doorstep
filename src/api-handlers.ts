/**
 * API route handlers — invoked by serve.ts for /api/* requests.
 *
 * These are direct HTTP endpoints that bypass TanStack Start's RPC mechanism,
 * making them curl-friendly while reusing the same engine functions.
 */

import { getDb } from "./db/index";
import { runFullAnalysis } from "./engine/yield";
import { scoreDeveloperRisk } from "./engine/risk";
import { detectRedFlags } from "./engine/redflags";
import { forecastAppreciation } from "./engine/appreciation";
import type { AnalysisInput, Developer, AreaTrend, Unit, PaymentPlan, ServiceCharge } from "./types";

const JSON_HEADERS = { "Content-Type": "application/json" };

function ok(data: unknown): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: JSON_HEADERS });
}

function badRequest(msg: string): Response {
  return new Response(JSON.stringify({ error: msg }), { status: 400, headers: JSON_HEADERS });
}

function notFound(): Response {
  return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: JSON_HEADERS });
}

export async function handleApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // GET /api/projects
  if (pathname === "/api/projects" && req.method === "GET") {
    return handleProjects();
  }

  // POST /api/analyze
  if (pathname === "/api/analyze" && req.method === "POST") {
    return handleAnalyze(req);
  }

  // GET /api/portfolio
  if (pathname === "/api/portfolio" && req.method === "GET") {
    return handlePortfolioList(url);
  }

  // POST /api/portfolio (delete)
  if (pathname === "/api/portfolio" && req.method === "POST") {
    return handlePortfolioDelete(req);
  }

  return null; // not an API route
}

async function handleProjects(): Promise<Response> {
  const db = getDb();

  const projects = db
    .prepare(
      `SELECT p.*, d.name as developer_name
       FROM projects p
       JOIN developers d ON p.developer_id = d.id
       ORDER BY p.name`
    )
    .all() as (Record<string, unknown> & { id: number })[];

  const result = projects.map((proj) => {
    const units = db
      .prepare("SELECT * FROM units WHERE project_id = ? ORDER BY type, size_sqft")
      .all(proj.id) as Unit[];

    const paymentPlan = db
      .prepare("SELECT * FROM payment_plans WHERE project_id = ? LIMIT 1")
      .get(proj.id) as PaymentPlan | undefined;

    // Get project-specific service charge (most recent year first)
    const projectServiceCharge = db
      .prepare(
        "SELECT * FROM service_charges WHERE project_id = ? ORDER BY year DESC LIMIT 1"
      )
      .get(proj.id) as ServiceCharge | undefined;

    // Fall back to area-level service charge
    const areaServiceCharge = db
      .prepare(
        "SELECT * FROM service_charges WHERE project_id IS NULL AND area = ? ORDER BY year DESC LIMIT 1"
      )
      .get(proj.area as string) as ServiceCharge | undefined;

    const serviceCharge = projectServiceCharge ?? areaServiceCharge ?? null;

    return { ...proj, units, payment_plan: paymentPlan ?? null, service_charge: serviceCharge };
  });

  return ok({ projects: result });
}

async function handleAnalyze(req: Request): Promise<Response> {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof data.unit_price !== "number") return badRequest("unit_price required");
  if (!data.payment_plan || typeof data.payment_plan !== "object") return badRequest("payment_plan required");

  const input = data as unknown as AnalysisInput;
  const projectId = data.project_id as number | undefined;
  const unitId = data.unit_id as number | undefined;
  const userId = (data.user_id as number) ?? 1;

  const db = getDb();

  let developerRiskScore = 0;
  let developer: Developer | undefined;
  let areaTrends: AreaTrend[] = [];

  if (projectId) {
    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(projectId) as { developer_id: number; area: string } | undefined;

    if (project) {
      developer = db
        .prepare("SELECT * FROM developers WHERE id = ?")
        .get(project.developer_id) as Developer | undefined;

      if (developer) {
        developerRiskScore = scoreDeveloperRisk(developer).score;
      }

      areaTrends = db
        .prepare("SELECT * FROM area_trends WHERE area = ? ORDER BY period")
        .all(project.area) as AreaTrend[];
    }
  }

  const appreciationForecast =
    areaTrends.length > 0 ? forecastAppreciation(areaTrends, input.holding_period) : 0.05;

  const riskFlags = detectRedFlags({
    developer: developer ?? {
      id: 0, name: "Unknown", registration_number: "",
      years_active: 0, projects_delivered: 0, projects_delayed: 0,
      avg_delay_months: 0, risk_score: 0, escrow_violations: false,
      rera_rating: null, created_at: "", updated_at: "",
    },
    paymentPlan: input.payment_plan,
    areaTrends,
    unitPrice: input.unit_price,
    serviceChargeRate: input.service_charge_per_sqft,
  });

  const result = runFullAnalysis(input, developerRiskScore, riskFlags, appreciationForecast);

  // Save to DB
  db.prepare(
    `INSERT INTO analyses (user_id, project_id, unit_id, input_params, results, disclaimer_key)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, projectId ?? null, unitId ?? null, JSON.stringify(input), JSON.stringify(result), result.disclaimer_key);

  return ok(result);
}

async function handlePortfolioList(url: URL): Promise<Response> {
  const userId = Number(url.searchParams.get("user_id") ?? 1);
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT a.*, p.name as project_name, u.type as unit_type
       FROM analyses a
       LEFT JOIN projects p ON a.project_id = p.id
       LEFT JOIN units u ON a.unit_id = u.id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`
    )
    .all(userId) as (Record<string, unknown> & { id: number; results: string; input_params: string })[];

  const analyses = rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    unit_id: row.unit_id,
    project_name: row.project_name,
    unit_type: row.unit_type,
    results: JSON.parse(row.results),
    created_at: row.created_at,
    input_params: JSON.parse(row.input_params),
  }));

  return ok(analyses);
}

async function handlePortfolioDelete(req: Request): Promise<Response> {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  if (typeof data.id !== "number") return badRequest("id required");

  const db = getDb();
  db.prepare("DELETE FROM analyses WHERE id = ?").run(data.id);
  return ok({ success: true });
}
