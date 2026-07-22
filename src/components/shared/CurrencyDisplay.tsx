import type { FC } from "react";

interface Props {
  /** Amount in AED */
  amount: number;
  /** Display format */
  format?: "short" | "full";
  className?: string;
}

/**
 * CurrencyDisplay — AED-aware currency formatting component.
 */
const CurrencyDisplay: FC<Props> = ({ amount, format = "full", className = "" }) => {
  const formatted = format === "short"
    ? formatShort(amount)
    : new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  return <span className={className}>{formatted}</span>;
};

function formatShort(amount: number): string {
  if (amount >= 1_000_000_000) return `AED ${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `AED ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `AED ${(amount / 1_000).toFixed(0)}K`;
  return `AED ${amount.toFixed(0)}`;
}

export default CurrencyDisplay;
