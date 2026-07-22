import type { FC } from "react";

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
}

/**
 * RiskScoreBadge — visual badge for developer risk score.
 * 0-15: green (low), 16-35: yellow (moderate), 36-60: orange (high), 61+: red (severe)
 */
const RiskScoreBadge: FC<Props> = ({ score, size = "md" }) => {
  const color = score <= 15
    ? "bg-green-100 text-green-800"
    : score <= 35
      ? "bg-yellow-100 text-yellow-800"
      : score <= 60
        ? "bg-orange-100 text-orange-800"
        : "bg-red-100 text-red-800";

  const label = score <= 15
    ? "Low Risk"
    : score <= 35
      ? "Moderate"
      : score <= 60
        ? "High Risk"
        : "Severe Risk";

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : size === "lg" ? "px-4 py-1.5 text-base" : "px-3 py-1 text-sm";

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${color} ${sizeClass}`}>
      {label} ({score}/100)
    </span>
  );
};

export default RiskScoreBadge;
