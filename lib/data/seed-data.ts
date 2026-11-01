import {
  BudgetCategoryModel,
  EventModel,
  TaskModel,
  VendorModel,
} from "@/lib/domain/types";
import { CategoryKey } from "@/lib/config/constants";
import { computeBudgetSummary } from "@/lib/domain/budget";
import { generateTimelineTasks } from "@/lib/domain/timeline";

export const DEMO_EVENT_ID = "demo_wedding_event_01";

export function getDemoEventData(): {
  event: EventModel;
  categories: BudgetCategoryModel[];
  tasks: TaskModel[];
  vendors: VendorModel[];
} {
  const eventDate = "2027-05-15";
  const guestCount = 120;
  const totalBudget = 38000;
  const priorities: CategoryKey[] = [
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
    id: DEMO_EVENT_ID,
    title: "Maya & Lucas: Modern Coastal Wedding",
    type: "wedding",
    date: eventDate,
    location: "Monterey Bay, CA",
    guestCount,
    totalBudget,
    currency: "USD",
    venueCapacity: 135, // Allows testing +20 guests what-if scenario (120 -> 140 breaches 135!)
    venueType: "hybrid",
    venueHours: 7,
    cateringRestrictions: "Locally sourced seafood, vegan entrée options, corkage permit",
    priorities,
    notes: "Signature sunset ceremony overlooking the ocean, followed by open-air tented dinner and live music.",
  };

  const budgetSummary = computeBudgetSummary({
    eventType: "wedding",
    totalBudget,
    guestCount,
    priorities,
  });

  const categories: BudgetCategoryModel[] = budgetSummary.categories.map((c) => {
    let committed = 0;
    if (c.categoryKey === "venue") committed = 7800;
    if (c.categoryKey === "catering") committed = 12500;
    if (c.categoryKey === "photography") committed = 4200;
    if (c.categoryKey === "entertainment") committed = 2600;

    return {
      id: `cat_${DEMO_EVENT_ID}_${c.categoryKey}`,
      eventId: DEMO_EVENT_ID,
      categoryKey: c.categoryKey,
      name: c.name,
      allocatedAmount: c.allocatedAmount,
      committedAmount: committed,
      isManualOverride: false,
      notes: null,
    };
  });

  const baseTasks = generateTimelineTasks(DEMO_EVENT_ID, "wedding", eventDate);
  // Mark early tasks done/in-progress for realism
  const tasks: TaskModel[] = baseTasks.map((t, idx) => {
    if (idx < 2) return { ...t, status: "done" };
    if (idx === 2 || idx === 3) return { ...t, status: "in_progress" };
    return t;
  });

  const vendors: VendorModel[] = [
    {
      id: `vnd_${DEMO_EVENT_ID}_venue`,
      eventId: DEMO_EVENT_ID,
      categoryKey: "venue",
      name: "Pacific Cliffside Sanctuary",
      contact: "events@pacificcliffside.com",
      quoteAmount: 7800,
      depositAmount: 3000,
      balanceDue: 4800,
      contractStatus: "contract_signed",
      notes: "Tented terrace included. Sound curfew 10:00 PM. Load-in starts at 11:00 AM.",
    },
    {
      id: `vnd_${DEMO_EVENT_ID}_catering`,
      eventId: DEMO_EVENT_ID,
      categoryKey: "catering",
      name: "Heirloom Harvest Catering",
      contact: "chef@heirloomharvest.com",
      quoteAmount: 12500,
      depositAmount: 4000,
      balanceDue: 8500,
      contractStatus: "contract_signed",
      notes: "Passed coastal appetizers + 3-course plated dinner. Final headcount due 14 days prior.",
    },
    {
      id: `vnd_${DEMO_EVENT_ID}_photography`,
      eventId: DEMO_EVENT_ID,
      categoryKey: "photography",
      name: "Solstice Visuals (Elena Vance)",
      contact: "elena@solsticevisuals.com",
      quoteAmount: 4200,
      depositAmount: 1500,
      balanceDue: 2700,
      contractStatus: "contract_signed",
      notes: "9 hours of coverage, second shooter included, drone aerials permitted by venue.",
    },
    {
      id: `vnd_${DEMO_EVENT_ID}_entertainment`,
      eventId: DEMO_EVENT_ID,
      categoryKey: "entertainment",
      name: "The Coastline Quartet & DJ Wave",
      contact: "booking@coastlinemusic.com",
      quoteAmount: 2600,
      depositAmount: 800,
      balanceDue: 1800,
      contractStatus: "deposit_paid",
      notes: "Acoustic strings for ceremony & cocktail hour; DJ and lighting for evening reception.",
    },
    {
      id: `vnd_${DEMO_EVENT_ID}_decor`,
      eventId: DEMO_EVENT_ID,
      categoryKey: "decor",
      name: "Bloom & Branch Botanicals",
      contact: "hello@bloombranch.com",
      quoteAmount: 2800,
      depositAmount: 0,
      balanceDue: 2800,
      contractStatus: "negotiating",
      notes: "Evaluating proposal for driftwood ceremony arch and low floral compotes.",
    },
  ];

  return { event, categories, tasks, vendors };
}
