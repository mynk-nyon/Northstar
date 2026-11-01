import {
  BASELINE_ALLOCATIONS,
  CATEGORY_KEYS,
  CATEGORY_TAXONOMY,
  CategoryKey,
  EventType,
  MINIMUM_CONTINGENCY_PERCENTAGE,
} from "@/lib/config/constants";
import {
  ComputedBudgetSummary,
  ComputedCategoryBreakdown,
} from "@/lib/domain/types";

export interface CalculateAllocationInput {
  eventType: EventType;
  totalBudget: number;
  guestCount: number;
  priorities?: CategoryKey[];
  manualOverrides?: Partial<Record<CategoryKey, number>>;
  committedAmounts?: Partial<Record<CategoryKey, number>>;
}

/**
 * Calculates budget allocation percentages adjusted by stated priority rankings.
 * Top-ranked categories receive a proportional boost while lower-ranked categories absorb the difference.
 * The contingency reserve is safeguarded so it never drops below the minimum threshold.
 *
 * @param eventType - 'wedding' | 'birthday' | 'community'
 * @param priorities - User-ranked category keys in order of importance
 * @returns Map of CategoryKey to fractional percentage (sum equals 1.0)
 */
export function calculateWeightedPercentages(
  eventType: EventType,
  priorities: CategoryKey[] = []
): Record<CategoryKey, number> {
  const base = { ...BASELINE_ALLOCATIONS[eventType] };
  const contingencyKey: CategoryKey = "contingency";

  // If no priorities specified, return base allocations
  if (!priorities || priorities.length === 0) {
    return base;
  }

  // Ensure minimum contingency reserve is strictly preserved
  const minContingency = Math.max(
    base[contingencyKey],
    MINIMUM_CONTINGENCY_PERCENTAGE
  );

  // Remaining percentage pool to distribute among active categories
  const pool = 1.0 - minContingency;

  // Compute weight multipliers: item at index 0 gets highest boost, diminishing down
  const weights = {} as Record<CategoryKey, number>;
  const numPriorities = priorities.length;

  for (const key of CATEGORY_KEYS) {
    if (key === contingencyKey) {
      weights[key] = 0; // Handled separately
      continue;
    }

    const priorityIndex = priorities.indexOf(key);
    if (priorityIndex !== -1) {
      // Linear priority scale: 1st place gets +30% boost, last place gets -30%
      const rankNormalized = 1 - (2 * priorityIndex) / Math.max(1, numPriorities - 1);
      const multiplier = 1 + rankNormalized * 0.35;
      weights[key] = base[key] * multiplier;
    } else {
      weights[key] = base[key];
    }
  }

  // Sum non-contingency weights and normalize to the available pool
  const totalWeight = Object.entries(weights)
    .filter(([k]) => k !== contingencyKey)
    .reduce((sum, [, w]) => sum + w, 0);

  const finalPercentages = {} as Record<CategoryKey, number>;
  for (const key of CATEGORY_KEYS) {
    if (key === contingencyKey) {
      finalPercentages[key] = minContingency;
    } else {
      finalPercentages[key] = (weights[key] / totalWeight) * pool;
    }
  }

  return finalPercentages;
}

/**
 * Computes exact dollar allocations across categories.
 * Handles manual overrides deterministically:
 * Overridden categories are fixed to the user-specified dollar value.
 * Remaining budget is distributed among non-overridden categories using their relative weights,
 * while ensuring contingency never falls below the minimum contingency dollar threshold unless
 * the user explicitly overrides contingency.
 *
 * @param input - Budget allocation parameters
 * @returns ComputedBudgetSummary with per-category breakdowns and financial metrics
 */
