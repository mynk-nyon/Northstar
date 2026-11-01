import { describe, expect, it } from "vitest";
import {
  validateAndCorrectNarrativeOutput,
  validateAndCorrectVendorDraft,
} from "@/lib/ai/validator";
import { simulateWhatIf } from "@/lib/domain/simulator";
import { SimulationNarrativeOutput, VendorDraftOutput } from "@/lib/ai/types";

describe("Mathematical AI Validator", () => {
  it("corrects hallucinated alternative numbers and fallback IDs", () => {
    const report = simulateWhatIf({
      eventType: "wedding",
      originalGuestCount: 100,
      simulatedGuestCount: 120,
      originalBudget: 30000,
      simulatedBudget: 30000,
      venueCapacity: 150,
    });

    const hallucinatedOutput: SimulationNarrativeOutput = {
      headline: "Everything looks fine",
      summaryNarrative: "Summary with some notes",
      categoryImpactAnalysis: "Impact on budget",
      capacityAdvisory: "Capacity ok",
      contingencyAdvisory: "Contingency ok",
      recommendedAlternatives: [
        {
          alternativeId: "fake_hallucinated_id",
          actionableAdvice: "Spend more money",
          tradeoffSummary: "Unknown trade-off",
          confidenceScore: 50,
        },
      ],
    };

    const validated = validateAndCorrectNarrativeOutput(hallucinatedOutput, report);
    expect(validated.recommendedAlternatives[0].alternativeId).toBe(report.alternatives[0].id);
    expect(validated.recommendedAlternatives[0].actionableAdvice).toContain(
      report.alternatives[0].recommendedAction
    );
  });

  it("sanitizes vendor draft if model quotes an unauthorized higher price", () => {
    const rawDraft: VendorDraftOutput = {
      subject: "Inquiry for Catering",
      body: "We are thrilled to work with you and our budget is $25,000 for this service.",
      keyPointsHighlighted: ["Date: 2026-09-18"],
      suggestedNegotiationLever: "Ask for off-peak discount",
    };

    const validated = validateAndCorrectVendorDraft(rawDraft, 10000, "USD");
    expect(validated.body).not.toContain("$25,000");
    expect(validated.body).toContain("$10,000");
  });
});
