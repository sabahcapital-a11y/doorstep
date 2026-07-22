/**
 * Developer risk scoring algorithm.
 *
 * Scores developers on a 0-100 scale (lower = safer) based on:
 * - Delivery history (0-40): ratio of on-time vs delayed projects
 * - Delay severity (0-30): average delay in months
 * - Escrow compliance (0-20): escrow violations on record
 * - Market reputation (0-10): RERA rating and years active
 */

import type { Developer, DeveloperRiskFactors } from "../types";

export function scoreDeveloperRisk(dev: Developer): { score: number; factors: DeveloperRiskFactors } {
  const factors = computeRiskFactors(dev);
  const score =
    factors.delivery_history_score +
    factors.delay_severity_score +
    factors.escrow_compliance_score +
    factors.market_reputation_score;

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    factors,
  };
}

function computeRiskFactors(dev: Developer): DeveloperRiskFactors {
  const totalProjects = dev.projects_delivered + dev.projects_delayed;

  // Delivery history: score based on delay ratio
  let delivery_history_score = 40;
  if (totalProjects > 0) {
    const delayRatio = dev.projects_delayed / totalProjects;
    delivery_history_score = Math.round(40 * delayRatio); // higher ratio = worse score
  }

  // Delay severity: normalize average delay to 0-30 scale
  // 0 months delay = 0, 24+ months delay = 30
  let delay_severity_score = Math.round((dev.avg_delay_months / 24) * 30);
  delay_severity_score = Math.min(30, delay_severity_score);

  // Escrow compliance: 20 points if any violations
  let escrow_compliance_score = dev.escrow_violations ? 20 : 0;

  // Market reputation: based on RERA rating
  let market_reputation_score = 10;
  if (dev.rera_rating) {
    // 5-star = 0, 1-star = 10
    market_reputation_score = Math.round(((5 - dev.rera_rating) / 4) * 10);
  } else {
    // Unrated: moderate risk, 5 points
    market_reputation_score = 5;
  }

  return {
    delivery_history_score,
    delay_severity_score,
    escrow_compliance_score,
    market_reputation_score,
  };
}

/**
 * Risk level label based on score.
 */
export function riskLevel(score: number): "low" | "moderate" | "high" | "severe" {
  if (score <= 15) return "low";
  if (score <= 35) return "moderate";
  if (score <= 60) return "high";
  return "severe";
}
