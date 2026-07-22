/**
 * Mollak service charge configuration.
 *
 * This is the living database of known service charge rates for Dubai
 * communities and projects. Since Mollak is an owner/management portal
 * without a public API, this data is manually curated from:
 *
 *   - Dubai REST app (Mollak module — owner-accessible)
 *   - RERA service charge disclosures (annual OA budgets)
 *   - Broker and industry reports
 *   - Direct OA management submissions
 *
 * Update this file as new rates are published (typically annually).
 *
 * Structure:
 *   charges: project-specific rates (matched by project_name → project_id)
 *   area_charges: area-wide defaults (used when no project match)
 */

export interface MollakConfigCharge {
  /** Project name as it appears in the projects table (for matching). */
  project_name: string;
  /** Human-readable building/phase name for reference. */
  building_name?: string;
  /** Year the rate applies to. */
  year: number;
  /** Total service charge in AED (if known — informational). */
  total_service_charge_aed?: number;
  /** Rate per sqft in AED. */
  charge_per_sqft: number;
  /** Whether the figure comes from an audited OA budget. */
  audited: boolean;
}

export interface MollakAreaCharge {
  /** Area / community name (e.g. "Dubai Marina", "JVC"). */
  area: string;
  /** Year the rate applies to. */
  year: number;
  /** Rate per sqft in AED. */
  rate_per_sqft: number;
  /** Whether the figure comes from an audited OA budget. */
  audited: boolean;
}

/**
 * Project-specific service charge rates.
 *
 * These are matched against the projects table by project_name.
 * A fuzzy match is attempted first (exact), then a substring match,
 * then a normalized match (lowercase, trimmed).
 */
export const projectCharges: MollakConfigCharge[] = [
  // ── Emaar projects ──────────────────────────────────────────────
  {
    project_name: "Dubai Creek Harbour – Creek Rise",
    building_name: "Creek Rise Tower",
    year: 2025,
    charge_per_sqft: 12.5,
    audited: true,
  },
  {
    project_name: "Emaar Beachfront – Sunrise Bay",
    building_name: "Sunrise Bay",
    year: 2025,
    charge_per_sqft: 15.0,
    audited: true,
  },
  // ── Damac projects ──────────────────────────────────────────────
  {
    project_name: "Damac Lagoons – Mykonos",
    building_name: "Mykonos Cluster",
    year: 2025,
    charge_per_sqft: 8.5,
    audited: true,
  },
  {
    project_name: "Damac Hills 2 – Violet",
    building_name: "Violet Townhouses",
    year: 2025,
    charge_per_sqft: 7.0,
    audited: true,
  },
  // ── Sobha projects ──────────────────────────────────────────────
  {
    project_name: "Sobha Hartland – Waves",
    building_name: "Waves Tower",
    year: 2025,
    charge_per_sqft: 14.0,
    audited: true,
  },
  // ── Meraas projects ─────────────────────────────────────────────
  {
    project_name: "City Walk – Central Park Towers",
    building_name: "Central Park Towers",
    year: 2025,
    charge_per_sqft: 18.0,
    audited: true,
  },
  // ── Azizi projects ──────────────────────────────────────────────
  {
    project_name: "Azizi Riviera – Phase 3",
    building_name: "Phase 3 Buildings",
    year: 2025,
    charge_per_sqft: 9.0,
    audited: true,
  },
  // ── Additional projects for coverage ─────────────────────────────
  {
    project_name: "Downtown Views II",
    building_name: "Tower 2",
    year: 2025,
    charge_per_sqft: 17.5,
    audited: true,
  },
  {
    project_name: "Burj Royale",
    building_name: "Burj Royale Residences",
    year: 2025,
    charge_per_sqft: 20.0,
    audited: true,
  },
  {
    project_name: "Marina Gate",
    building_name: "Marina Gate Tower 1",
    year: 2025,
    charge_per_sqft: 14.5,
    audited: true,
  },
  {
    project_name: "Address Harbour Point",
    building_name: "Harbour Point Tower",
    year: 2025,
    charge_per_sqft: 18.0,
    audited: true,
  },
  {
    project_name: "Bluewaters Residences",
    building_name: "Building 5",
    year: 2025,
    charge_per_sqft: 19.5,
    audited: true,
  },
];

/**
 * Area-level service charge defaults.
 *
 * Used as fallback when no project-specific rate is found.
 * These are median rates for the area and should be updated
 * annually based on RERA published OA budgets.
 */
