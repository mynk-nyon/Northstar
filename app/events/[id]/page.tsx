import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { computeBudgetSummary } from "@/lib/domain/budget";
import { evaluateCapacity } from "@/lib/domain/capacity";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { CATEGORY_TAXONOMY, CategoryKey } from "@/lib/config/constants";
import {
  Wallet,
  CalendarCheck,
  Store,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await eventRepository.findById(id);

  if (!event) {
    notFound();
  }

  // Pure deterministic budget summary computation
  const budgetSummary = computeBudgetSummary({
    eventType: event.type,
    totalBudget: event.totalBudget,
    guestCount: event.guestCount,
    priorities: event.priorities,
    committedAmounts: event.categories.reduce((acc, c) => {
      acc[c.categoryKey] = c.committedAmount;
      return acc;
    }, {} as Record<CategoryKey, number>),
  });

  const capacityEval = evaluateCapacity(event.guestCount, event.venueCapacity);

  const completedTasks = event.tasks.filter((t) => t.status === "done");
  const taskProgress =
    event.tasks.length > 0
      ? Math.round((completedTasks.length / event.tasks.length) * 100)
      : 0;

  const nextTasks = event.tasks
    .filter((t) => t.status !== "done")
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome & Status Alert */}
      {capacityEval.isBreached && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="font-bold text-sm">Venue Capacity Violation</h3>
            <p className="text-xs sm:text-sm text-rose-800 mt-0.5">
              {capacityEval.warningMessage}
            </p>
            <Link
              href={`/events/${event.id}/budget`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 underline mt-2"
            >
              Open Trade-Off Simulator to test capacity reduction <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Health Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Committed Spend</span>
              <Wallet className="w-4 h-4 text-brand-600" aria-hidden="true" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(budgetSummary.totalCommitted, event.currency)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              of {formatCurrency(event.totalBudget, event.currency)} ({Math.round(
                (budgetSummary.totalCommitted / event.totalBudget) * 100
              )}% committed)
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Remaining Buffer:</span>
            <span className="font-bold text-slate-800">
              {formatCurrency(budgetSummary.totalRemaining, event.currency)}
            </span>
          </div>
        </div>

        {/* Contingency Cushion Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Contingency Reserve</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(budgetSummary.contingencyReserve, event.currency)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {budgetSummary.contingencyPercentage}% reserve (min 5% enforced)
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Protection Status:</span>
            <span className="font-bold text-emerald-700">Protected</span>
          </div>
        </div>

        {/* Task Completion Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Execution Progress</span>
              <CalendarCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {taskProgress}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {completedTasks.length} of {event.tasks.length} milestone tasks done
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Vendor Partner Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Vendor Checklist</span>
              <Store className="w-4 h-4 text-purple-600" aria-hidden="true" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {event.vendors.length} Vendors
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {event.vendors.filter((v) => v.contractStatus === "contract_signed").length} contracts secured
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Unsettled Balance:</span>
            <span className="font-bold text-slate-800">
              {formatCurrency(
                event.vendors.reduce((s, v) => s + v.balanceDue, 0),
                event.currency
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Ranking + Next Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stated Priorities & Allocation Share */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stated Priorities</h2>
              <p className="text-xs text-slate-500">Budget engine weighted ranking</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
              Ranked 1..{event.priorities.length}
            </span>
          </div>

          <ol className="space-y-2.5">
            {event.priorities.map((key, idx) => {
              const meta = CATEGORY_TAXONOMY[key];
              const categoryData = budgetSummary.categories.find((c) => c.categoryKey === key);

              return (
                <li
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {meta?.label || key}
                      </div>
                      <div className="text-xs text-slate-500">
                        {categoryData?.percentageOfBudget}% of budget
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800">
                      {formatCurrency(categoryData?.allocatedAmount || 0, event.currency)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="pt-2">
            <Link
              href={`/events/${event.id}/budget`}
              className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 p-2 rounded-lg transition"
            >
              Simulate Priority Re-ranking <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right 2 Columns: Next Milestones & Simulator Teaser */}
        <div className="lg:col-span-2 space-y-6">
          {/* Decision-Support Simulator Callout */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-brand-900 via-brand-950 to-slate-900 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-brand-500/20 text-brand-200 border border-brand-400/30 px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-brand-300" aria-hidden="true" />
                    Decision-Support Engine
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Simulate &ldquo;What-If&rdquo; Scenarios & Consequence Analysis
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Thinking about inviting 20 more guests, shifting dates, or tweaking the budget? See real-time numeric consequences, broken constraints, and mathematically ranked trade-offs.
                </p>
              </div>

              <Link
                href={`/events/${event.id}/budget`}
                className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-sm transition whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white"
              >
                Launch Simulator <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Next Upcoming Tasks */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Upcoming Milestone Tasks</h2>
                <p className="text-xs text-slate-500">Lead-time prioritized timeline</p>
              </div>
              <Link
                href={`/events/${event.id}/timeline`}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View all ({event.tasks.length}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {nextTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">
                      {task.status === "in_progress" ? (
                        <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {task.title}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{CATEGORY_TAXONOMY[task.categoryKey]?.label || task.categoryKey}</span>
                        <span>&bull;</span>
                        <span>Due {formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 flex-shrink-0">
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
