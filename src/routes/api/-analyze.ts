/**
 * POST /api/analyze — Deal analysis endpoint.
 *
 * Accepts AnalysisInput + project context, runs the full
 * analysis pipeline (yield, IRR, risk flags), returns AnalysisOutput,
 * and saves to the analyses table.
 */

import { createServerFn } from "@tanstack/react-start";
import { getDb } from "../../db/index";
import { runFullAnalysis } from "../../engine/yield";
import { scoreDeveloperRisk } from "../../engine/risk";
import { detectRedFlags } from "../../engine/redflags";
import { forecastAppreciation } from "../../engine/appreciation";
import type { AnalysisInput, AnalysisOutput, Developer, AreaTrend } from "../../types";

export const analyze = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid request body");
    const d = data as Record<string, unknown>;
    if (typeof d.unit_price !== "number") throw new Error("unit_price required");
    if (!d.payment_plan || typeof d.payment_plan !== "object") throw new Error("payment_plan required");
    if (typeof d.expected_rent !== "number") throw new Error("expected_rent required");
    if (typeof d.holding_period !== "number") throw new Error("holding_period required");
    return data as AnalysisInput & { project_id?: number; unit_id?: number; user_id?: number };
  })
  .handler(async ({ data }) => {
    const db = getDb();

    // Extract the analysis input fields
    const { project_id, unit_id, user_id, ...input } = data;

    // Get developer risk score from DB (use project's developer)
    let developerRiskScore = 0;
    let developer: Developer | undefined;
    let areaTrends: AreaTrend[] = [];

    if (project_id) {
      const project = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(project_id) as { developer_id: number; area: string } | undefined;

      if (project) {
        developer = db
          .prepare("SELECT * FROM developers WHERE id = ?")
          .get(project.developer_id) as Developer | undefined;

        if (developer) {
          const risk = scoreDeveloperRisk(developer);
          developerRiskScore = risk.score;
        }

        areaTrends = db
          .prepare("SELECT * FROM area_trends WHERE area = ? ORDER BY period")
          .all(project.area) as AreaTrend[];
      }
    }

    // Compute appreciation forecast from area trends
    const appreciationForecast = areaTrends.length > 0
      ? forecastAppreciation(areaTrends, input.holding_period)
      : 0.05;

    // Run red-flag detection
    const riskFlags = detectRedFlags({
      developer: developer ?? {
        id: 0,
        name: "Unknown",
        registration_number: "",
        years_active: 0,
        projects_delivered: 0,
        projects_delayed: 0,
        avg_delay_months: 0,
        risk_score: 0,
        escrow_violations: false,
        rera_rating: null,
        created_at: "",
        updated_at: "",
      },
      paymentPlan: input.payment_plan,
      areaTrends,
      unitPrice: input.unit_price,
      serviceChargeRate: input.service_charge_per_sqft,
    });

    // Run full analysis
    const result: AnalysisOutput = runFullAnalysis(
      input,
      developerRiskScore,
      riskFlags,
      appreciationForecast
    );

    // Save to analyses table if user_id provided
    if (user_id) {
      db.prepare(
        `INSERT INTO analyses (user_id, project_id, unit_id, input_params, results, disclaimer_key)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        user_id,
        project_id ?? null,
        unit_id ?? null,
        JSON.stringify(input),
        JSON.stringify(result),
        result.disclaimer_key
      );
    }

    return result;
  });
