import { describe, expect, it } from "vitest";
import {
  EventCreateSchema,
  SimulateRequestSchema,
  SimulationNarrativeOutputSchema,
  VendorDraftOutputSchema,
  VendorDraftRequestSchema,
} from "@/lib/ai/schemas";

describe("Zod Schemas and Validations", () => {
  it("validates well-formed simulation request", () => {
    const valid = SimulateRequestSchema.safeParse({
      eventType: "wedding",
      originalGuestCount: 100,
      simulatedGuestCount: 120,
      originalBudget: 25000,
      simulatedBudget: 28000,
      venueCapacity: 150,
      priorities: ["catering", "venue"],
    });

    expect(valid.success).toBe(true);
  });

  it("rejects unknown fields on strict schemas", () => {
    const invalid = SimulateRequestSchema.safeParse({
      eventType: "wedding",
      originalGuestCount: 100,
      simulatedGuestCount: 120,
      originalBudget: 25000,
      simulatedBudget: 28000,
      unknownAttackField: "drop table users",
    });

    expect(invalid.success).toBe(false);
  });

  it("rejects oversized prompt injection attempts in free text", () => {
    const oversizedString = "A".repeat(1500);
    const result = SimulateRequestSchema.safeParse({
      eventType: "wedding",
      originalGuestCount: 100,
      simulatedGuestCount: 120,
      originalBudget: 25000,
      simulatedBudget: 28000,
      userQuery: oversizedString,
    });

    expect(result.success).toBe(false);
  });

  it("verifies snapshot of schema definitions", () => {
    const schemaShapes = {
      simulateRequestKeys: Object.keys(SimulateRequestSchema.shape).sort(),
      vendorDraftRequestKeys: Object.keys(VendorDraftRequestSchema.shape).sort(),
      eventCreateKeys: Object.keys(EventCreateSchema.shape).sort(),
      simulationNarrativeOutputKeys: Object.keys(
        SimulationNarrativeOutputSchema.shape
      ).sort(),
      vendorDraftOutputKeys: Object.keys(
        VendorDraftOutputSchema.shape
      ).sort(),
    };

    expect(schemaShapes).toMatchSnapshot();
  });
});
