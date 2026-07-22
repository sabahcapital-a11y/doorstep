/** Core types for Dubai real estate developers and risk assessment. */

export interface Developer {
  id: number;
  name: string;
  /** RERA / DLD registration number */
  registration_number: string;
  /** Years active in Dubai market */
  years_active: number;
  /** Total projects delivered to date */
  projects_delivered: number;
  /** Total projects delayed beyond original completion date */
  projects_delayed: number;
  /** Average delay in months across delayed projects */
  avg_delay_months: number;
  /** Computed risk score (0-100, lower is safer) */
  risk_score: number;
  /** Whether developer has any escrow violations on record */
  escrow_violations: boolean;
  /** RERA star rating (1-5, null if unrated) */
  rera_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeveloperRiskFactors {
  delivery_history_score: number; // 0-40
  delay_severity_score: number; // 0-30
  escrow_compliance_score: number; // 0-20
  market_reputation_score: number; // 0-10
}
