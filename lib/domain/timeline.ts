import {
  CategoryKey,
  EventType,
  PHASE_LABELS,
  TIMELINE_PHASES,
  TimelinePhase,
} from "@/lib/config/constants";
import { TaskModel } from "@/lib/domain/types";

export interface TimelineTaskTemplate {
  title: string;
  categoryKey: CategoryKey;
  phase: TimelinePhase;
  daysBeforeEvent: number; // Positive integer representing days before event
  defaultOwner?: string;
  notes?: string;
}

/**
 * Standard task milestone templates with vendor lead-time awareness.
 */
export const TASK_TEMPLATES: Record<EventType, TimelineTaskTemplate[]> = {
  wedding: [
    {
      title: "Establish wedding budget and core vision",
      categoryKey: "contingency",
      phase: "twelve_months",
      daysBeforeEvent: 365,
      defaultOwner: "Couple",
      notes: "Lock overall spending ceiling and agree on non-negotiable priorities.",
    },
    {
      title: "Tour and book ceremony & reception venue",
      categoryKey: "venue",
      phase: "twelve_months",
      daysBeforeEvent: 330,
      defaultOwner: "Couple",
      notes: "Review venue capacity, catering restrictions, and noise curfews.",
    },
    {
      title: "Hire photographer & videographer",
      categoryKey: "photography",
      phase: "six_months",
      daysBeforeEvent: 240,
      defaultOwner: "Couple",
      notes: "Secure preferred photographer before peak wedding season fills up.",
    },
    {
      title: "Select caterer and schedule menu tasting",
      categoryKey: "catering",
      phase: "six_months",
      daysBeforeEvent: 210,
      defaultOwner: "Couple",
      notes: "Sample plated vs buffet options and specify dietary accommodations.",
    },
    {
      title: "Book entertainment / live band or DJ",
      categoryKey: "entertainment",
      phase: "six_months",
      daysBeforeEvent: 180,
      defaultOwner: "Couple",
      notes: "Verify electrical output requirements with the venue coordinator.",
    },
    {
      title: "Order wedding attire and schedule first fitting",
      categoryKey: "attire",
      phase: "six_months",
      daysBeforeEvent: 180,
      defaultOwner: "Couple",
      notes: "Allow 4-6 months for alterations and tailored garment delivery.",
    },
    {
      title: "Mail Save-the-Dates to guests",
      categoryKey: "invitations",
      phase: "six_months",
      daysBeforeEvent: 180,
      defaultOwner: "Couple",
      notes: "Provide hotel block information for out-of-town guests.",
    },
    {
      title: "Design and book floral & event decor",
      categoryKey: "decor",
      phase: "three_months",
      daysBeforeEvent: 120,
      defaultOwner: "Couple",
      notes: "Finalize ceremony arch, centerpieces, and candle restrictions.",
    },
    {
      title: "Mail formal wedding invitations",
      categoryKey: "invitations",
      phase: "three_months",
      daysBeforeEvent: 75,
      defaultOwner: "Couple",
      notes: "Include RSVP deadline 30 days before event date.",
    },
    {
      title: "RSVP Deadline: Compile final guest count",
      categoryKey: "catering",
      phase: "one_month",
      daysBeforeEvent: 30,
      defaultOwner: "Couple",
      notes: "Track outstanding replies and calculate final per-head totals.",
    },
    {
      title: "Final venue walk-through and layout diagram",
      categoryKey: "venue",
      phase: "one_month",
      daysBeforeEvent: 21,
      defaultOwner: "Coordinator",
      notes: "Verify table counts, power outlets, load-in timing, and rain plan.",
    },
    {
      title: "Submit final headcount and dietary list to caterer",
      categoryKey: "catering",
      phase: "one_month",
      daysBeforeEvent: 14,
      defaultOwner: "Couple",
      notes: "Lock down exact meal choices, vendor meals, and bar quantities.",
    },
    {
      title: "Confirm timeline and arrival times with all vendors",
      categoryKey: "entertainment",
      phase: "week_of",
      daysBeforeEvent: 5,
      defaultOwner: "Coordinator",
      notes: "Distribute master run-of-show to DJ, photographer, caterer, and florist.",
    },
    {
      title: "Assemble place cards, seating chart, and favor bags",
      categoryKey: "favors",
      phase: "week_of",
      daysBeforeEvent: 3,
      defaultOwner: "Wedding Party",
      notes: "Pack signage and decor boxes organized by reception area.",
    },
    {
      title: "Distribute vendor tips, balances, and coordinate load-in",
      categoryKey: "venue",
      phase: "day_of",
      daysBeforeEvent: 0,
      defaultOwner: "Coordinator",
      notes: "Execute master day-of schedule and oversee tear-down.",
    },
  ],
  birthday: [
    {
      title: "Set milestone birthday theme and budget",
      categoryKey: "contingency",
      phase: "three_months",
      daysBeforeEvent: 90,
      defaultOwner: "Host",
      notes: "Determine guest count target and overall entertainment budget.",
    },
    {
      title: "Secure venue or reserve private dining room",
      categoryKey: "venue",
      phase: "three_months",
      daysBeforeEvent: 75,
      defaultOwner: "Host",
      notes: "Confirm food/drink minimums and sound restrictions.",
    },
    {
      title: "Send digital or printed invitations",
      categoryKey: "invitations",
      phase: "one_month",
      daysBeforeEvent: 45,
      defaultOwner: "Host",
      notes: "Request RSVPs 2 weeks prior.",
    },
    {
      title: "Book entertainment (DJ, photobooth, performer)",
      categoryKey: "entertainment",
      phase: "one_month",
      daysBeforeEvent: 30,
      defaultOwner: "Host",
      notes: "Create curated music playlist and special announcements.",
    },
    {
      title: "Finalize menu and custom birthday cake order",
      categoryKey: "catering",
      phase: "one_month",
      daysBeforeEvent: 20,
      defaultOwner: "Host",
      notes: "Coordinate cake delivery and dessert presentation timing.",
    },
    {
      title: "Confirm headcount and purchase decor & balloons",
      categoryKey: "decor",
      phase: "week_of",
      daysBeforeEvent: 7,
      defaultOwner: "Host",
      notes: "Assemble photo backdrops and party accessories.",
    },
    {
      title: "Event setup, music sound check, and guest welcome",
      categoryKey: "venue",
      phase: "day_of",
      daysBeforeEvent: 0,
      defaultOwner: "Host",
      notes: "Enjoy the celebration!",
    },
  ],
  community: [
    {
      title: "Define event scope, budget, and permit requirements",
      categoryKey: "contingency",
      phase: "six_months",
      daysBeforeEvent: 180,
      defaultOwner: "Committee",
      notes: "File municipal park or street closure permits.",
    },
    {
      title: "Reserve venue or public park space",
      categoryKey: "venue",
      phase: "six_months",
      daysBeforeEvent: 150,
      defaultOwner: "Committee",
      notes: "Confirm insurance liability requirements and capacity allowances.",
    },
    {
      title: "Recruit food trucks or caterers and sponsors",
      categoryKey: "catering",
      phase: "three_months",
      daysBeforeEvent: 90,
      defaultOwner: "Committee",
      notes: "Review health department permits and trash removal logistics.",
    },
    {
      title: "Book stages, sound systems, and community performers",
      categoryKey: "entertainment",
      phase: "three_months",
      daysBeforeEvent: 60,
      defaultOwner: "Committee",
      notes: "Schedule sound engineer and power generators.",
    },
    {
      title: "Launch community marketing, flyers, and press release",
      categoryKey: "invitations",
      phase: "one_month",
      daysBeforeEvent: 45,
      defaultOwner: "Marketing",
      notes: "Distribute event posters and post to local community groups.",
    },
    {
      title: "Recruit and assign volunteer shifts",
      categoryKey: "venue",
      phase: "one_month",
      daysBeforeEvent: 21,
      defaultOwner: "Volunteer Lead",
      notes: "Prepare briefing packets for check-in, wayfinding, and clean-up.",
    },
    {
      title: "Final safety walkthrough and staging setup",
      categoryKey: "venue",
      phase: "week_of",
      daysBeforeEvent: 3,
      defaultOwner: "Committee",
      notes: "Inspect first aid stations, signage, and waste receptacles.",
    },
    {
      title: "Day-of execution: staging, booth check-in, and teardown",
      categoryKey: "venue",
      phase: "day_of",
      daysBeforeEvent: 0,
      defaultOwner: "Committee",
      notes: "Oversee event schedule and ensure public grounds are left pristine.",
    },
  ],
};

