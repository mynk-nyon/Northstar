"use client";

import React from "react";
import { EventModel, BudgetCategoryModel, TaskModel, VendorModel } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { CATEGORY_TAXONOMY, TIMELINE_PHASES, CategoryKey } from "@/lib/config/constants";
import { computeBudgetSummary } from "@/lib/domain/budget";
import { groupTasksByPhase } from "@/lib/domain/timeline";
import { Printer, Download } from "lucide-react";

interface ExportClientProps {
  event: EventModel;
  categories: BudgetCategoryModel[];
  tasks: TaskModel[];
  vendors: VendorModel[];
}

export function ExportClient({
  event,
  categories,
  tasks,
  vendors,
}: ExportClientProps) {
  const budgetSummary = computeBudgetSummary({
    eventType: event.type,
    totalBudget: event.totalBudget,
    guestCount: event.guestCount,
    priorities: event.priorities,
    manualOverrides: categories.reduce((acc, c) => {
      if (c.isManualOverride) acc[c.categoryKey] = c.allocatedAmount;
      return acc;
    }, {} as Partial<Record<CategoryKey, number>>),
    committedAmounts: categories.reduce((acc, c) => {
      acc[c.categoryKey] = c.committedAmount;
      return acc;
    }, {} as Partial<Record<CategoryKey, number>>),
  });

  const groupedTasks = groupTasksByPhase(tasks);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const plan = {
      event,
      budgetSummary,
      tasks,
      vendors,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.toLowerCase().replace(/\s+/g, "_")}_plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Printable Event Master Plan
          </h2>
          <p className="text-xs text-slate-500">
            Formatted for desktop printing, PDF export, or raw JSON archive.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Master Document Body */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Official Event Master Plan
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {event.title}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {event.location} &bull; {formatDate(event.date)} &bull; {event.guestCount} Guests
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              Generated via Northstar GenAI Planner
            </div>
          </div>
        </div>

        {/* Section 1: Executive Financial Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">
            1. Financial Summary &amp; Contingency
          </h2>

          <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Total Budget</span>
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(budgetSummary.totalBudget, event.currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Committed Spend</span>
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(budgetSummary.totalCommitted, event.currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Remaining Buffer</span>
              <span className="text-base font-bold text-emerald-700">
                {formatCurrency(budgetSummary.totalRemaining, event.currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Contingency Reserve</span>
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(budgetSummary.contingencyReserve, event.currency)} ({budgetSummary.contingencyPercentage}%)
              </span>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200 mt-3">
            <thead className="bg-slate-100 font-bold uppercase text-slate-700">
              <tr>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Allocated</th>
                <th className="p-2.5">Committed</th>
                <th className="p-2.5">Remaining</th>
                <th className="p-2.5">Cost/Head</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {budgetSummary.categories.map((c) => (
                <tr key={c.categoryKey}>
                  <td className="p-2.5 font-semibold">{c.name}</td>
                  <td className="p-2.5">{formatCurrency(c.allocatedAmount, event.currency)}</td>
                  <td className="p-2.5">{formatCurrency(c.committedAmount, event.currency)}</td>
                  <td className="p-2.5 font-medium">{formatCurrency(c.remainingAmount, event.currency)}</td>
                  <td className="p-2.5">{formatCurrency(c.costPerHead, event.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 2: Phased Execution Schedule */}
        <div className="space-y-4 print-page-break">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">
            2. Countdown Milestone Schedule
          </h2>

          <div className="space-y-4">
            {TIMELINE_PHASES.map((phaseKey) => {
              const group = groupedTasks[phaseKey];
              if (!group || group.tasks.length === 0) return null;

              return (
                <div key={phaseKey} className="print-avoid-break space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded">
                    {group.label}
                  </h3>
                  <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-semibold text-slate-600">
                      <tr>
                        <th className="p-2 w-1/2">Milestone Task</th>
                        <th className="p-2">Due Date</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {group.tasks.map((task) => (
                        <tr key={task.id}>
                          <td className="p-2 font-medium">{task.title}</td>
                          <td className="p-2">{formatDate(task.dueDate)}</td>
                          <td className="p-2 uppercase text-[10px] font-bold">
                            {task.status.replace("_", " ")}
                          </td>
                          <td className="p-2">{task.owner || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Vendor Directory Sheet */}
        <div className="space-y-4 print-avoid-break">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">
            3. Vendor Directory &amp; Contacts
          </h2>

          <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200">
            <thead className="bg-slate-100 font-bold uppercase text-slate-700">
              <tr>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Vendor Name</th>
                <th className="p-2.5">Contact</th>
                <th className="p-2.5">Quote</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="p-2.5 font-semibold capitalize">
                    {CATEGORY_TAXONOMY[v.categoryKey]?.label || v.categoryKey}
                  </td>
                  <td className="p-2.5 font-bold">{v.name}</td>
                  <td className="p-2.5">{v.contact}</td>
                  <td className="p-2.5">{formatCurrency(v.quoteAmount, event.currency)}</td>
                  <td className="p-2.5 capitalize">{v.contractStatus.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
