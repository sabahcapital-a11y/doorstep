/** Types for deal analysis input/output and red flags. */

export interface AnalysisInput {
  /** Unit price in AED */
  unit_price: number;
  /** Payment plan milestones */
  payment_plan: {
    down_payment_pct: number;
    during_construction_pct: number;
    on_handover_pct: number;
    post_handover_pct: number;
    post_handover_months: number;
    dld_waiver: boolean;
  };
  /** Expected annual rent in AED */
  expected_rent: number;
  /** Expected holding period in years */
  holding_period: number;
  /** Annual finance/mortgage rate as decimal (e.g. 0.05 = 5%) */
  finance_rate: number;
  /** Annual service charge per sqft */
  service_charge_per_sqft: number;
  /** Unit size in sqft */
  unit_size_sqft: number;
}

export interface AnalysisOutput {
  /** Net rental yield as decimal (e.g. 0.065 = 6.5%) */
  net_yield: number;
  /** Internal rate of return over holding period */
  irr: number;
  /** Cash-on-cash return */
  cash_on_cash: number;
  /** Total cost of ownership over analysis period (AED) */
  total_cost_of_ownership: number;
  /** DLD fees (4% registration + admin) */
  dld_fees: number;
  /** Risk flags triggered by this analysis */
  risk_flags: RiskFlag[];
  /** Developer risk score (0-100) */
  developer_risk_score: number;
  /** Area appreciation forecast */
  area_appreciation_forecast: number;
  /** Disclaimer reference key */
  disclaimer_key: string;
}

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type RiskFlagType =
  | "developer_delay_history"
  | "escrow_violation"
  | "area_oversupply"
  | "unusual_payment_structure"
  | "high_service_charges"
  | "completion_risk"
  | "dld_irregularity";

export interface RiskFlag {
  type: RiskFlagType;
  severity: RiskSeverity;
  message: string;
  detail: string;
}

export interface DisclaimerText {
  key: string;
  text: string;
}