export function computeBudgetSummary(
  input: CalculateAllocationInput
): ComputedBudgetSummary {
  const {
    eventType,
    totalBudget,
    guestCount,
    priorities = [],
    manualOverrides = {},
    committedAmounts = {},
  } = input;

  const validGuestCount = Math.max(1, Math.round(guestCount));
  const validTotalBudget = Math.max(0, Math.round(totalBudget * 100) / 100);

  const basePercentages = calculateWeightedPercentages(eventType, priorities);

  // Identify manual overrides
  const overriddenKeys = Object.keys(manualOverrides).filter(
    (k): k is CategoryKey =>
      CATEGORY_KEYS.includes(k as CategoryKey) &&
      typeof manualOverrides[k as CategoryKey] === "number" &&
      manualOverrides[k as CategoryKey]! >= 0
  );

  let totalOverriddenAmount = 0;
  for (const key of overriddenKeys) {
    totalOverriddenAmount += manualOverrides[key]!;
  }

  const remainingBudgetForNonOverridden = Math.max(
    0,
    validTotalBudget - totalOverriddenAmount
  );

  const nonOverriddenKeys = CATEGORY_KEYS.filter(
    (k) => !overriddenKeys.includes(k)
  );

  const nonOverriddenWeightSum = nonOverriddenKeys.reduce(
    (sum, k) => sum + basePercentages[k],
    0
  );

  const categoryAllocations = {} as Record<CategoryKey, number>;

  for (const key of CATEGORY_KEYS) {
    if (overriddenKeys.includes(key)) {
      categoryAllocations[key] = Math.round(manualOverrides[key]! * 100) / 100;
    } else if (nonOverriddenWeightSum > 0) {
      const share =
        (basePercentages[key] / nonOverriddenWeightSum) *
        remainingBudgetForNonOverridden;
      categoryAllocations[key] = Math.round(share * 100) / 100;
    } else {
      categoryAllocations[key] = 0;
    }
  }

  // Adjust any rounding discrepancies to match validTotalBudget if no all-manual override
  if (overriddenKeys.length < CATEGORY_KEYS.length && validTotalBudget > 0) {
    const sumAllocated = Math.round(
      Object.values(categoryAllocations).reduce((a, b) => a + b, 0) * 100
    ) / 100;
    const roundingDiff = Math.round((validTotalBudget - sumAllocated) * 100) / 100;
    // Add minor cent differences to the highest non-overridden category
    const targetKey =
      nonOverriddenKeys.find((k) => k !== "contingency") ||
      nonOverriddenKeys[0];
    if (targetKey && roundingDiff !== 0) {
      categoryAllocations[targetKey] =
        Math.round((categoryAllocations[targetKey] + roundingDiff) * 100) / 100;
    }
  }

  // Build category breakdowns
  let totalCommitted = 0;
  let totalAllocated = 0;
  let totalOverrun = 0;

  const categories: ComputedCategoryBreakdown[] = CATEGORY_KEYS.map((key) => {
    const allocated = categoryAllocations[key] || 0;
    const committed = Math.round((committedAmounts[key] || 0) * 100) / 100;
    const remaining = Math.round((allocated - committed) * 100) / 100;
    const isOverrun = committed > allocated;
    const overrunAmount = isOverrun ? Math.round((committed - allocated) * 100) / 100 : 0;
    const costPerHead = Math.round((allocated / validGuestCount) * 100) / 100;
    const percentageOfBudget =
      validTotalBudget > 0
        ? Math.round((allocated / validTotalBudget) * 1000) / 10
        : 0;

    totalAllocated += allocated;
    totalCommitted += committed;
    totalOverrun += overrunAmount;

    return {
      categoryKey: key,
      name: CATEGORY_TAXONOMY[key].label,
      allocatedAmount: allocated,
      committedAmount: committed,
      remainingAmount: remaining,
      percentageOfBudget,
      isOverrun,
      overrunAmount,
      costPerHead,
      isManualOverride: overriddenKeys.includes(key),
    };
  });

  const contingencyAllocated = categoryAllocations["contingency"] || 0;
  const minRequiredContingency = validTotalBudget * MINIMUM_CONTINGENCY_PERCENTAGE;
  const isContingencyDrained = contingencyAllocated < minRequiredContingency;

  return {
    totalBudget: validTotalBudget,
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    totalCommitted: Math.round(totalCommitted * 100) / 100,
    totalRemaining: Math.round((validTotalBudget - totalCommitted) * 100) / 100,
    totalOverrun: Math.round(totalOverrun * 100) / 100,
    contingencyReserve: contingencyAllocated,
    contingencyPercentage:
      validTotalBudget > 0
        ? Math.round((contingencyAllocated / validTotalBudget) * 1000) / 10
        : 0,
    isContingencyDrained,
    costPerHead: Math.round((validTotalBudget / validGuestCount) * 100) / 100,
    categories,
    hasOverruns: totalOverrun > 0,
  };
}
