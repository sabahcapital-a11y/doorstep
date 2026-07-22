/**
 * /api/portfolio — Endpoints for saved analyses and portfolio management.
 *
 * GET  /api/portfolio/analyses  — list saved analyses for a user
 * DELETE /api/portfolio/analyses — delete an analysis
 */

import { createServerFn } from "@tanstack/react-start";
import { getDb } from "../../db/index";
import type { AnalysisOutput } from "../../types";

export interface SavedAnalysis {
  id: number;
  user_id: number;
  project_id: number | null;
  unit_id: number | null;
  project_name: string | null;
  unit_type: string | null;
  results: AnalysisOutput;
  created_at: string;
  input_params: Record<string, unknown>;
}

/** List saved analyses for a user. */
export const listAnalyses = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    const d = data as Record<string, unknown> | undefined;
    return { user_id: (d?.user_id as number) ?? 1 };
  })
  .handler(async ({ data }) => {
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
      .all(data.user_id) as (Record<string, unknown> & {
      id: number;
      results: string;
      input_params: string;
    })[];

    return rows.map((row) => ({
      id: row.id as number,
      user_id: row.user_id as number,
      project_id: row.project_id as number | null,
      unit_id: row.unit_id as number | null,
      project_name: row.project_name as string | null,
      unit_type: row.unit_type as string | null,
      results: JSON.parse(row.results as string) as AnalysisOutput,
      created_at: row.created_at as string,
      input_params: JSON.parse(row.input_params as string) as Record<string, unknown>,
    })) as SavedAnalysis[];
  });

/** Delete an analysis by ID. */
export const deleteAnalysis = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as Record<string, unknown>;
    if (typeof d.id !== "number") throw new Error("id required");
    return { id: d.id as number };
  })
  .handler(async ({ data }) => {
    const db = getDb();
    db.prepare("DELETE FROM analyses WHERE id = ?").run(data.id);
    return { success: true };
  });
