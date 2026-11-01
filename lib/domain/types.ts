import { CategoryKey, EventType, TimelinePhase } from "@/lib/config/constants";

export interface EventModel {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO string YYYY-MM-DD
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  venueCapacity?: number | null;
  venueType: "indoor" | "outdoor" | "hybrid";
  venueHours?: number | null;
  cateringRestrictions?: string | null;
  priorities: CategoryKey[]; // Ranked list from highest to lowest
  notes?: string | null;
}

export interface BudgetCategoryModel {
  id: string;
  eventId: string;
  categoryKey: CategoryKey;
  name: string;
  allocatedAmount: number;
  committedAmount: number;
  isManualOverride: boolean;
  notes?: string | null;
}

export interface TaskModel {
  id: string;
  eventId: string;
  title: string;
  dueDate: string; // ISO string YYYY-MM-DD
  categoryKey: CategoryKey;
  status: "todo" | "in_progress" | "blocked" | "done";
  owner?: string | null;
  phase: TimelinePhase;
  dependencyLinks?: string[]; // Task titles or IDs
  notes?: string | null;
}

export interface VendorModel {
  id: string;
  eventId: string;
  categoryKey: CategoryKey;
  name: string;
  contact: string;
  quoteAmount: number;
  depositAmount: number;
  balanceDue: number;
  contractStatus:
    | "contacted"
    | "quoted"
    | "negotiating"
    | "contract_signed"
    | "deposit_paid"
    | "completed"
    | "cancelled";
  notes?: string | null;
}

/**
 * Computed budget category with financial metrics.
 */
export interface ComputedCategoryBreakdown {
  categoryKey: CategoryKey;
  name: string;
  allocatedAmount: number;
  committedAmount: number;
  remainingAmount: number;
  percentageOfBudget: number;
  isOverrun: boolean;
  overrunAmount: number;
  costPerHead: number;
  isManualOverride: boolean;
}

export interface ComputedBudgetSummary {
  totalBudget: number;
  totalAllocated: number;
  totalCommitted: number;
  totalRemaining: number;
  totalOverrun: number;
  contingencyReserve: number;
  contingencyPercentage: number;
  isContingencyDrained: boolean;
  costPerHead: number;
  categories: ComputedCategoryBreakdown[];
  hasOverruns: boolean;
}

/**
 * Capacity analysis result.
 */
export interface CapacityEvaluation {
  guestCount: number;
  venueCapacity: number | null;
  utilizationRate: number | null; // e.g. 0.85
  isBreached: boolean;
  isNearCapacity: boolean;
  excessGuests: number;
  remainingSeats: number;
  safetyMarginPercentage: number;
  warningMessage: string | null;
}

/**
 * Consequence and trade-off simulation result.
 */
export interface TradeoffAlternative {
  id: string;
  title: string;
  actionType: "cut_guests" | "reallocate_category" | "increase_budget" | "shift_date";
  costImpact: number; // numeric delta
  tradeOff: string;   // what is gained vs sacrificed
  sacrifice: string;  // explicit sacrifice statement
  feasibilityScore: number; // 1-100
  recommendedAction: string;
}

export interface SimulationConsequenceReport {
  originalGuestCount: number;
  newGuestCount: number;
  guestDelta: number;

  originalBudget: number;
  newBudget: number;
  budgetDelta: number;

  originalCateringCostPerHead: number;
  newCateringCostPerHead: number;
  cateringTotalDelta: number;

  affectedCategories: {
    categoryKey: CategoryKey;
    name: string;
    oldAllocated: number;
    newAllocated: number;
    delta: number;
    reason: string;
  }[];

  capacityBreach: {
    occurred: boolean;
    excessGuests: number;
    venueCapacity: number | null;
    message: string | null;
  };

  contingencyStatus: {
    originalAmount: number;
    newAmount: number;
    delta: number;
    newPercentage: number;
    isDrainedBelowReserve: boolean;
    message: string | null;
  };

  alternatives: TradeoffAlternative[];
}

/**
 * Adaptive intake interview types.
 */
export interface IntakeQuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface IntakeQuestion {
  id: string;
  stepNumber: number;
  totalEstimatedSteps: number;
  question: string;
  helpText?: string;
  fieldKey: string;
  type: "select" | "multi_select" | "number" | "text" | "ranking";
  options?: IntakeQuestionOption[];
  defaultValue?: unknown;
}

export interface IntakeAnswers {
  title?: string;
  eventType?: EventType;
  date?: string;
  location?: string;
  guestCount?: number;
  totalBudget?: number;
  priorities?: CategoryKey[];
  mealStyle?: string;
  venueSetting?: string;
  venueBooked?: "yes" | "no";
  venueCapacity?: number;
  curfewHours?: number;
  musicVibe?: string;
  decorStyle?: string;
  dateFlexibility?: "fixed" | "flexible_month" | "flexible_season";
  currency?: string;
  venueType?: "indoor" | "outdoor" | "hybrid";
  venueHours?: number;
  cateringRestrictions?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}
