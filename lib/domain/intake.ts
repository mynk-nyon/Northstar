import {
  CATEGORY_KEYS,
  CATEGORY_TAXONOMY,
  CategoryKey,
  EventType,
} from "@/lib/config/constants";
import { computeBudgetSummary } from "@/lib/domain/budget";
import { generateTimelineTasks } from "@/lib/domain/timeline";
import {
  BudgetCategoryModel,
  EventModel,
  IntakeAnswers,
  IntakeQuestion,
  TaskModel,
  VendorModel,
} from "@/lib/domain/types";

/**
 * Returns the next adaptive question based on previous answers and stated priorities.
 * Guarantees between 3 and 6 total questions.
 *
 * @param answers - Cumulative user answers
 * @returns Next IntakeQuestion or null if intake is complete
 */
export function getNextAdaptiveQuestion(answers: IntakeAnswers): IntakeQuestion | null {
  // Step 1: Core event foundation
  if (!answers.eventType || !answers.guestCount || !answers.totalBudget || !answers.date) {
    return {
      id: "q_core_basics",
      stepNumber: 1,
      totalEstimatedSteps: 5,
      question: "Tell us about your celebration basics",
      helpText: "Set the foundational parameters for your event.",
      fieldKey: "core_basics",
      type: "text",
      defaultValue: {
        eventType: answers.eventType || "wedding",
        guestCount: answers.guestCount || 100,
        totalBudget: answers.totalBudget || 25000,
        date: answers.date || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        location: answers.location || "San Francisco, CA",
        title: answers.title || "My Celebration",
      },
    };
  }

  // Step 2: Priority Ranking - The assistant asks before assuming!
  if (!answers.priorities || answers.priorities.length === 0) {
    return {
      id: "q_priorities",
      stepNumber: 2,
      totalEstimatedSteps: 5,
      question: "What matters most to you? Rank your top priorities",
      helpText: "Drag or use arrow buttons to arrange categories from highest to lowest priority. Your budget will dynamically allocate more funds to the top.",
      fieldKey: "priorities",
      type: "ranking",
      options: CATEGORY_KEYS.filter((k) => k !== "contingency").map((key) => ({
        value: key,
        label: CATEGORY_TAXONOMY[key].label,
        description: CATEGORY_TAXONOMY[key].description,
      })),
      defaultValue: [
        "catering",
        "venue",
        "photography",
        "entertainment",
        "decor",
        "attire",
        "invitations",
        "favors",
      ],
    };
  }

  const topPriority: CategoryKey = answers.priorities[0] || "catering";

  // Step 3: Adaptive Deep Dive on Top Priority
  if (!answers[`priority_deep_dive_${topPriority}`]) {
    if (topPriority === "catering") {
      return {
        id: "q_catering_style",
        stepNumber: 3,
        totalEstimatedSteps: 5,
        question: "Since Catering is your #1 priority, what dining experience do you envision?",
        helpText: "Dining style drastically influences staff-to-guest ratios and equipment costs.",
        fieldKey: `priority_deep_dive_${topPriority}`,
        type: "select",
        options: [
          {
            value: "plated_multi_course",
            label: "Multi-Course Plated Dinner",
            description: "Formal table service, requires highest server staffing (~$95-$140/head).",
          },
          {
            value: "elevated_buffet",
            label: "Curated Chef Action Stations / Elevated Buffet",
            description: "Interactive stations with diverse offerings, moderate staffing (~$65-$95/head).",
          },
          {
            value: "cocktail_small_plates",
            label: "Cocktail Style / Heavy Passed Hors d'oeuvres",
            description: "Mingle-friendly, continuous bites, saves table rental space (~$55-$80/head).",
          },
          {
            value: "food_trucks_casual",
            label: "Artisanal Food Trucks / Casual Feast",
            description: "Lively, relaxed vibe with outdoor charm (~$40-$60/head).",
          },
        ],
        defaultValue: "elevated_buffet",
      };
    }

    if (topPriority === "venue") {
      return {
        id: "q_venue_style",
        stepNumber: 3,
        totalEstimatedSteps: 5,
        question: "Since Venue is your #1 priority, what setting best matches your vision?",
        helpText: "Site requirements affect weather contingency, generator rentals, and curfew limits.",
        fieldKey: `priority_deep_dive_${topPriority}`,
        type: "select",
        options: [
          {
            value: "historic_estate",
            label: "Historic Estate / Manor / Winery",
            description: "High architectural aesthetic, often has strict noise curfews (typically 10 PM).",
          },
          {
            value: "modern_loft",
            label: "Urban Loft / Industrial Gallery",
            description: "Open floor plan, BYO-catering freedom, allows late-night sound.",
          },
          {
            value: "outdoor_garden",
            label: "Botanical Garden / Coastal Lawn",
            description: "Scenic natural backdrop, requires mandatory rain tent contingency.",
          },
          {
            value: "hotel_ballroom",
            label: "Boutique Hotel / Full-Service Ballroom",
            description: "Turnkey convenience with on-site lodging, AV packages, and built-in staffing.",
          },
        ],
        defaultValue: "outdoor_garden",
      };
    }

    if (topPriority === "photography") {
      return {
        id: "q_photo_style",
        stepNumber: 3,
        totalEstimatedSteps: 5,
        question: "Since Photography & Video is your #1 priority, what coverage do you require?",
        helpText: "Second shooters and drone footage require dedicated lead-time and shot schedules.",
        fieldKey: `priority_deep_dive_${topPriority}`,
        type: "select",
        options: [
          {
            value: "documentary_editorial",
            label: "Full Day Documentary + Second Shooter + Drone Video",
            description: "10-12 hours coverage, cinematic highlight film, raw archival footage.",
          },
          {
            value: "classic_photo_only",
            label: "Classic Candid & Portrait Photography (8 Hours)",
            description: "Single lead photographer covering getting ready through first dances.",
          },
          {
            value: "hybrid_photo_video",
            label: "Photo + 3-5 Minute Cinematic Reel",
            description: "Condensed modern coverage tailored for digital storytelling.",
          },
        ],
        defaultValue: "documentary_editorial",
      };
    }

    // Default adaptive question for other priorities
    return {
      id: "q_priority_focus",
      stepNumber: 3,
      totalEstimatedSteps: 5,
      question: `Since ${CATEGORY_TAXONOMY[topPriority].label} is your top priority, what is your key objective?`,
      helpText: "We will allocate extra resources and milestone checkpoints here.",
      fieldKey: `priority_deep_dive_${topPriority}`,
      type: "select",
      options: [
        {
          value: "high_impact_statement",
          label: "Create a memorable signature centerpiece / showstopper",
          description: "Focus investment on a few jaw-dropping moments.",
        },
        {
          value: "seamless_guest_comfort",
          label: "Maximize guest comfort and seamless hospitality",
          description: "Smooth transitions, comfortable seating, and premium sound.",
        },
      ],
      defaultValue: "high_impact_statement",
    };
  }

  // Step 4: Venue Constraints and Capacity
  if (answers.venueCapacity === undefined && answers.venueBooked === undefined) {
    return {
      id: "q_venue_constraints",
      stepNumber: 4,
      totalEstimatedSteps: 5,
      question: "Do you already have a venue selected, and what is its legal capacity limit?",
      helpText: "Our trade-off engine uses capacity limits to warn before you over-invite.",
      fieldKey: "venue_constraints",
      type: "select",
      options: [
        {
          value: "booked_fixed_capacity",
          label: "Yes, venue is booked (enter known capacity)",
          description: "Strict fire code capacity applies.",
        },
        {
          value: "searching_flexible",
          label: "Still scouting venues (use 125% guest count as target)",
          description: "We'll set an estimated search ceiling.",
        },
      ],
      defaultValue: "searching_flexible",
    };
  }

  // Step 5: Contingency & Risk Cushion
  if (!answers.contingencyTolerance) {
    return {
      id: "q_contingency_tolerance",
      stepNumber: 5,
      totalEstimatedSteps: 5,
      question: "How conservative should your contingency reserve be?",
      helpText: "All events encounter unexpected fees (city permits, cake cutting fees, tip envelopes).",
      fieldKey: "contingencyTolerance",
      type: "select",
      options: [
        {
          value: "conservative_10",
          label: "Conservative: Reserve 10% for emergencies (Recommended)",
          description: "Safest posture against unexpected vendor price hikes or weather changes.",
        },
        {
          value: "balanced_7",
          label: "Balanced: Reserve 7% for unforeseen adjustments",
          description: "Balanced buffer while leaving more dollars for entertainment/decor.",
        },
        {
          value: "lean_5",
          label: "Lean: Strict 5% minimum reserve",
          description: "Maximizes immediate category spend; requires strict contract oversight.",
        },
      ],
      defaultValue: "conservative_10",
    };
  }

  // Intake is complete!
  return null;
}

