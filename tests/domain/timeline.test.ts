import { describe, expect, it } from "vitest";
import {
  calculateDaysRemaining,
  calculateDueDate,
  generateTimelineTasks,
  groupTasksByPhase,
} from "@/lib/domain/timeline";

describe("Timeline Domain Engine", () => {
  it("computes calendar due date accurately in UTC", () => {
    // 2026-10-15 minus 30 days -> 2026-09-15
    const due = calculateDueDate("2026-10-15", 30);
    expect(due).toBe("2026-09-15");
  });

  it("handles leap year date boundary correctly", () => {
    // 2024 is a leap year with Feb 29.
    // 2024-03-05 minus 10 days = 2024-02-24
    const leapDue = calculateDueDate("2024-03-05", 10);
    expect(leapDue).toBe("2024-02-24");

    // 2025 is not a leap year.
    // 2025-03-05 minus 10 days = 2025-02-23
    const nonLeapDue = calculateDueDate("2025-03-05", 10);
    expect(nonLeapDue).toBe("2025-02-23");
  });

  it("calculates days remaining and flags overdue status", () => {
    const refDate = new Date("2026-06-01T00:00:00Z");

    // Future task
    const futureDays = calculateDaysRemaining("2026-06-15", refDate);
    expect(futureDays).toBe(14);

    // Past / overdue task
    const overdueDays = calculateDaysRemaining("2026-05-20", refDate);
    expect(overdueDays).toBe(-12);
  });

  it("generates milestone tasks with vendor lead-time awareness", () => {
    const tasks = generateTimelineTasks("event_123", "wedding", "2026-12-31");
    expect(tasks.length).toBeGreaterThan(10);

    const venueTask = tasks.find((t) => t.categoryKey === "venue" && t.phase === "twelve_months");
    expect(venueTask).toBeDefined();
    // Venue task due ~330 days prior
    expect(venueTask?.dueDate).toBe("2026-02-04");

    const rsvpTask = tasks.find((t) => t.title.includes("RSVP"));
    expect(rsvpTask?.dueDate).toBe("2026-12-01");
  });

  it("groups tasks by phase and flags overdue tasks without layout gaps", () => {
    const tasks = generateTimelineTasks("event_123", "birthday", "2026-08-01");
    const refDate = new Date("2026-07-01T00:00:00Z");

    const grouped = groupTasksByPhase(tasks, refDate);
    expect(grouped.three_months).toBeDefined();
    expect(grouped.day_of).toBeDefined();

    // Check that tasks within 3-months due in May/June are flagged overdue against July reference
    const earlyTasks = grouped.three_months.tasks;
    const hasOverdue = earlyTasks.some((t: any) => t.isOverdue);
    expect(hasOverdue).toBe(true);
  });
});
