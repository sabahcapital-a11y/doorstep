import type { FC } from "react";
import type { AnalysisOutput } from "../../types";
import RiskScoreBadge from "./RiskScoreBadge";
import Disclaimer from "../shared/Disclaimer";

interface Props {
  result: AnalysisOutput | null;
}

const severityColors: Record<string, string> = {
  low: "border-l-gray-400 bg-gray-50 text-gray-700",
  medium: "border-l-amber-400 bg-amber-50 text-amber-800",
  high: "border-l-orange-500 bg-orange-50 text-orange-800",
  critical: "border-l-red-500 bg-red-50 text-red-800",
};

const severityIcons: Record<string, string> = {
  low: "ℹ",
  medium: "⚠",
  high: "🔶",
  critical: "🔴",
};

const ResultsPanel: FC<Props> = ({ result }) => {
  if (!result) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          Analysis Results
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Run an analysis to see results here.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-gray-300">
          <svg
            className="mb-3 h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-sm text-gray-400">
            Fill in the deal parameters and click Analyze
          </span>
        </div>
      </div>
    );
  }

  const yieldColor =
    result.net_yield >= 0.08
      ? "text-green-600"
      : result.net_yield >= 0.05
        ? "text-amber-600"
        : "text-red-500";

  const irrColor =
    result.irr >= 0.12
      ? "text-green-600"
      : result.irr >= 0.06
        ? "text-amber-600"
        : "text-red-500";

  const cocColor =
    result.cash_on_cash >= 0.1
      ? "text-green-600"
      : result.cash_on_cash >= 0.05
        ? "text-amber-600"
        : "text-red-500";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          Analysis Results
        </h2>
        <RiskScoreBadge score={result.developer_risk_score} />
      </div>

      {/* Key Metrics */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Net Yield"
          value={`${(result.net_yield * 100).toFixed(2)}%`}
          colorClass={yieldColor}
        />
        <StatCard
          label="IRR"
          value={`${(result.irr * 100).toFixed(2)}%`}
          colorClass={irrColor}
        />
        <StatCard
          label="Cash-on-Cash"
          value={`${(result.cash_on_cash * 100).toFixed(2)}%`}
          colorClass={cocColor}
        />
        <StatCard
          label="Total Cost of Ownership"
          value={`AED ${result.total_cost_of_ownership.toLocaleString()}`}
          colorClass="text-gray-900"
        />
        <StatCard
          label="DLD Fees"
          value={`AED ${result.dld_fees.toLocaleString()}`}
          colorClass="text-gray-700"
        />
        <StatCard
          label="Area Appreciation"
          value={`${(result.area_appreciation_forecast * 100).toFixed(1)}%`}
          colorClass="text-indigo-600"
        />
      </div>

      {/* Red Flags */}
      {result.risk_flags.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-800">
            Risk Flags ({result.risk_flags.length})
          </h3>
          <ul className="mt-2 space-y-2">
            {result.risk_flags.map((flag, i) => (
              <li
                key={i}
                className={`rounded-lg border-l-4 p-3 text-sm ${severityColors[flag.severity] ?? severityColors.medium}`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-base leading-none">
                    {severityIcons[flag.severity] ?? "⚠"}
                  </span>
                  <div>
                    <p className="font-medium">{flag.message}</p>
                    <p className="mt-0.5 text-xs opacity-80">{flag.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.risk_flags.length === 0 && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✅ No red flags detected for this deal.
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6">
        <Disclaimer variant="yield_model" />
      </div>
    </div>
  );
};

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <p className={`mt-1 text-lg font-bold tracking-tight ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}

export default ResultsPanel;
