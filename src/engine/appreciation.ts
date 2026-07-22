/**
 * Area trend analysis engine.
 *
 * Computes appreciation rates, rental yield trends, and forecasts
 * from area transaction data.
 */

import type { AreaTrend } from "../types";

/**
 * Calculate compound annual appreciation rate from a series of price points.
 */
export function calculateAppreciationRate(trends: AreaTrend[]): number {
  if (trends.length < 2) return 0;

  const sorted = [...trends].sort((a, b) => a.period.localeCompare(b.period));
  const firstPrice = sorted[0].avg_price_per_sqft;
  const lastPrice = sorted[sorted.length - 1].avg_price_per_sqft;

  if (firstPrice <= 0) return 0;

  // Number of periods between first and last
  const periods = sorted.length - 1;
  // Assume quarterly data, convert to years
  const years = periods / 4;

  if (years <= 0) return 0;

  // CAGR = (last/first)^(1/years) - 1
  return Math.pow(lastPrice / firstPrice, 1 / years) - 1;
}

/**
 * Forecast future appreciation based on trend and market factors.
 * Simple linear projection for stub — will be replaced with ML model.
 */
export function forecastAppreciation(trends: AreaTrend[], yearsAhead: number = 5): number {
  const cagr = calculateAppreciationRate(trends);

  // Dampen long-term forecasts — no area grows at 10%+ forever
  const dampened = Math.min(cagr, 0.08);

  return dampened * yearsAhead;
}

/**
 * Calculate gross rental yield for an area.
 */
export function calculateAreaRentalYield(trend: AreaTrend): number {
  if (trend.avg_price_per_sqft <= 0) return 0;
  return trend.avg_rent_per_sqft / trend.avg_price_per_sqft;
}

/**
 * Get latest trend for an area.
 */
export function getLatestTrend(trends: AreaTrend[]): AreaTrend | null {
  if (trends.length === 0) return null;
  return [...trends].sort((a, b) => b.period.localeCompare(a.period))[0];
}
