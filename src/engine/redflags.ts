/**
 * Red-flag detection rules.
 *
 * Automated checks that flag potential issues with a deal.
 * Each rule returns a RiskFlag if triggered, or null.
 */

import type { Developer, PaymentPlan, AreaTrend, RiskFlag, RiskFlagType } from "../types";

export interface RedFlagContext {
  developer: Developer;
  paymentPlan: PaymentPlan;
  areaTrends: AreaTrend[];
  unitPrice: number;
  serviceChargeRate: number;
}

/**
 * Run all red-flag rules and return triggered flags.
 */
export function detectRedFlags(ctx: RedFlagContext): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const rules = [
    checkDeveloperDelayHistory,
    checkEscrowViolations,
    checkAreaOversupply,
    checkUnusualPaymentStructure,
    checkHighServiceCharges,
  ];

  for (const rule of rules) {
    const flag = rule(ctx);
    if (flag) flags.push(flag);
  }

  return flags;
}

function makeFlag(type: RiskFlagType, severity: RiskFlag["severity"], message: string, detail: string): RiskFlag {
  return { type, severity, message, detail };
}

function checkDeveloperDelayHistory(ctx: RedFlagContext): RiskFlag | null {
  const { developer } = ctx;
  if (developer.projects_delayed >= 5) {
    return makeFlag(
      "developer_delay_history",
      "high",
      `${developer.name} has delayed ${developer.projects_delayed} projects (avg ${developer.avg_delay_months} months)`,
      "Developer has a significant history of project delays. Factor in potential completion risk."
    );
  }
  if (developer.projects_delayed >= 2) {
    return makeFlag(
      "developer_delay_history",
      "medium",
      `${developer.name} has delayed ${developer.projects_delayed} projects`,
      "Moderate delay history — consider buffer in your timeline planning."
    );
  }
  return null;
}

function checkEscrowViolations(ctx: RedFlagContext): RiskFlag | null {
  if (ctx.developer.escrow_violations) {
    return makeFlag(
      "escrow_violation",
      "critical",
      `${ctx.developer.name} has escrow violations on record with DLD`,
      "Escrow violations indicate potential misuse of buyer funds. Exercise extreme caution."
    );
  }
  return null;
}

function checkAreaOversupply(ctx: RedFlagContext): RiskFlag | null {
  const recentTrends = ctx.areaTrends.slice(-3);
  if (recentTrends.length < 2) return null;

  const avgVolume = recentTrends.reduce((s, t) => s + t.transaction_volume, 0) / recentTrends.length;
  const latestAppreciation = recentTrends[recentTrends.length - 1].appreciation_rate;

  // High volume + declining appreciation = potential oversupply
  if (avgVolume > 350 && latestAppreciation < 0.03) {
    return makeFlag(
      "area_oversupply",
      "medium",
      `High transaction volume with slowing appreciation in this area`,
      "The area shows signs of potential oversupply — monitor closely for impact on rental yields and capital appreciation."
    );
  }

  // Negative appreciation
  if (latestAppreciation < 0) {
    return makeFlag(
      "area_oversupply",
      "high",
      `Negative price appreciation detected in this area (${(latestAppreciation * 100).toFixed(1)}%)`,
      "Prices are declining in this area. Evaluate carefully whether the entry price reflects this trend."
    );
  }

  return null;
}

function checkUnusualPaymentStructure(ctx: RedFlagContext): RiskFlag | null {
  const pp = ctx.paymentPlan;

  // Post-handover plan longer than 48 months is unusual
  if (pp.post_handover_months > 48) {
    return makeFlag(
      "unusual_payment_structure",
      "medium",
      `Extended post-handover payment plan: ${pp.post_handover_months} months`,
      "Extended post-handover plans can signal developer cash flow pressure. Verify the developer's financial standing."
    );
  }

  // Very low down payment (< 5%)
  if (pp.down_payment_pct < 5) {
    return makeFlag(
      "unusual_payment_structure",
      "low",
      `Very low down payment: ${pp.down_payment_pct}%`,
      "Low down payment may attract speculative buyers, potentially affecting community stability and resale values."
    );
  }

  return null;
}

function checkHighServiceCharges(ctx: RedFlagContext): RiskFlag | null {
  // AED 18+ per sqft is high for Dubai
  if (ctx.serviceChargeRate >= 18) {
    return makeFlag(
      "high_service_charges",
      "medium",
      `High service charges: AED ${ctx.serviceChargeRate}/sqft`,
      "Above-average service charges will reduce net yield. Confirm these rates with Mollak data and budget accordingly."
    );
  }
  return null;
}
