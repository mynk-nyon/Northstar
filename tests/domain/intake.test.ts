import { describe, expect, it } from "vitest";
import {
  buildEventFromIntake,
  getNextAdaptiveQuestion,
} from "@/lib/domain/intake";

describe("Adaptive Intake Engine", () => {
  it("starts with core event basics if missing", () => {
    const q1 = getNextAdaptiveQuestion({});
    expect(q1?.id).toBe("q_core_basics");
    expect(q1?.stepNumber).toBe(1);
  });

  it("asks for priority ranking if user has not specified priorities", () => {
    const q2 = getNextAdaptiveQuestion({
      eventType: "wedding",
      guestCount: 100,
      totalBudget: 30000,
      date: "2026-10-10",
      location: "San Francisco",
    });
    expect(q2?.id).toBe("q_priorities");
    expect(q2?.type).toBe("ranking");
  });

  it("adaptively deep dives into the user's stated top priority", () => {
    // When top priority is catering
    const qCatering = getNextAdaptiveQuestion({
      eventType: "wedding",
      guestCount: 100,
      totalBudget: 30000,
      date: "2026-10-10",
      priorities: ["catering", "venue", "photography"],
    });
    expect(qCatering?.id).toBe("q_catering_style");

    // When top priority is venue
    const qVenue = getNextAdaptiveQuestion({
      eventType: "wedding",
      guestCount: 100,
      totalBudget: 30000,
      date: "2026-10-10",
      priorities: ["venue", "catering", "photography"],
    });
    expect(qVenue?.id).toBe("q_venue_style");
  });

  it("returns null when all intake steps are satisfied", () => {
    const qComplete = getNextAdaptiveQuestion({
      eventType: "wedding",
      guestCount: 100,
      totalBudget: 30000,
      date: "2026-10-10",
      priorities: ["catering", "venue"],
      priority_deep_dive_catering: "plated_multi_course",
      venueCapacity: 120,
      contingencyTolerance: "conservative_10",
    });
    expect(qComplete).toBeNull();
  });

  it("builds valid Event, BudgetCategories, Tasks, and Vendors deterministically", () => {
    const { event, categories, tasks, vendors } = buildEventFromIntake({
      eventType: "wedding",
      guestCount: 120,
      totalBudget: 40000,
      date: "2026-09-20",
      location: "Napa Valley, CA",
      priorities: ["catering", "venue", "photography"],
      priority_deep_dive_catering: "plated_multi_course",
      venueCapacity: 150,
      contingencyTolerance: "conservative_10",
    });

    expect(event.title).toBeDefined();
    expect(event.guestCount).toBe(120);
    expect(event.totalBudget).toBe(40000);
    expect(event.venueCapacity).toBe(150);

    // Sum of budget categories matches total budget
    const sumAllocated = Math.round(
      categories.reduce((sum, c) => sum + c.allocatedAmount, 0) * 100
    ) / 100;
    expect(sumAllocated).toBe(40000);

    // Tasks and vendors generated
    expect(tasks.length).toBeGreaterThan(10);
    expect(vendors.length).toBeGreaterThanOrEqual(3);
  });
});
