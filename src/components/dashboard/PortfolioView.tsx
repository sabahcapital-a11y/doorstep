import { useState, useEffect, type FC } from "react";
import type { AnalysisOutput } from "../../types";
import RiskScoreBadge from "./RiskScoreBadge";

interface SavedAnalysis {
  id: number;
  user_id: number;
  project_id: number | null;
  unit_id: number | null;
  project_name: string | null;
  unit_type: string | null;
  results: AnalysisOutput;
  created_at: string;
  input_params: Record<string, unknown>;
}

interface Props {
  /** Callback to view a saved analysis result */
  onViewAnalysis: (result: AnalysisOutput) => void;
  /** Callback to start a new analysis */
  onNewAnalysis: () => void;
  /** Incremented when a new analysis is saved to trigger refresh */
  refreshKey: number;
}

const PortfolioView: FC<Props> = ({ onViewAnalysis, onNewAnalysis, refreshKey }) => {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/portfolio?user_id=1")
      .then((res) => res.json())
      .then((data) => {
        setAnalyses(data as SavedAnalysis[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  const handleDelete = async (id: number) => {
    try {
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silently ignore
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            My Analyses
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Saved deal analyses and their results.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewAnalysis}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          + New Analysis
        </button>
      </div>

      {loading ? (
        <div className="mt-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : analyses.length === 0 ? (
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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <span className="text-sm text-gray-400">
            No saved analyses yet. Run your first deal analysis.
          </span>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Net Yield
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Risk
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {analyses.map((a) => (
                <tr
                  key={a.id}
                  className="transition hover:bg-gray-50/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {a.project_name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {a.unit_type?.toUpperCase() ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold">
                    <span
                      className={
                        a.results.net_yield >= 0.06
                          ? "text-green-600"
                          : "text-amber-600"
                      }
                    >
                      {(a.results.net_yield * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <RiskScoreBadge
                      score={a.results.developer_risk_score}
                      size="sm"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-500">
                    {formatDate(a.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onViewAnalysis(a.results)}
                      className="mr-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PortfolioView;
