import { describe, expect, it } from "vitest";
import { simulateWhatIf } from "@/lib/domain/simulator";

describe("Decision-Support Simulator Engine", () => {
  it("calculates numeric deltas when guest count increases", () => {
    const report = simulateWhatIf({
      eventType: "wedding",
      originalGuestCount: 100,
      simulatedGuestCount: 120,
      originalBudget: 30000,
      simulatedBudget: 30000,
      venueCapacity: 150,
    });

    expect(report.guestDelta).toBe(20);
    expect(report.originalCateringCostPerHead).toBeGreaterThan(0);
    expect(report.newGuestCount).toBe(120);
    expect(report.capacityBreach.occurred).toBe(false);
    expect(report.alternatives.length).toBeGreaterThanOrEqual(2);

    // Each alternative must have numbers attached, trade-off, and sacrifice
    for (const alt of report.alternatives) {
      expect(typeof alt.costImpact).toBe("number");
      expect(alt.tradeOff.length).toBeGreaterThan(10);
      expect(alt.sacrifice.length).toBeGreaterThan(5);
    }
  });

  it("detects capacity breach when simulated headcount exceeds venue capacity", () => {
    const report = simulateWhatIf({
      eventType: "wedding",
      originalGuestCount: 100,
      simulatedGuestCount: 130,
      originalBudget: 30000,
      simulatedBudget: 30000,
      venueCapacity: 110,
    });

    expect(report.capacityBreach.occurred).toBe(true);
    expect(report.capacityBreach.excessGuests).toBe(20);

    const capAlternative = report.alternatives.find(
      (a) => a.actionType === "cut_guests" && a.id.includes("cap")
    );
    expect(capAlternative).toBeDefined();
    expect(capAlternative?.costImpact).toBeLessThan(0); // Saves money
    expect(capAlternative?.tradeOff).toContain("capacity");
  });

  it("evaluates contingency reserve drain when budget drops", () => {
    const report = simulateWhatIf({
      eventType: "birthday",
      originalGuestCount: 50,
      simulatedGuestCount: 50,
      originalBudget: 10000,
      simulatedBudget: 7000,
    });

    expect(report.budgetDelta).toBe(-3000);
    expect(report.contingencyStatus.delta).toBeLessThan(0);
    expect(report.alternatives.some((a) => a.actionType === "cut_guests" || a.actionType === "reallocate_category")).toBe(true);
  });
});
