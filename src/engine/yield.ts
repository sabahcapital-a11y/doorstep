/**
 * Yield / IRR / NPV modeling engine.
 *
 * Models net yield, IRR, and cash-on-cash return for Dubai off-plan
 * real estate investments based on payment plans, expected rent,
 * service charges, and holding period.
 *
 * All calculations are in AED. Returns are decimals (e.g., 0.065 = 6.5%).
 */

import type { AnalysisInput, AnalysisOutput, RiskFlag } from "../types";

/**
 * Calculate net rental yield.
 * net_yield = (annual_rent - annual_service_charge - other_costs) / total_investment
 */
export function calculateNetYield(input: AnalysisInput): number {
  const annualRent = input.expected_rent;
  const annualServiceCharge = input.service_charge_per_sqft * input.unit_size_sqft;
  const annualCosts = annualServiceCharge + annualRent * 0.02; // 2% maintenance estimate
  const netIncome = annualRent - annualCosts;
  const totalInvestment = input.unit_price + calculateDLDFees(input.unit_price, input.payment_plan.dld_waiver);

  if (totalInvestment <= 0) return 0;
  return netIncome / totalInvestment;
}

/**
 * Calculate DLD registration fees.
 * Standard: 4% of purchase price + AED 580 admin fee (approx).
 * Some developers offer DLD fee waivers as an incentive.
 */
export function calculateDLDFees(unitPrice: number, dldWaiver: boolean): number {
  if (dldWaiver) return 0;
  return unitPrice * 0.04 + 580;
}

/**
 * Calculate approximate IRR using simplified cash flow model.
 *
 * Cash flows:
 * - Year 0: down payment + DLD fees (outflow)
 * - Construction years: staged payments (outflows)
 * - Handover: final construction + handover payment (outflow)
 * - Post-handover: payment plan installments + rental income (net)
 * - Sale: proceeds from sale at end of holding period
 *
 * Uses iterative approximation (Newton-Raphson on NPV function).
 */
export function calculateIRR(input: AnalysisInput, appreciationRate: number = 0.05): number {
  const { unit_price, payment_plan, expected_rent, holding_period, service_charge_per_sqft, unit_size_sqft } = input;
  const dldFees = calculateDLDFees(unit_price, payment_plan.dld_waiver);

  // Build annual cash flows
  const cashFlows: number[] = [];

  // Year 0: down payment + DLD fees
  const downPayment = unit_price * (payment_plan.down_payment_pct / 100);
  cashFlows.push(-(downPayment + dldFees));

  // Construction period: assume 2 years of construction payments
  const constructionPeriod = 2;
  const constructionPayment = (unit_price * (payment_plan.during_construction_pct / 100)) / constructionPeriod;
  for (let i = 0; i < constructionPeriod; i++) {
    cashFlows.push(-constructionPayment);
  }

  // Handover year: handover payment
  const handoverPayment = unit_price * (payment_plan.on_handover_pct / 100);
  cashFlows.push(-handoverPayment);

  // Post-handover: net rental income minus post-handover installments
  const annualServiceCharge = service_charge_per_sqft * unit_size_sqft;
  const netRentalIncome = expected_rent - annualServiceCharge - (expected_rent * 0.02);

  const postHandoverYears = Math.min(
    holding_period - constructionPeriod - 1,
    payment_plan.post_handover_months / 12
  );

  const postHandoverMonthsTotal = payment_plan.post_handover_months;
  const postHandoverTotal = unit_price * (payment_plan.post_handover_pct / 100);

  for (let y = 0; y < holding_period - constructionPeriod - 1; y++) {
    let cf = netRentalIncome;
    // Post-handover payments
    if (y < postHandoverYears && postHandoverMonthsTotal > 0) {
      cf -= postHandoverTotal / postHandoverYears;
    }
    cashFlows.push(cf);
  }

  // Final year: sale proceeds
  const futureValue = unit_price * Math.pow(1 + appreciationRate, holding_period);
  const lastIdx = cashFlows.length - 1;
  cashFlows[lastIdx] += futureValue;

  // Newton-Raphson IRR approximation
  return newtonIRR(cashFlows);
}

/** Newton-Raphson method to find IRR. */
function newtonIRR(cashFlows: number[], guess: number = 0.1, maxIter: number = 100, tolerance: number = 1e-7): number {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    const npv = npvAt(cashFlows, rate);
    const dnpv = derivativeNPV(cashFlows, rate);
    if (Math.abs(dnpv) < 1e-10) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tolerance) return newRate;
    rate = newRate;
  }
  return rate;
}

/** Net present value at given discount rate. */
function npvAt(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
}

/** Derivative of NPV with respect to rate. */
function derivativeNPV(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((sum, cf, t) => sum - (t * cf) / Math.pow(1 + rate, t + 1), 0);
}

/**
 * Calculate cash-on-cash return.
 * CoC = annual pre-tax cash flow / total cash invested
 */
export function calculateCashOnCash(input: AnalysisInput): number {
  const annualRent = input.expected_rent;
  const annualServiceCharge = input.service_charge_per_sqft * input.unit_size_sqft;
  const netIncome = annualRent - annualServiceCharge - annualRent * 0.02;

  const dldFees = calculateDLDFees(input.unit_price, input.payment_plan.dld_waiver);
  const downPayment = input.unit_price * (input.payment_plan.down_payment_pct / 100);
  const totalCashInvested = downPayment + dldFees;

  if (totalCashInvested <= 0) return 0;
  return netIncome / totalCashInvested;
}

/**
 * Calculate total cost of ownership over the analysis period.
 * Includes: purchase price, DLD fees, service charges, maintenance.
 */
export function calculateTCO(input: AnalysisInput): number {
  const dldFees = calculateDLDFees(input.unit_price, input.payment_plan.dld_waiver);
  const annualServiceCharge = input.service_charge_per_sqft * input.unit_size_sqft;
  const annualMaintenance = input.expected_rent * 0.02;

  return (
    input.unit_price +
    dldFees +
    (annualServiceCharge + annualMaintenance) * input.holding_period
  );
}

/**
 * Full analysis pipeline: returns complete AnalysisOutput.
 */
export function runFullAnalysis(
  input: AnalysisInput,
  developerRiskScore: number,
  riskFlags: RiskFlag[],
  appreciationForecast: number
): AnalysisOutput {
  const netYield = calculateNetYield(input);
  const irr = calculateIRR(input, appreciationForecast);
  const coc = calculateCashOnCash(input);
  const tco = calculateTCO(input);
  const dldFees = calculateDLDFees(input.unit_price, input.payment_plan.dld_waiver);

  return {
    net_yield: netYield,
    irr: irr,
    cash_on_cash: coc,
    total_cost_of_ownership: tco,
    dld_fees: dldFees,
    risk_flags: riskFlags,
    developer_risk_score: developerRiskScore,
    area_appreciation_forecast: appreciationForecast,
    disclaimer_key: "yield_model",
  };
}
