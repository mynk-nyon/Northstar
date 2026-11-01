"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  EventModel,
  BudgetCategoryModel,
  SimulationConsequenceReport,
  TradeoffAlternative,
} from "@/lib/domain/types";
import { SimulationNarrativeOutput } from "@/lib/ai/types";
import { computeBudgetSummary } from "@/lib/domain/budget";
import { simulateWhatIf } from "@/lib/domain/simulator";
import { formatCurrency } from "@/lib/utils/formatting";
import { CATEGORY_TAXONOMY, CategoryKey } from "@/lib/config/constants";
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Sliders,
  DollarSign,
  Users,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X,
  Lightbulb,
} from "lucide-react";

interface BudgetSimulatorClientProps {
  event: EventModel;
  categories: BudgetCategoryModel[];
}

export function BudgetSimulatorClient({
  event,
  categories: initialCategories,
}: BudgetSimulatorClientProps) {
  // Category state (supports manual overrides)
  const [categories, setCategories] = useState<BudgetCategoryModel[]>(initialCategories);
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [overrideInputVal, setOverrideInputVal] = useState<string>("");

  // What-If Simulator state
  const [simGuestCount, setSimGuestCount] = useState<number>(event.guestCount);
  const [simBudget, setSimBudget] = useState<number>(event.totalBudget);
  const [simPriorities, setSimPriorities] = useState<CategoryKey[]>(event.priorities);
  const [dateShiftDays, setDateShiftDays] = useState<number>(0);

  // AI Narrative state
  const [aiNarrative, setAiNarrative] = useState<SimulationNarrativeOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");

  // Committed amounts dictionary
  const committedMap = useMemo(() => {
    return categories.reduce((acc, c) => {
      acc[c.categoryKey] = c.committedAmount;
      return acc;
    }, {} as Record<CategoryKey, number>);
  }, [categories]);

  // Manual overrides dictionary
  const overridesMap = useMemo(() => {
    return categories.reduce((acc, c) => {
      if (c.isManualOverride) {
        acc[c.categoryKey] = c.allocatedAmount;
      }
      return acc;
    }, {} as Partial<Record<CategoryKey, number>>);
  }, [categories]);

  // Pure deterministic budget summary for current state
  const currentBudgetSummary = useMemo(() => {
    return computeBudgetSummary({
      eventType: event.type,
      totalBudget: event.totalBudget,
      guestCount: event.guestCount,
      priorities: event.priorities,
      manualOverrides: overridesMap,
      committedAmounts: committedMap,
    });
  }, [event, overridesMap, committedMap]);

  // Pure deterministic consequence report for what-if simulation (0ms instant calculation)
  const consequenceReport: SimulationConsequenceReport = useMemo(() => {
    return simulateWhatIf({
      eventType: event.type,
      originalGuestCount: event.guestCount,
      simulatedGuestCount: simGuestCount,
      originalBudget: event.totalBudget,
      simulatedBudget: simBudget,
      venueCapacity: event.venueCapacity,
      originalPriorities: event.priorities,
      simulatedPriorities: simPriorities,
      manualOverrides: overridesMap,
      committedAmounts: committedMap,
      dateShiftDays,
    });
  }, [
    event,
    simGuestCount,
    simBudget,
    simPriorities,
    overridesMap,
    committedMap,
    dateShiftDays,
  ]);

  // Debounced API call for AI Trade-Off Narrative
  useEffect(() => {
    const isStateChanged =
      simGuestCount !== event.guestCount ||
      simBudget !== event.totalBudget ||
      dateShiftDays !== 0 ||
      JSON.stringify(simPriorities) !== JSON.stringify(event.priorities);

    if (!isStateChanged) {
      setAiNarrative(null);
      return;
    }

    setIsAiLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: event.type,
            originalGuestCount: event.guestCount,
            simulatedGuestCount: simGuestCount,
            originalBudget: event.totalBudget,
            simulatedBudget: simBudget,
            venueCapacity: event.venueCapacity,
            priorities: simPriorities,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setAiNarrative(data.narrative);
          setLiveAnnouncement(
            `Simulation recomputed. Guest count is ${simGuestCount}. Budget delta is ${
              consequenceReport.budgetDelta >= 0 ? "+" : ""
            }$${consequenceReport.budgetDelta}. ${
              consequenceReport.capacityBreach.occurred ? "Venue capacity breached." : ""
            }`
          );
        }
      } catch (err) {
        console.error("Simulation API fetch failed:", err);
      } finally {
        setIsAiLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [simGuestCount, simBudget, simPriorities, dateShiftDays, event, consequenceReport]);

  // Reset simulator
  const handleResetSimulation = () => {
    setSimGuestCount(event.guestCount);
    setSimBudget(event.totalBudget);
    setSimPriorities(event.priorities);
    setDateShiftDays(0);
    setAiNarrative(null);
    setLiveAnnouncement("Simulation reset to baseline event values.");
  };

  // Apply alternative directly
  const handleApplyAlternative = (alt: TradeoffAlternative) => {
    if (alt.actionType === "cut_guests") {
      if (consequenceReport.capacityBreach.occurred && event.venueCapacity) {
        setSimGuestCount(event.venueCapacity);
      } else {
        setSimGuestCount((prev) => Math.max(1, prev - 10));
      }
    } else if (alt.actionType === "increase_budget") {
      setSimBudget((prev) => prev + Math.abs(alt.costImpact));
    } else if (alt.actionType === "shift_date") {
      setDateShiftDays(1);
    }
  };

  // Move priority up/down
  const handleMovePriority = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= simPriorities.length) return;

    const newPriorities = [...simPriorities];
    const [moved] = newPriorities.splice(index, 1);
    newPriorities.splice(targetIndex, 0, moved);
    setSimPriorities(newPriorities);
  };

  // Save manual override
  const handleSaveOverride = async (categoryKey: string) => {
    const parsed = parseFloat(overrideInputVal);
    if (isNaN(parsed) || parsed < 0) return;

    try {
      const res = await fetch(`/api/events/${event.id}/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryKey,
          allocatedAmount: parsed,
          isManualOverride: true,
        }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.categoryKey === categoryKey
              ? { ...c, allocatedAmount: parsed, isManualOverride: true }
              : c
          )
        );
        setEditingCategoryKey(null);
        setLiveAnnouncement(`Updated override for ${categoryKey} to $${parsed}`);
      }
    } catch (e) {
      console.error("Failed to save override:", e);
    }
  };

  // Clear manual override
  const handleClearOverride = async (categoryKey: string) => {
    try {
      const res = await fetch(`/api/events/${event.id}/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryKey,
          isManualOverride: false,
        }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.categoryKey === categoryKey
              ? { ...c, isManualOverride: false }
              : c
          )
        );
        setLiveAnnouncement(`Cleared manual override for ${categoryKey}`);
      }
    } catch (e) {
      console.error("Failed to clear override:", e);
    }
  };

  const isSimulating =
    simGuestCount !== event.guestCount ||
    simBudget !== event.totalBudget ||
    dateShiftDays !== 0 ||
    JSON.stringify(simPriorities) !== JSON.stringify(event.priorities);

  return (
    <div className="space-y-8">
      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      {/* Simulator Hero Control Center */}
      <div className="bg-white rounded-2xl border-2 border-brand-200/80 shadow-md p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Decision-Support & Trade-Off Simulator</span>
                {isSimulating && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200 animate-pulse">
                    What-If Active
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Adjust headcount and budget to simulate mathematical consequences and feasible trade-offs.
              </p>
            </div>
          </div>

          {isSimulating && (
            <button
              type="button"
              onClick={handleResetSimulation}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset to Base
            </button>
          )}
        </div>

        {/* What-If Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guest Count Slider + Input */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="guest-count-slider"
                className="text-sm font-bold text-slate-900 flex items-center gap-1.5"
              >
                <Users className="w-4 h-4 text-brand-600" aria-hidden="true" />
                Guest Count Headcount
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Base: {event.guestCount}</span>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={simGuestCount}
                  onChange={(e) => setSimGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus-visible:ring-2"
                  aria-label="Direct guest count input"
                />
              </div>
            </div>

            <input
              id="guest-count-slider"
              type="range"
              min={Math.max(10, event.guestCount - 60)}
              max={event.guestCount + 100}
              step={1}
              value={simGuestCount}
              onChange={(e) => setSimGuestCount(parseInt(e.target.value))}
              aria-valuenow={simGuestCount}
              aria-valuemin={Math.max(10, event.guestCount - 60)}
              aria-valuemax={event.guestCount + 100}
              aria-valuetext={`${simGuestCount} guests`}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />

            <div className="flex justify-between text-[11px] font-medium text-slate-500">
              <span>{Math.max(10, event.guestCount - 60)} guests</span>
              <span className={simGuestCount !== event.guestCount ? "font-bold text-brand-700" : ""}>
                Delta: {simGuestCount - event.guestCount >= 0 ? "+" : ""}
                {simGuestCount - event.guestCount}
              </span>
              <span>{event.guestCount + 100} guests</span>
            </div>
          </div>

          {/* Budget Slider + Input */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="budget-slider"
                className="text-sm font-bold text-slate-900 flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                Total Event Budget
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Base: {formatCurrency(event.totalBudget, event.currency)}</span>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={simBudget}
                  onChange={(e) => setSimBudget(Math.max(1000, parseInt(e.target.value) || 1000))}
                  className="w-28 px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus-visible:ring-2"
                  aria-label="Direct budget input"
                />
              </div>
            </div>

            <input
              id="budget-slider"
              type="range"
              min={Math.max(1000, event.totalBudget - 15000)}
              max={event.totalBudget + 25000}
              step={250}
              value={simBudget}
              onChange={(e) => setSimBudget(parseInt(e.target.value))}
              aria-valuenow={simBudget}
              aria-valuemin={Math.max(1000, event.totalBudget - 15000)}
              aria-valuemax={event.totalBudget + 25000}
              aria-valuetext={`$${simBudget.toLocaleString()}`}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <div className="flex justify-between text-[11px] font-medium text-slate-500">
              <span>{formatCurrency(Math.max(1000, event.totalBudget - 15000), event.currency)}</span>
              <span className={simBudget !== event.totalBudget ? "font-bold text-emerald-700" : ""}>
                Delta: {simBudget - event.totalBudget >= 0 ? "+" : ""}
                {formatCurrency(simBudget - event.totalBudget, event.currency)}
              </span>
              <span>{formatCurrency(event.totalBudget + 25000, event.currency)}</span>
            </div>
          </div>
        </div>

        {/* Priority Re-ordering Toolbar */}
        <div className="border-t border-slate-100 pt-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span>Stated Priorities (Click arrows to rebalance category weights):</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {simPriorities.map((key, idx) => (
              <div
                key={key}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
              >
                <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 text-[10px] flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span>{CATEGORY_TAXONOMY[key]?.label || key}</span>
                <div className="flex items-center ml-1 space-x-0.5">
                  <button
                    type="button"
                    onClick={() => handleMovePriority(idx, "up")}
                    disabled={idx === 0}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label={`Move ${CATEGORY_TAXONOMY[key]?.label} higher priority`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMovePriority(idx, "down")}
                    disabled={idx === simPriorities.length - 1}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label={`Move ${CATEGORY_TAXONOMY[key]?.label} lower priority`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Consequence Report Section */}
      <section aria-labelledby="consequence-report-heading" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="consequence-report-heading" className="text-xl font-bold text-slate-900 tracking-tight">
              Simulation Consequence Report
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic mathematical consequences &amp; feasible trade-offs
            </p>
          </div>

          {isAiLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Evaluating trade-offs...
            </span>
          )}
        </div>

        {/* Critical Alerts Banner (Breaches & Overruns) */}
        {consequenceReport.capacityBreach.occurred && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex items-start gap-3 shadow-sm animate-in fade-in"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <div className="font-bold text-sm">CRITICAL: Venue Capacity Exceeded</div>
              <p className="text-xs text-rose-800">{consequenceReport.capacityBreach.message}</p>
            </div>
          </div>
        )}

        {consequenceReport.contingencyStatus.isDrainedBelowReserve && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3 shadow-sm animate-in fade-in"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <div className="font-bold text-sm">WARNING: Contingency Depleted Below 5% Safe Floor</div>
              <p className="text-xs text-amber-800">{consequenceReport.contingencyStatus.message}</p>
            </div>
          </div>
        )}

        {/* AI Narrative Commentary Card */}
        {aiNarrative && (
          <div className="p-6 rounded-xl bg-slate-900 text-white shadow-md space-y-4">
            <div className="flex items-center gap-2 text-brand-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Decision-Support Analysis</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">{aiNarrative.headline}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{aiNarrative.summaryNarrative}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-lg bg-slate-800/60">
                <span className="font-bold text-slate-200 block mb-1">Category Impact</span>
                <span className="text-slate-400">{aiNarrative.categoryImpactAnalysis}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/60">
                <span className="font-bold text-slate-200 block mb-1">Capacity Advisory</span>
                <span className="text-slate-400">{aiNarrative.capacityAdvisory}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/60">
                <span className="font-bold text-slate-200 block mb-1">Emergency Resilience</span>
                <span className="text-slate-400">{aiNarrative.contingencyAdvisory}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2-3 Ranked Feasible Alternatives (Core Differentiator) */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>Feasible Alternatives &amp; Sacrifices</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {consequenceReport.alternatives.map((alt, idx) => (
              <div
                key={alt.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-brand-300 transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      Alternative #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {alt.feasibilityScore}% Feasible
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {alt.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {alt.tradeOff}
                  </p>

                  <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 text-xs text-rose-900">
                    <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-700 mb-0.5">
                      Required Sacrifice:
                    </span>
                    {alt.sacrifice}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500 block">Cost Delta</span>
                    <span className="font-bold text-slate-900">
                      {alt.costImpact >= 0 ? "+" : ""}
                      {formatCurrency(alt.costImpact, event.currency)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyAlternative(alt)}
                    className="text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
                  >
                    Apply What-If
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Headcount Scaling & Numeric Deltas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">Headcount Delta</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span>{consequenceReport.newGuestCount} guests</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                consequenceReport.guestDelta > 0
                  ? "bg-amber-100 text-amber-800"
                  : consequenceReport.guestDelta < 0
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-700"
              }`}>
                {consequenceReport.guestDelta >= 0 ? "+" : ""}{consequenceReport.guestDelta}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Base was {consequenceReport.originalGuestCount} guests
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">Catering Load Impact</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(consequenceReport.cateringTotalDelta, event.currency)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Unit rate: {formatCurrency(consequenceReport.originalCateringCostPerHead, event.currency)}/head
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">Contingency Absorption</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(consequenceReport.contingencyStatus.newAmount, event.currency)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {consequenceReport.contingencyStatus.newPercentage}% reserve ({consequenceReport.contingencyStatus.delta >= 0 ? "+" : ""}{formatCurrency(consequenceReport.contingencyStatus.delta, event.currency)})
            </div>
          </div>
        </div>
      </section>

      {/* Deterministic Category Breakdown & Overrides Table */}
      <section aria-labelledby="category-breakdown-heading" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 id="category-breakdown-heading" className="text-lg font-bold text-slate-900">
              Budget Category Allocation &amp; Committed Spend
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic allocations with manual override controls and overrun detection.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Funded
            </span>
            <span className="inline-flex items-center gap-1 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Overrun Flag
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th scope="col" className="px-6 py-3.5">Category</th>
                <th scope="col" className="px-6 py-3.5">Allocated</th>
                <th scope="col" className="px-6 py-3.5">Committed</th>
                <th scope="col" className="px-6 py-3.5">Remaining</th>
                <th scope="col" className="px-6 py-3.5">Cost/Head</th>
                <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentBudgetSummary.categories.map((cat) => {
                const isEditing = editingCategoryKey === cat.categoryKey;

                return (
                  <tr key={cat.categoryKey} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span>{cat.name}</span>
                      {cat.isManualOverride && (
                        <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Manual
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={overrideInputVal}
                            onChange={(e) => setOverrideInputVal(e.target.value)}
                            className="w-24 px-2 py-1 text-xs border border-brand-500 rounded font-bold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveOverride(cat.categoryKey)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            aria-label={`Save override for ${cat.name}`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryKey(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            aria-label="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900">
                          {formatCurrency(cat.allocatedAmount, event.currency)}
                          <span className="text-xs font-normal text-slate-400 ml-1.5">
                            ({cat.percentageOfBudget}%)
                          </span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {formatCurrency(cat.committedAmount, event.currency)}
                    </td>

                    <td className="px-6 py-4">
                      {cat.isOverrun ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Overrun by {formatCurrency(cat.overrunAmount, event.currency)}
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-700">
                          {formatCurrency(cat.remainingAmount, event.currency)}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatCurrency(cat.costPerHead, event.currency)}/head
                    </td>

                    <td className="px-6 py-4 text-right">
                      {!isEditing && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryKey(cat.categoryKey);
                              setOverrideInputVal(String(cat.allocatedAmount));
                            }}
                            className="p-1 text-slate-400 hover:text-brand-600 rounded transition"
                            aria-label={`Override allocation for ${cat.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {cat.isManualOverride && (
                            <button
                              type="button"
                              onClick={() => handleClearOverride(cat.categoryKey)}
                              className="text-[11px] text-slate-400 hover:text-rose-600 transition"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