/**
 * Creates the initialized Event, Categories, Tasks, and Vendor records from intake answers.
 */
export function buildEventFromIntake(answers: IntakeAnswers): {
  event: EventModel;
  categories: BudgetCategoryModel[];
  tasks: TaskModel[];
  vendors: VendorModel[];
} {
  const eventId = `event_${Date.now()}`;
  const eventType: EventType = answers.eventType || "wedding";
  const guestCount = Math.max(1, answers.guestCount || 100);
  const totalBudget = Math.max(1000, answers.totalBudget || 25000);
  const date = answers.date || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const location = answers.location || "San Francisco, CA";
  const title = answers.title || (eventType === "wedding" ? "Our Wedding Celebration" : `${eventType.toUpperCase()} Celebration`);

  // Venue capacity calculation
  let venueCapacity: number | null = null;
  if (answers.venueCapacity && answers.venueCapacity > 0) {
    venueCapacity = answers.venueCapacity;
  } else if (answers.venue_constraints === "booked_fixed_capacity") {
    venueCapacity = Math.round(guestCount * 1.1); // Default to slightly above guest count
  } else {
    venueCapacity = Math.round(guestCount * 1.25);
  }

  const priorities: CategoryKey[] =
    answers.priorities && answers.priorities.length > 0
      ? answers.priorities
      : [
          "catering",
          "venue",
          "photography",
          "entertainment",
          "decor",
          "attire",
          "invitations",
          "favors",
          "contingency",
        ];

  const event: EventModel = {
    id: eventId,
    title,
    type: eventType,
    date,
    location,
    guestCount,
    totalBudget,
    currency: answers.currency || "USD",
    venueCapacity,
    venueType: answers.venueType || "indoor",
    venueHours: answers.venueHours || 6,
    cateringRestrictions: answers.cateringRestrictions || null,
    priorities,
    notes: answers.notes || `Created via adaptive intake. Top priority: ${priorities[0]}.`,
  };

  // Build budget categories using deterministic budget engine
  const budgetSummary = computeBudgetSummary({
    eventType,
    totalBudget,
    guestCount,
    priorities,
  });

  const categories: BudgetCategoryModel[] = budgetSummary.categories.map((c) => ({
    id: `cat_${eventId}_${c.categoryKey}`,
    eventId,
    categoryKey: c.categoryKey,
    name: c.name,
    allocatedAmount: c.allocatedAmount,
    committedAmount: 0,
    isManualOverride: false,
    notes: null,
  }));

  // Build timeline tasks backwards from event date
  const tasks = generateTimelineTasks(eventId, eventType, date);

  // Build initial vendor checklist stubs
  const vendors: VendorModel[] = [
    {
      id: `vnd_${eventId}_venue`,
      eventId,
      categoryKey: "venue",
      name: "Preferred Venue Candidate",
      contact: "events@venueexample.com",
      quoteAmount: Math.round(budgetSummary.categories.find((c) => c.categoryKey === "venue")!.allocatedAmount * 0.95),
      depositAmount: 0,
      balanceDue: 0,
      contractStatus: "contacted",
      notes: "Inquire about load-in hours, sound ordinances, and catering kitchen.",
    },
    {
      id: `vnd_${eventId}_catering`,
      eventId,
      categoryKey: "catering",
      name: "Artisan Catering Co.",
      contact: "chef@cateringexample.com",
      quoteAmount: Math.round(budgetSummary.categories.find((c) => c.categoryKey === "catering")!.allocatedAmount * 0.9),
      depositAmount: 0,
      balanceDue: 0,
      contractStatus: "contacted",
      notes: "Requested menu tasting and dietary accommodation breakdown.",
    },
    {
      id: `vnd_${eventId}_photo`,
      eventId,
      categoryKey: "photography",
      name: "Fine Art Photography",
      contact: "hello@photoexample.com",
      quoteAmount: Math.round(budgetSummary.categories.find((c) => c.categoryKey === "photography")!.allocatedAmount * 0.85),
      depositAmount: 0,
      balanceDue: 0,
      contractStatus: "contacted",
      notes: "Review portfolio and delivery timeline for digital galleries.",
    },
  ];

  return { event, categories, tasks, vendors };
}
