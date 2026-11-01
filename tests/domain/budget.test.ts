import { describe, expect, it } from "vitest";
import {
  calculateWeightedPercentages,
  computeBudgetSummary,
} from "@/lib/domain/budget";
import { MINIMUM_CONTINGENCY_PERCENTAGE } from "@/lib/config/constants";

describe("Budget Domain Engine", () => {
  it("preserves sum of percentages to 1.0 (100%)", () => {
    const percentages = calculateWeightedPercentages("wedding", [
      "catering",
      "venue",
      "photography",
      "entertainment",
      "decor",
      "attire",
      "invitations",
      "favors",
    ]);

    const sum = Object.values(percentages).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("enforces minimum contingency reserve even with aggressive priority shifts", () => {
    const percentages = calculateWeightedPercentages("wedding", [
      "catering",
      "photography",
    ]);

    expect(percentages.contingency).toBeGreaterThanOrEqual(
      MINIMUM_CONTINGENCY_PERCENTAGE
    );
  });

  it("boosts top-ranked priority category above baseline", () => {
    const base = calculateWeightedPercentages("wedding", []);
    const boosted = calculateWeightedPercentages("wedding", [
      "photography",
      "catering",
      "venue",
    ]);

    expect(boosted.photography).toBeGreaterThan(base.photography);
  });

  it("allocates exact total budget without missing pennies", () => {
    const summary = computeBudgetSummary({
      eventType: "wedding",
      totalBudget: 35000.75,
      guestCount: 120,
      priorities: ["catering", "venue"],
    });

    expect(summary.totalAllocated).toBe(35000.75);
    expect(summary.costPerHead).toBeCloseTo(35000.75 / 120, 2);
  });

  it("correctly flags category overruns and calculates remaining balances", () => {
    const summary = computeBudgetSummary({
      eventType: "birthday",
      totalBudget: 10000,
      guestCount: 50,
      committedAmounts: {
        catering: 5500, // exceeds typical ~38% ($3800)
        venue: 1500,
      },
    });

    const catering = summary.categories.find((c) => c.categoryKey === "catering")!;
    expect(catering.isOverrun).toBe(true);
    expect(catering.overrunAmount).toBeGreaterThan(0);
    expect(summary.hasOverruns).toBe(true);
    expect(summary.totalCommitted).toBe(7000);
  });

  it("supports manual overrides and rebalances remaining categories deterministically", () => {
    const summary = computeBudgetSummary({
      eventType: "community",
      totalBudget: 20000,
      guestCount: 200,
      manualOverrides: {
        venue: 8000, // Fixed override
      },
    });

    const venue = summary.categories.find((c) => c.categoryKey === "venue")!;
    expect(venue.allocatedAmount).toBe(8000);
    expect(venue.isManualOverride).toBe(true);
    expect(summary.totalAllocated).toBe(20000);

    // Remaining $12,000 must be distributed among other categories
    const nonVenueSum = summary.categories
      .filter((c) => c.categoryKey !== "venue")
      .reduce((s, c) => s + c.allocatedAmount, 0);
    expect(nonVenueSum).toBe(12000);
  });
});
