import {
  CATEGORY_KEYS,
  CATEGORY_TAXONOMY,
  CategoryKey,
  EventType,
  MINIMUM_CONTINGENCY_PERCENTAGE,
} from "@/lib/config/constants";
import { computeBudgetSummary } from "@/lib/domain/budget";
import { evaluateCapacity } from "@/lib/domain/capacity";
import {
  SimulationConsequenceReport,
  TradeoffAlternative,
} from "@/lib/domain/types";

export interface SimulationParams {
  eventType: EventType;
  originalGuestCount: number;
  simulatedGuestCount: number;
  originalBudget: number;
  simulatedBudget: number;
  venueCapacity?: number | null;
  originalPriorities?: CategoryKey[];
  simulatedPriorities?: CategoryKey[];
  manualOverrides?: Partial<Record<CategoryKey, number>>;
  committedAmounts?: Partial<Record<CategoryKey, number>>;
  dateShiftDays?: number;
}

/**
 * Runs the deterministic decision-support trade-off simulation.
 * Computes exact numeric deltas for headcounts, budgets, catering scaling, and category absorptions.
 * Identifies capacity breaches or contingency depletion.
 * Synthesizes 2 to 3 mathematically backed, feasible alternatives with explicit sacrifice statements.
 *
 * @param params - Original vs simulated event parameters
 * @returns SimulationConsequenceReport with numbers, broken constraints, and ranked trade-offs
 */