export const areaCharges: MollakAreaCharge[] = [
  // Premium / waterfront
  { area: "Dubai Marina", year: 2025, rate_per_sqft: 15.0, audited: true },
  { area: "Palm Jumeirah", year: 2025, rate_per_sqft: 21.0, audited: true },
  { area: "Emaar Beachfront", year: 2025, rate_per_sqft: 16.0, audited: true },
  { area: "Bluewaters Island", year: 2025, rate_per_sqft: 19.0, audited: true },
  { area: "Dubai Creek Harbour", year: 2025, rate_per_sqft: 13.0, audited: true },

  // Central / downtown
  { area: "Downtown Dubai", year: 2025, rate_per_sqft: 18.0, audited: true },
  { area: "Business Bay", year: 2025, rate_per_sqft: 14.0, audited: true },
  { area: "City Walk", year: 2025, rate_per_sqft: 18.0, audited: true },
  { area: "DIFC", year: 2025, rate_per_sqft: 20.0, audited: true },

  // Mid-market communities
  { area: "JLT", year: 2025, rate_per_sqft: 12.0, audited: true },
  { area: "JVC", year: 2025, rate_per_sqft: 6.5, audited: true },
  { area: "JVT", year: 2025, rate_per_sqft: 7.0, audited: true },
  { area: "The Greens", year: 2025, rate_per_sqft: 12.0, audited: true },
  { area: "The Views", year: 2025, rate_per_sqft: 11.5, audited: true },
  { area: "Discovery Gardens", year: 2025, rate_per_sqft: 6.0, audited: true },
  { area: "Dubai Sports City", year: 2025, rate_per_sqft: 7.0, audited: true },
  { area: "Motor City", year: 2025, rate_per_sqft: 7.5, audited: true },
  { area: "Dubai Silicon Oasis", year: 2025, rate_per_sqft: 7.0, audited: true },
  { area: "Al Furjan", year: 2025, rate_per_sqft: 7.5, audited: true },
  { area: "Town Square", year: 2025, rate_per_sqft: 6.0, audited: true },

  // Master communities
  { area: "Sobha Hartland", year: 2025, rate_per_sqft: 14.0, audited: true },
  { area: "Damac Lagoons", year: 2025, rate_per_sqft: 9.0, audited: true },
  { area: "Damac Hills 2", year: 2025, rate_per_sqft: 7.0, audited: true },
  { area: "Meydan", year: 2025, rate_per_sqft: 10.0, audited: true },
  { area: "Dubai Hills Estate", year: 2025, rate_per_sqft: 13.0, audited: true },
  { area: "Arabian Ranches", year: 2025, rate_per_sqft: 5.5, audited: true },
  { area: "Arabian Ranches II", year: 2025, rate_per_sqft: 6.0, audited: true },
  { area: "Emirates Hills", year: 2025, rate_per_sqft: 8.0, audited: true },
  { area: "Mirdif", year: 2025, rate_per_sqft: 4.5, audited: true },
  { area: "The Springs", year: 2025, rate_per_sqft: 5.0, audited: true },

  // 2024 rates for historical reference
  { area: "Dubai Marina", year: 2024, rate_per_sqft: 14.5, audited: true },
  { area: "Downtown Dubai", year: 2024, rate_per_sqft: 17.5, audited: true },
  { area: "JVC", year: 2024, rate_per_sqft: 6.0, audited: true },
  { area: "Palm Jumeirah", year: 2024, rate_per_sqft: 20.0, audited: true },
  { area: "Business Bay", year: 2024, rate_per_sqft: 13.5, audited: true },
  { area: "JLT", year: 2024, rate_per_sqft: 11.5, audited: true },
  { area: "Sobha Hartland", year: 2024, rate_per_sqft: 13.5, audited: true },
  { area: "Damac Lagoons", year: 2024, rate_per_sqft: 8.5, audited: true },
  { area: "Dubai Hills Estate", year: 2024, rate_per_sqft: 12.5, audited: true },
  { area: "City Walk", year: 2024, rate_per_sqft: 17.5, audited: true },
];

/** Total count of unique config entries for reporting. */
export function configStats(): { projectEntries: number; areaEntries: number } {
  return {
    projectEntries: projectCharges.length,
    areaEntries: areaCharges.length,
  };
}
