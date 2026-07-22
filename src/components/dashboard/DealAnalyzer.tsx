import { useState, useEffect, useCallback, type FC } from "react";
import type { AnalysisInput, AnalysisOutput, PaymentPlan } from "../../types";

interface ProjectOption {
  id: number;
  name: string;
  developer_name: string;
  area: string;
  developer_id: number;
  units: { id: number; type: string; size_sqft: number; list_price: number }[];
  payment_plan: PaymentPlan | null;
}

interface Props {
  onResult: (result: AnalysisOutput) => void;
  onSaved: () => void;
}

const DealAnalyzer: FC<Props> = ({ onResult, onSaved }) => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [unitSize, setUnitSize] = useState<number>(0);
  const [downPaymentPct, setDownPaymentPct] = useState(10);
  const [duringConstructionPct, setDuringConstructionPct] = useState(50);
  const [onHandoverPct, setOnHandoverPct] = useState(20);
  const [postHandoverPct, setPostHandoverPct] = useState(20);
  const [postHandoverMonths, setPostHandoverMonths] = useState(36);
  const [dldWaiver, setDldWaiver] = useState(false);
  const [expectedRent, setExpectedRent] = useState<number>(0);
  const [holdingPeriod, setHoldingPeriod] = useState(5);
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(12);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects as ProjectOption[]);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load projects: " + String(err));
        setLoading(false);
      });
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedUnit = selectedProject?.units.find((u) => u.id === selectedUnitId);

  // Auto-populate payment plan when project changes
  useEffect(() => {
    if (selectedProject?.payment_plan) {
      const pp = selectedProject.payment_plan;
      setDownPaymentPct(pp.down_payment_pct);
      setDuringConstructionPct(pp.during_construction_pct);
      setOnHandoverPct(pp.on_handover_pct);
      setPostHandoverPct(pp.post_handover_pct);
      setPostHandoverMonths(pp.post_handover_months);
      setDldWaiver(!!pp.dld_waiver);
    }
  }, [selectedProject]);

  // Auto-populate unit price and size
  useEffect(() => {
    if (selectedUnit) {
      setUnitPrice(selectedUnit.list_price);
      setUnitSize(selectedUnit.size_sqft);
    }
  }, [selectedUnit]);

  const resetSelection = useCallback(() => {
    setSelectedProjectId(null);
    setSelectedUnitId(null);
    setUnitPrice(0);
    setUnitSize(0);
  }, []);

  // Estimate rent: ~7% gross yield
  useEffect(() => {
    if (unitPrice > 0 && expectedRent === 0) {
      setExpectedRent(Math.round(unitPrice * 0.07));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitPrice]);

  // Ensure payment plan sums to 100%
  const totalPct = downPaymentPct + duringConstructionPct + onHandoverPct + postHandoverPct;

  const handleAnalyze = async () => {
    if (!selectedProjectId) {
      setError("Please select a project and unit.");
      return;
    }
    setError(null);
    setAnalyzing(true);

    try {
      const body: AnalysisInput & { project_id: number; unit_id: number; user_id: number } = {
        unit_price: unitPrice,
        payment_plan: {
          down_payment_pct: downPaymentPct,
          during_construction_pct: duringConstructionPct,
          on_handover_pct: onHandoverPct,
          post_handover_pct: postHandoverPct,
          post_handover_months: postHandoverMonths,
          dld_waiver: dldWaiver,
        },
        expected_rent: expectedRent,
        holding_period: holdingPeriod,
        finance_rate: 0,
        service_charge_per_sqft: serviceChargeRate,
        unit_size_sqft: unitSize,
        project_id: selectedProjectId,
        unit_id: selectedUnitId ?? 0,
        user_id: 1, // Demo user
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const result = (await res.json()) as AnalysisOutput;
      onResult(result);
      onSaved();
    } catch (err) {
      setError("Analysis failed: " + String(err));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-10 w-full rounded bg-gray-100" />
          <div className="h-10 w-full rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-gray-900">
        Deal Analyzer
      </h2>
      <p className="mt-0.5 text-sm text-gray-500">
        Select a project and unit to analyze investment returns.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Project / Unit Selection */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Project & Unit
          </label>
          <div className="mt-1.5 flex gap-3">
            <select
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={selectedProjectId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value) || null;
                setSelectedProjectId(id);
                setSelectedUnitId(null);
              }}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.developer_name} ({p.area})
                </option>
              ))}
            </select>
            {selectedProjectId && (
              <button
                type="button"
                onClick={resetSelection}
                className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
          {selectedProject && (
            <select
              className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={selectedUnitId ?? ""}
              onChange={(e) => setSelectedUnitId(Number(e.target.value) || null)}
            >
              <option value="">Select a unit...</option>
              {selectedProject.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.type.toUpperCase()} — {u.size_sqft.toLocaleString()} sqft — AED {u.list_price.toLocaleString()}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Unit Price (AED)
          </label>
          <input
            type="number"
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={unitPrice || ""}
            onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
            placeholder="e.g. 1500000"
          />
        </div>

        {/* Unit Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Unit Size (sqft)
          </label>
          <input
            type="number"
            className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={unitSize || ""}
            onChange={(e) => setUnitSize(Number(e.target.value) || 0)}
            placeholder="Auto-populated"
          />
        </div>

        {/* Expected Annual Rent */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Expected Annual Rent (AED)
          </label>
          <input
            type="number"
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={expectedRent || ""}
            onChange={(e) => setExpectedRent(Number(e.target.value) || 0)}
            placeholder="e.g. 95000"
          />
          <p className="mt-0.5 text-xs text-gray-400">
            Defaults to ~7% gross yield of unit price
          </p>
        </div>

        {/* Holding Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Holding Period (years)
          </label>
          <input
            type="range"
            min={1}
            max={15}
            value={holdingPeriod}
            onChange={(e) => setHoldingPeriod(Number(e.target.value))}
            className="mt-2 w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 yr</span>
            <span className="font-medium text-indigo-600">{holdingPeriod} years</span>
            <span>15 yrs</span>
          </div>
        </div>

        {/* Payment Plan Section */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-800">Payment Plan</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Down Payment %
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value) || 0)}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                During Construction %
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={duringConstructionPct}
                onChange={(e) => setDuringConstructionPct(Number(e.target.value) || 0)}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                On Handover %
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={onHandoverPct}
                onChange={(e) => setOnHandoverPct(Number(e.target.value) || 0)}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Post-Handover %
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={postHandoverPct}
                onChange={(e) => setPostHandoverPct(Number(e.target.value) || 0)}
                min={0}
                max={100}
              />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Post-Handover Months
              </label>
              <input
                type="number"
                className="mt-1 block w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={postHandoverMonths}
                onChange={(e) => setPostHandoverMonths(Number(e.target.value) || 0)}
                min={0}
                max={120}
              />
            </div>
            {totalPct !== 100 && (
              <span className="text-xs text-amber-600">
                ⚠ Plan sums to {totalPct}% (should be 100%)
              </span>
            )}
            {totalPct === 100 && (
              <span className="text-xs text-green-600">✓ Plan balanced</span>
            )}
          </div>
        </div>

        {/* DLD Waiver + Service Charge */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600"
              checked={dldWaiver}
              onChange={(e) => setDldWaiver(e.target.checked)}
            />
            DLD Fee Waiver
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Service Charge (AED/sqft)
          </label>
          <input
            type="number"
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={serviceChargeRate || ""}
            onChange={(e) => setServiceChargeRate(Number(e.target.value) || 0)}
            placeholder="e.g. 12"
          />
        </div>
      </div>

      {/* Analyze Button */}
      <div className="mt-6">
        <button
          type="button"
          disabled={analyzing || !selectedProjectId}
          onClick={handleAnalyze}
          className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          {analyzing ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            "Analyze Deal"
          )}
        </button>
      </div>
    </div>
  );
};

export default DealAnalyzer;
