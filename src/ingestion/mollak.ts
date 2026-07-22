/**
 * Mollak (service charge) data pipeline.
 * Ingests service charge and maintenance fee data from the Mollak system.
 *
 * Mollak is the RERA-mandated system for Owners Association service charge
 * disclosure in Dubai. Data includes actual audited service charges per project.
 *
 * Current: stub — returns typed empty results.
 */

import type { ServiceCharge } from "../types";

export interface MollakRecord {
  project_name: string;
  building_name: string | null;
  year: number;
  total_service_charge_aed: number;
  charge_per_sqft: number;
  audited: boolean;
}

/** Fetch Mollak service charge records for a project or area. */
export async function fetchMollakCharges(
  _params: { projectName?: string; area?: string; year?: number }
): Promise<MollakRecord[]> {
  // TODO: integrate Mollak data feed / API
  return [];
}

/** Convert Mollak record to internal ServiceCharge type. */
export function toServiceCharge(record: MollakRecord, projectId: number | null): Omit<ServiceCharge, "id" | "created_at"> {
  return {
    project_id: projectId,
    area: record.project_name,
    year: record.year,
    rate_per_sqft: record.charge_per_sqft,
    mollak_source: true,
  };
}
