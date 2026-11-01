import React from "react";
import { notFound } from "next/navigation";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { calculateDaysRemaining } from "@/lib/domain/timeline";
import { evaluateCapacity } from "@/lib/domain/capacity";
import { EventNavTabs } from "@/components/EventNavTabs";
import {
  Calendar,
  Users,
  Wallet,
  Building,
  Clock,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await eventRepository.findById(id);

  if (!event) {
    notFound();
  }

  const daysRemaining = calculateDaysRemaining(event.date);
  const capacityEval = evaluateCapacity(event.guestCount, event.venueCapacity);
  const costPerHead = Math.round((event.totalBudget / event.guestCount) * 100) / 100;

  return (
    <div className="flex-1 flex flex-col">
      {/* Event Header Banner */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-4 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {event.type}
                </span>
                {daysRemaining >= 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {daysRemaining} Days to Go
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Completed
                  </span>
                )}
                {capacityEval.isBreached && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                    Capacity Breached (+{capacityEval.excessGuests})
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {event.title}
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>{event.location}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatDate(event.date)}
                </span>
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200/80">
              <div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Total Budget
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {formatCurrency(event.totalBudget, event.currency)}
                </div>
                <div className="text-[11px] text-slate-500">
                  ~{formatCurrency(costPerHead, event.currency)}/head
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Guest Count
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {event.guestCount}
                </div>
                <div className="text-[11px] text-slate-500">
                  {event.venueCapacity ? `Limit: ${event.venueCapacity}` : "No venue limit"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Venue Space
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 capitalize mt-0.5">
                  {event.venueType}
                </div>
                <div className="text-[11px] text-slate-500">
                  {event.venueHours ? `${event.venueHours} hrs rental` : "Standard"}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <EventNavTabs eventId={event.id} />
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
