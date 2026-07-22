import type { FC } from "react";

interface Props {
  /** Which disclaimer key to display. Defaults to "standard". */
  variant?: "standard" | "yield_model";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Disclaimer — reusable legal disclaimer component.
 * Must appear on every analysis result, dashboard, and AI advisor output.
 */
const Disclaimer: FC<Props> = ({ variant = "standard", className = "" }) => {
  const text = variant === "yield_model"
    ? "Yield and IRR projections are model estimates based on current market data. Actual returns may vary. This is not investment advice."
    : "OffPlanIQ is a data analytics tool, not a brokerage. This is not investment advice. Consult a licensed professional before making investment decisions.";

  return (
    <div className={`rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 ${className}`}>
      <span className="font-semibold text-gray-600">Disclaimer:</span> {text}
    </div>
  );
};

export default Disclaimer;