export function simulateWhatIf(params: SimulationParams): SimulationConsequenceReport {
  const {
    eventType,
    originalGuestCount,
    simulatedGuestCount,
    originalBudget,
    simulatedBudget,
    venueCapacity,
    originalPriorities = [],
    simulatedPriorities = originalPriorities,
    manualOverrides = {},
    committedAmounts = {},
  } = params;

  // 1. Compute original and simulated budget structures
  const originalSummary = computeBudgetSummary({
    eventType,
    totalBudget: originalBudget,
    guestCount: originalGuestCount,
    priorities: originalPriorities,
    manualOverrides,
    committedAmounts,
  });

  const simulatedSummary = computeBudgetSummary({
    eventType,
    totalBudget: simulatedBudget,
    guestCount: simulatedGuestCount,
    priorities: simulatedPriorities,
    manualOverrides,
    committedAmounts,
  });

  // 2. Headcount & Catering Deltas
  const guestDelta = simulatedGuestCount - originalGuestCount;
  const budgetDelta = Math.round((simulatedBudget - originalBudget) * 100) / 100;

  const originalCatering = originalSummary.categories.find(
    (c) => c.categoryKey === "catering"
  )!;
  const simulatedCatering = simulatedSummary.categories.find(
    (c) => c.categoryKey === "catering"
  )!;

  const originalCateringCostPerHead = originalCatering.costPerHead;
  const newCateringCostPerHead = simulatedCatering.costPerHead;

  // Catering delta from pure guest expansion at original unit cost
  const directCateringHeadcountDelta =
    Math.round(guestDelta * originalCateringCostPerHead * 100) / 100;

  // Actual catering allocation change in the new budget
  const cateringTotalDelta =
    Math.round((simulatedCatering.allocatedAmount - originalCatering.allocatedAmount) * 100) / 100;

  // 3. Category absorption analysis
  const affectedCategories = CATEGORY_KEYS.map((key) => {
    const origCat = originalSummary.categories.find((c) => c.categoryKey === key)!;
    const simCat = simulatedSummary.categories.find((c) => c.categoryKey === key)!;
    const delta = Math.round((simCat.allocatedAmount - origCat.allocatedAmount) * 100) / 100;

    let reason = "Unchanged";
    if (delta > 0) {
      reason =
        budgetDelta > 0
          ? `Budget increased; received ${delta >= 0 ? "+" : ""}$${delta}`
          : `Re-prioritized upward; allocated +$${delta}`;
    } else if (delta < 0) {
      reason =
        simCat.isOverrun
          ? `Absorbed $${Math.abs(delta)} cut, causing overrun of $${simCat.overrunAmount}`
          : `Absorbed budget reduction of -$${Math.abs(delta)}`;
    }

    return {
      categoryKey: key,
      name: CATEGORY_TAXONOMY[key].label,
      oldAllocated: origCat.allocatedAmount,
      newAllocated: simCat.allocatedAmount,
      delta,
      reason,
    };
  }).filter((c) => Math.abs(c.delta) > 0.01);

  // 4. Capacity Breach Evaluation
  const capacityEval = evaluateCapacity(simulatedGuestCount, venueCapacity);
  const capacityBreach = {
    occurred: capacityEval.isBreached,
    excessGuests: capacityEval.excessGuests,
    venueCapacity: capacityEval.venueCapacity,
    message: capacityEval.warningMessage,
  };

  // 5. Contingency Drain Evaluation
  const origContingency = originalSummary.contingencyReserve;
  const simContingency = simulatedSummary.contingencyReserve;
  const contingencyDelta = Math.round((simContingency - origContingency) * 100) / 100;
  const minRequiredContingency = simulatedBudget * MINIMUM_CONTINGENCY_PERCENTAGE;
  const isDrainedBelowReserve = simContingency < minRequiredContingency;

  let contingencyMessage: string | null = null;
  if (isDrainedBelowReserve) {
    contingencyMessage = `CRITICAL: Contingency reserve ($${simContingency.toFixed(
      2
    )}) is below the required 5% floor ($${minRequiredContingency.toFixed(
      2
    )}). A single unexpected vendor fee will cause a budget deficit.`;
  } else if (contingencyDelta < 0) {
    contingencyMessage = `Contingency decreased by $${Math.abs(contingencyDelta).toFixed(
      2
    )} to absorb priority reallocations. Current reserve: $${simContingency.toFixed(
      2
    )} (${simulatedSummary.contingencyPercentage}% of budget).`;
  }

  const contingencyStatus = {
    originalAmount: origContingency,
    newAmount: simContingency,
    delta: contingencyDelta,
    newPercentage: simulatedSummary.contingencyPercentage,
    isDrainedBelowReserve,
    message: contingencyMessage,
  };

  // 6. Generate 2-3 Ranked Feasible Alternatives
  const alternatives: TradeoffAlternative[] = [];

  // Scenario A: Capacity Breached -> Alternative to reduce guest count to legal limit
  if (capacityEval.isBreached && capacityEval.excessGuests > 0) {
    const cutCount = capacityEval.excessGuests;
    const dollarsSaved = Math.round(cutCount * originalCateringCostPerHead * 100) / 100;

    alternatives.push({
      id: "alt_cap_cut_guests",
      title: `Cap Guest List at Venue Limit (${capacityEval.venueCapacity} Guests)`,
      actionType: "cut_guests",
      costImpact: -dollarsSaved,
      tradeOff: `Eliminates legal capacity violation and saves $${dollarsSaved.toFixed(
        2
      )} in food & beverage costs.`,
      sacrifice: `Must trim ${cutCount} guest(s) from invitation list (e.g. tier-2 plus-ones or distant colleagues).`,
      feasibilityScore: 95,
      recommendedAction: `Set guest count to ${capacityEval.venueCapacity}. Reclaim $${dollarsSaved.toFixed(
        2
      )} for contingency reserve.`,
    });
  }

  // Scenario B: Budget Deficit / Guest Count Expansion
  if (guestDelta > 0) {
    const costOfNewGuests = Math.round(guestDelta * originalCateringCostPerHead * 100) / 100;

    // Alternative 1: Absorb via Decor & Favors
    const decorCat = simulatedSummary.categories.find((c) => c.categoryKey === "decor")!;
    const favorsCat = simulatedSummary.categories.find((c) => c.categoryKey === "favors")!;
    const availableFromStyling = Math.round((decorCat.allocatedAmount * 0.4 + favorsCat.allocatedAmount * 0.8) * 100) / 100;

    if (availableFromStyling > 0) {
      alternatives.push({
        id: "alt_reallocate_styling",
        title: "Reallocate from Decor and Favors to Food",
        actionType: "reallocate_category",
        costImpact: 0,
        tradeOff: `Keep all ${simulatedGuestCount} guests without increasing total budget by shifting $${Math.min(
          costOfNewGuests,
          availableFromStyling
        ).toFixed(2)} from decor/favors to catering.`,
        sacrifice: `Simplify floral arrangements to greenery and eliminate custom physical favors.`,
        feasibilityScore: 88,
        recommendedAction: `Reduce Decor by $${(
          Math.min(costOfNewGuests, availableFromStyling) * 0.7
        ).toFixed(2)} and Favors by $${(
          Math.min(costOfNewGuests, availableFromStyling) * 0.3
        ).toFixed(2)}.`,
      });
    }

    // Alternative 2: Trim guests back to avoid deficit
    const trimGuestsTarget = Math.min(guestDelta, Math.max(1, Math.ceil(costOfNewGuests / originalCateringCostPerHead)));
    alternatives.push({
      id: "alt_trim_partial_guests",
      title: `Moderate Headcount: Reduce by ${trimGuestsTarget} Guests`,
      actionType: "cut_guests",
      costImpact: -Math.round(trimGuestsTarget * originalCateringCostPerHead * 100) / 100,
      tradeOff: `Maintains existing decor and entertainment standards without requiring a budget injection.`,
      sacrifice: `Reduces guest list by ${trimGuestsTarget} attendees.`,
      feasibilityScore: 82,
      recommendedAction: `Set headcount to ${simulatedGuestCount - trimGuestsTarget}.`,
    });
  }

  // Scenario C: Budget Reduced or Overruns Exist
  if (budgetDelta < 0 || simulatedSummary.hasOverruns) {
    const deficitAmount = simulatedSummary.totalOverrun > 0
      ? simulatedSummary.totalOverrun
      : Math.abs(budgetDelta);

    const neededGuestCuts = Math.max(1, Math.ceil(deficitAmount / originalCateringCostPerHead));

    alternatives.push({
      id: "alt_budget_offset_guests",
      title: `Offset Budget Cut by Trimming ${neededGuestCuts} Guests`,
      actionType: "cut_guests",
      costImpact: -Math.round(neededGuestCuts * originalCateringCostPerHead * 100) / 100,
      tradeOff: `Absorbs the $${deficitAmount.toFixed(
        2
      )} budget reduction without compromising venue or photography quality.`,
      sacrifice: `Limits guest invitations to close friends and family only.`,
      feasibilityScore: 80,
      recommendedAction: `Reduce headcount to ${Math.max(
        1,
        simulatedGuestCount - neededGuestCuts
      )} to recover $${(neededGuestCuts * originalCateringCostPerHead).toFixed(2)}.`,
    });

    alternatives.push({
      id: "alt_protect_contingency",
      title: "Consolidate Entertainment & Simplify Bar Package",
      actionType: "reallocate_category",
      costImpact: -Math.round(deficitAmount * 0.75 * 100) / 100,
      tradeOff: `Protects core event photography and venue while saving ~$${(
        deficitAmount * 0.75
      ).toFixed(2)}.`,
      sacrifice: `Switch from top-shelf open bar to beer & wine, and switch 5-piece band to a solo DJ.`,
      feasibilityScore: 78,
      recommendedAction: "Renegotiate beverage package to beer & wine, saving ~$15/head.",
    });
  }

  // Scenario D: Date Shift Opportunity (Off-peak / weekday discount)
  if (alternatives.length < 3) {
    const venueAllocated = simulatedSummary.categories.find(
      (c) => c.categoryKey === "venue"
    )!.allocatedAmount;
    const dateShiftSavings = Math.round(venueAllocated * 0.18 * 100) / 100;

    alternatives.push({
      id: "alt_shift_date_offpeak",
      title: "Shift Date to Off-Peak Day (Friday/Sunday or Shoulder Month)",
      actionType: "shift_date",
      costImpact: -dateShiftSavings,
      tradeOff: `Unlocks 15–20% venue discount saving $${dateShiftSavings.toFixed(
        2
      )}, directly bolstering your contingency reserve.`,
      sacrifice: `Guests may need to leave work slightly early on Friday or travel Sunday afternoon.`,
      feasibilityScore: 75,
      recommendedAction: `Shift event date by 1-2 days to access off-peak vendor rates.`,
    });
  }

  return {
    originalGuestCount,
    newGuestCount: simulatedGuestCount,
    guestDelta,
    originalBudget,
    newBudget: simulatedBudget,
    budgetDelta,
    originalCateringCostPerHead,
    newCateringCostPerHead,
    cateringTotalDelta,
    affectedCategories,
    capacityBreach,
    contingencyStatus,
    alternatives: alternatives.slice(0, 3), // Return top 2-3 ranked alternatives
  };
}
