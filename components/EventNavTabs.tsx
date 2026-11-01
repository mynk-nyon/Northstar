"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  CalendarDays,
  Store,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EventNavTabsProps {
  eventId: string;
}

export function EventNavTabs({ eventId }: EventNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Overview",
      href: `/events/${eventId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Budget & Simulator",
      href: `/events/${eventId}/budget`,
      icon: Calculator,
      exact: false,
    },
    {
      label: "Timeline & Tasks",
      href: `/events/${eventId}/timeline`,
      icon: CalendarDays,
      exact: false,
    },
    {
      label: "Vendors & Communication",
      href: `/events/${eventId}/vendors`,
      icon: Store,
      exact: false,
    },
    {
      label: "Export Plan",
      href: `/events/${eventId}/export`,
      icon: FileDown,
      exact: false,
    },
  ];

  return (
    <nav
      aria-label="Event Sections"
      className="flex space-x-1 sm:space-x-2 border-t border-slate-100 pt-3 overflow-x-auto scrollbar-none"
    >
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-500",
              isActive
                ? "bg-brand-50 text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 flex-shrink-0",
                isActive ? "text-brand-600" : "text-slate-400"
              )}
              aria-hidden="true"
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
