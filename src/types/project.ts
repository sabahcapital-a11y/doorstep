/** Types for projects, units, payment plans, and area data. */

export type ProjectStatus =
  | "announced"
  | "launched"
  | "under_construction"
  | "near_completion"
  | "completed"
  | "cancelled"
  | "on_hold";

export type UnitType = "studio" | "1br" | "2br" | "3br" | "4br" | "5br" | "penthouse" | "villa" | "townhouse";

export interface Project {
  id: number;
  developer_id: number;
  name: string;
  /** Area / community (e.g. "Dubai Marina", "JVC", "Emaar Beachfront") */
  area: string;
  /** Target completion quarter, e.g. "Q4 2027" */
  completion_qtr: string;
  status: ProjectStatus;
  total_units: number;
  /** DLD project registration ID */
  dld_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentPlan {
  id: number;
  project_id: number;
  /** Name of the plan (e.g. "60/40", "50/30/20") */
  plan_name: string;
  /** Percentage due at booking */
  down_payment_pct: number;
  /** Percentage due during construction */
  during_construction_pct: number;
  /** Percentage due on handover */
  on_handover_pct: number;
  /** Percentage due post-handover */
  post_handover_pct: number;
  /** Number of months for post-handover payment plan */
  post_handover_months: number;
  /** Whether DLD registration fee is waived */
  dld_waiver: boolean;
  created_at: string;
}

export interface Unit {
  id: number;
  project_id: number;
  type: UnitType;
  size_sqft: number;
  /** List price in AED */
  list_price: number;
  floor: number | null;
  /** Unit number / label */
  unit_number: string | null;
  created_at: string;
}

export interface AreaTrend {
  id: number;
  /** Area / community name */
  area: string;
  /** Period label, e.g. "Q1 2025", "H1 2025" */
  period: string;
  /** Average sale price per sqft in AED */
  avg_price_per_sqft: number;
  /** Average annual rent per sqft in AED */
  avg_rent_per_sqft: number;
  /** Number of transactions in the period */
  transaction_volume: number;
  /** Year-over-year appreciation rate as decimal (e.g. 0.08 = 8%) */
  appreciation_rate: number;
  created_at: string;
}

export interface ServiceCharge {
  id: number;
  /** Project ID if project-specific; null if area-wide */
  project_id: number | null;
  /** Area name if area-wide */
  area: string | null;
  year: number;
  /** Annual service charge rate in AED per sqft */
  rate_per_sqft: number;
  /** Whether sourced from Mollak system */
  mollak_source: boolean;
  created_at: string;
}
