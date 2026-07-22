import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { AnalysisOutput } from "../types";
import DealAnalyzer from "../components/dashboard/DealAnalyzer";
import ResultsPanel from "../components/dashboard/ResultsPanel";
import PortfolioView from "../components/dashboard/PortfolioView";
import Disclaimer from "../components/shared/Disclaimer";

type Tab = "analyze" | "portfolio";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("analyze");
  const [result, setResult] = useState<AnalysisOutput | null>(null);
  const [portfolioRefresh, setPortfolioRefresh] = useState(0);

  const handleResult = useCallback((r: AnalysisOutput) => {
    setResult(r);
  }, []);

  const handleSaved = useCallback(() => {
    setPortfolioRefresh((n) => n + 1);
  }, []);

  const handleViewAnalysis = useCallback((r: AnalysisOutput) => {
    setResult(r);
    setActiveTab("analyze");
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setResult(null);
    setActiveTab("analyze");
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "analyze", label: "Analyze" },
    { id: "portfolio", label: "Portfolio" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
              OQ
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                OffPlanIQ
              </h1>
              <p className="text-xs text-gray-500">
                Dubai Off-Plan Investment Analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            Demo Mode
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-6xl gap-1 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {activeTab === "analyze" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <DealAnalyzer onResult={handleResult} onSaved={handleSaved} />
            <ResultsPanel result={result} />
          </div>
        )}

        {activeTab === "portfolio" && (
          <PortfolioView
            onViewAnalysis={handleViewAnalysis}
            onNewAnalysis={handleNewAnalysis}
            refreshKey={portfolioRefresh}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Disclaimer variant="standard" />
          <p className="mt-4 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} OffPlanIQ. Built for the Dubai market.
            Independent analytics — not a brokerage.
          </p>
        </div>
      </footer>
    </div>
  );
}