/**
 * Computes calendar due date by subtracting days from event date in UTC.
 * Using UTC avoids Daylight Saving Time and local timezone offsets.
 * Properly accounts for leap years (e.g. Feb 29).
 *
 * @param eventDate - ISO string YYYY-MM-DD or Date
 * @param daysBeforeEvent - Number of days prior to event
 * @returns ISO string YYYY-MM-DD
 */
export function calculateDueDate(
  eventDate: string | Date,
  daysBeforeEvent: number
): string {
  const d = typeof eventDate === "string" ? new Date(eventDate) : new Date(eventDate);
  // Parse year, month, date explicitly in UTC
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const date = d.getUTCDate();

  const utcEventDate = new Date(Date.UTC(year, month, date));
  utcEventDate.setUTCDate(utcEventDate.getUTCDate() - daysBeforeEvent);

  return utcEventDate.toISOString().slice(0, 10);
}

/**
 * Computes the number of days remaining until a task's due date.
 * Negative number means the task is overdue.
 *
 * @param dueDate - Task due date in YYYY-MM-DD
 * @param referenceDate - Reference date (defaults to current UTC date)
 * @returns Number of days (positive = in future, 0 = today, negative = overdue)
 */
export function calculateDaysRemaining(
  dueDate: string,
  referenceDate: Date = new Date()
): number {
  const target = new Date(dueDate);
  const targetUtc = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate()
  );

  const refUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - refUtc) / msPerDay);
}

