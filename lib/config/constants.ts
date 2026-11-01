/**
 * Centralized taxonomy and domain constants for Celebration & Event Planner.
 */

export const EVENT_TYPES = ["wedding", "birthday", "community"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const CATEGORY_KEYS = [
  "venue",
  "catering",
  "photography",
  "entertainment",
  "decor",
  "attire",
  "invitations",
  "favors",
  "contingency",
] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface CategoryMetadata {
  key: CategoryKey;
  label: string;
  description: string;
  icon: string;
  defaultLeadTimeMonths: number;
  isHeadcountSensitive: boolean; // Does cost scale directly with guest count?
}

export const CATEGORY_TAXONOMY: Record<CategoryKey, CategoryMetadata> = {
  venue: {
    key: "venue",
    label: "Venue & Site",
    description: "Rental fees, security deposit, site insurance, and facility access.",
    icon: "Building2",
    defaultLeadTimeMonths: 10,
    isHeadcountSensitive: false,
  },
  catering: {
    key: "catering",
    label: "Catering & Bar",
    description: "Food, alcoholic and non-alcoholic beverages, staffing, and service fees.",
    icon: "Utensils",
    defaultLeadTimeMonths: 6,
    isHeadcountSensitive: true,
  },
  photography: {
    key: "photography",
    label: "Photography & Video",
    description: "Photo shoots, video coverage, albums, and digital archives.",
    icon: "Camera",
    defaultLeadTimeMonths: 6,
    isHeadcountSensitive: false,
  },
  entertainment: {
    key: "entertainment",
    label: "Music & Entertainment",
    description: "Live band, DJ, MC, audio-visual gear, and dance floor lighting.",
    icon: "Music",
    defaultLeadTimeMonths: 5,
    isHeadcountSensitive: false,
  },
  decor: {
    key: "decor",
    label: "Floral & Decor",
    description: "Floral centerpieces, ceremony arch, linens, lighting, and rentals.",
    icon: "Sparkles",
    defaultLeadTimeMonths: 4,
    isHeadcountSensitive: true, // Scales partially with table count / guests
  },
  attire: {
    key: "attire",
    label: "Attire & Beauty",
    description: "Outfits, tailoring, hair, makeup, and accessories.",
    icon: "Shirt",
    defaultLeadTimeMonths: 6,
    isHeadcountSensitive: false,
  },
  invitations: {
    key: "invitations",
    label: "Stationery & Invitations",
    description: "Save-the-dates, invitations, postage, day-of signage, and place cards.",
    icon: "Mail",
    defaultLeadTimeMonths: 3,
    isHeadcountSensitive: true,
  },
  favors: {
    key: "favors",
    label: "Favors & Gifts",
    description: "Guest party favors, welcome bags, and wedding party appreciation gifts.",
    icon: "Gift",
    defaultLeadTimeMonths: 2,
    isHeadcountSensitive: true,
  },
  contingency: {
    key: "contingency",
    label: "Contingency Reserve",
    description: "Emergency reserve fund for unexpected fees, rate increases, or last-minute additions.",
    icon: "ShieldAlert",
    defaultLeadTimeMonths: 1,
    isHeadcountSensitive: false,
  },
};

/**
 * Baseline budget percentage distribution by event type.
 * All sums equal 1.0 (100%).
 */
export const BASELINE_ALLOCATIONS: Record<EventType, Record<CategoryKey, number>> = {
  wedding: {
    venue: 0.22,
    catering: 0.35,
    photography: 0.12,
    entertainment: 0.08,
    decor: 0.08,
    attire: 0.05,
    invitations: 0.02,
    favors: 0.01,
    contingency: 0.07, // Minimum 7% contingency reserve
  },
  birthday: {
    venue: 0.20,
    catering: 0.38,
    photography: 0.08,
    entertainment: 0.14,
    decor: 0.10,
    attire: 0.02,
    invitations: 0.02,
    favors: 0.01,
    contingency: 0.05, // Minimum 5% contingency reserve
  },
  community: {
    venue: 0.25,
    catering: 0.30,
    photography: 0.05,
    entertainment: 0.18,
    decor: 0.07,
    attire: 0.01,
    invitations: 0.04,
    favors: 0.02,
    contingency: 0.08, // Minimum 8% contingency reserve
  },
};

/**
 * Minimum contingency percentage that must never be eroded.
 */
export const MINIMUM_CONTINGENCY_PERCENTAGE = 0.05; // 5% absolute minimum

/**
 * Venue capacity safety buffer thresholds.
 */
export const CAPACITY_WARNING_THRESHOLD = 0.90; // Warn when 90% full
export const CAPACITY_BREACH_THRESHOLD = 1.00;  // Breach when > 100%

/**
 * Timeline phases based on months/days before event date.
 */
export const TIMELINE_PHASES = [
  "twelve_months",
  "six_months",
  "three_months",
  "one_month",
  "week_of",
  "day_of",
] as const;
export type TimelinePhase = (typeof TIMELINE_PHASES)[number];

export const PHASE_LABELS: Record<TimelinePhase, string> = {
  twelve_months: "12+ Months Before",
  six_months: "6–11 Months Before",
  three_months: "3–5 Months Before",
  one_month: "1–2 Months Before",
  week_of: "Week Of Event",
  day_of: "Day Of Event",
};
