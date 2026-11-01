import { describe, expect, it } from "vitest";
import { evaluateCapacity } from "@/lib/domain/capacity";

describe("Capacity Domain Engine", () => {
  it("handles unconstrained venue without false warnings", () => {
    const result = evaluateCapacity(150, null);
    expect(result.isBreached).toBe(false);
    expect(result.isNearCapacity).toBe(false);
    expect(result.warningMessage).toBeNull();
  });

  it("calculates utilization rate accurately", () => {
    const result = evaluateCapacity(80, 100);
    expect(result.utilizationRate).toBe(0.8);
    expect(result.remainingSeats).toBe(20);
    expect(result.safetyMarginPercentage).toBe(20);
    expect(result.isBreached).toBe(false);
    expect(result.isNearCapacity).toBe(false);
  });

  it("triggers warning when utilization is at or above 90%", () => {
    const result = evaluateCapacity(92, 100);
    expect(result.isNearCapacity).toBe(true);
    expect(result.isBreached).toBe(false);
    expect(result.remainingSeats).toBe(8);
    expect(result.warningMessage).toContain("WARNING");
    expect(result.warningMessage).toContain("92%");
  });

  it("flags critical breach when guest count exceeds venue legal capacity", () => {
    const result = evaluateCapacity(115, 100);
    expect(result.isBreached).toBe(true);
    expect(result.excessGuests).toBe(15);
    expect(result.remainingSeats).toBe(0);
    expect(result.safetyMarginPercentage).toBe(0);
    expect(result.warningMessage).toContain("CRITICAL");
    expect(result.warningMessage).toContain("exceeds venue legal capacity");
  });
});