/**
 * Generates the full initial timeline tasks for an event working backwards from its date.
 *
 * @param eventId - Target event ID
 * @param eventType - Event type ('wedding' | 'birthday' | 'community')
 * @param eventDate - Event date string YYYY-MM-DD
 * @returns Array of TaskModel objects with countdown-derived due dates
 */
export function generateTimelineTasks(
  eventId: string,
  eventType: EventType,
  eventDate: string
): TaskModel[] {
  const templates = TASK_TEMPLATES[eventType] || TASK_TEMPLATES.wedding;

  return templates.map((template, index) => {
    const dueDate = calculateDueDate(eventDate, template.daysBeforeEvent);
    return {
      id: `task_${index + 1}_${Date.now()}`,
      eventId,
      title: template.title,
      dueDate,
      categoryKey: template.categoryKey,
      status: "todo",
      owner: template.defaultOwner || null,
      phase: template.phase,
      dependencyLinks: index > 0 ? [templates[index - 1].title] : [],
      notes: template.notes || null,
    };
  });
}

/**
 * Groups an array of tasks by timeline phase with overdue calculations.
 *
 * @param tasks - Array of tasks
 * @param referenceDate - Optional reference date for overdue calculations
 * @returns Grouped tasks by phase
 */
export function groupTasksByPhase(
  tasks: TaskModel[],
  referenceDate: Date = new Date()
): Record<
  TimelinePhase,
  {
    phaseKey: TimelinePhase;
    label: string;
    tasks: (TaskModel & { daysRemaining: number; isOverdue: boolean })[];
  }
> {
  type GroupedPhase = {
    phaseKey: TimelinePhase;
    label: string;
    tasks: (TaskModel & { daysRemaining: number; isOverdue: boolean })[];
  };
  const grouped = {} as Record<TimelinePhase, GroupedPhase>;

  for (const phase of TIMELINE_PHASES) {
    grouped[phase] = {
      phaseKey: phase,
      label: PHASE_LABELS[phase],
      tasks: [],
    };
  }

  for (const task of tasks) {
    const daysRemaining = calculateDaysRemaining(task.dueDate, referenceDate);
    const isOverdue = daysRemaining < 0 && task.status !== "done";

    if (grouped[task.phase]) {
      grouped[task.phase].tasks.push({
        ...task,
        daysRemaining,
        isOverdue,
      });
    }
  }

  // Sort tasks within each phase by due date ascending
  for (const phase of TIMELINE_PHASES) {
    grouped[phase].tasks.sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    );
  }

  return grouped;
}
