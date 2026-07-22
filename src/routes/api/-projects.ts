/**
 * GET /api/projects — Project search and listing endpoint.
 *
 * Returns projects with their units, payment plans, and developer info
 * for the deal analyzer dropdowns.
 */

import { createServerFn } from "@tanstack/react-start";
import { getDb } from "../../db/index";
import type { Unit, PaymentPlan, Developer, Project } from "../../types";

export interface ProjectListing {
  projects: (Project & {
    developer_name: string;
    developer_id: number;
    units: Unit[];
    payment_plan: PaymentPlan | null;
  })[];
}

export const listProjects = createServerFn({ method: "GET" })
  .handler(async (): Promise<ProjectListing> => {
    const db = getDb();

    const projects = db
      .prepare(
        `SELECT p.*, d.name as developer_name, d.id as developer_id
         FROM projects p
         JOIN developers d ON p.developer_id = d.id
         ORDER BY p.name`
      )
      .all() as (Project & { developer_name: string; developer_id: number })[];

    const result = projects.map((proj) => {
      const units = db
        .prepare("SELECT * FROM units WHERE project_id = ? ORDER BY type, size_sqft")
        .all(proj.id) as Unit[];

      const paymentPlan = db
        .prepare("SELECT * FROM payment_plans WHERE project_id = ? LIMIT 1")
        .get(proj.id) as PaymentPlan | undefined;

      return {
        ...proj,
        units,
        payment_plan: paymentPlan ?? null,
      };
    });

    return { projects: result };
  });

export const getDeveloper = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    return data as { developer_id: number };
  })
  .handler(async ({ data }) => {
    const db = getDb();
    const developer = db
      .prepare("SELECT * FROM developers WHERE id = ?")
      .get(data.developer_id) as Developer | undefined;
    return developer ?? null;
  });

export const getAreaTrends = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    return data as { area: string };
  })
  .handler(async ({ data }) => {
    const db = getDb();
    const trends = db
      .prepare("SELECT * FROM area_trends WHERE area = ? ORDER BY period")
      .all(data.area) as import("../../types").AreaTrend[];
    return trends;
  });
