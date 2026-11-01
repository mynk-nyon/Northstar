import React from "react";
import Link from "next/link";
import { CalendarHeart, PlusCircle } from "lucide-react";

export function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-slate-900 text-lg hover:text-brand-700 transition focus-visible:ring-2 focus-visible:ring-brand-500 rounded px-1"
              aria-label="Celebration & Event Planner Home"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm">
                <CalendarHeart className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="tracking-tight text-slate-950 font-extrabold">Northstar</span>
                <span className="text-brand-600 ml-1.5 font-semibold text-xs tracking-wide uppercase px-2 py-0.5 bg-brand-50 rounded-full border border-brand-200">
                  GenAI Planner
                </span>
              </div>
            </Link>
          </div>

          <nav aria-label="Main Navigation" className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition focus-visible:ring-2"
            >
              Active Plan
            </Link>
            <Link
              href="/events/new"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3.5 py-2 rounded-lg shadow-sm hover:shadow transition focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>New Intake</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
