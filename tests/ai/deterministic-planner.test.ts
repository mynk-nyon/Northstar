import { describe, expect, it } from "vitest";
import { DeterministicRuleBasedPlanner } from "@/lib/ai/deterministic-planner";
import { simulateWhatIf } from "@/lib/domain/simulator";
import {
  SimulationNarrativeOutputSchema,
  VendorDraftOutputSchema,
} from "@/lib/ai/schemas";

describe("Deterministic Rule-Based Planner (Demo Mode)", () => {
  const planner = new DeterministicRuleBasedPlanner();

  it("identifies as demo mode provider", () => {
    expect(planner.isDemoMode).toBe(true);
    expect(planner.providerName).toContain("Demo Mode");
  });

  it("produces valid simulation narrative adhering to schema without network calls", async () => {
    const consequenceReport = simulateWhatIf({
      eventType: "wedding",
      originalGuestCount: 100,
      simulatedGuestCount: 125,
      originalBudget: 30000,
      simulatedBudget: 32000,
      venueCapacity: 120, // Breached by 5
    });

    const narrative = await planner.generateSimulationNarrative({
      eventType: "wedding",
      guestCount: 125,
      totalBudget: 32000,
      currency: "USD",
      priorities: ["catering", "venue", "photography"],
      consequenceReport,
    });

    const parsed = SimulationNarrativeOutputSchema.safeParse(narrative);
    expect(parsed.success).toBe(true);
    expect(narrative.headline).toContain("Breach");
    expect(narrative.capacityAdvisory).toContain("CRITICAL CAPACITY ALERT");
    expect(narrative.recommendedAlternatives.length).toBeGreaterThan(0);
  });

  it("produces high-touch vendor message draft adhering to schema", async () => {
    const draft = await planner.generateVendorDraft({
      eventType: "wedding",
      eventDate: "2026-09-18",
      location: "Carmel, CA",
      guestCount: 110,
      categoryKey: "catering",
      vendorName: "Artisan Kitchen",
      vendorContact: "chef@artisankitchen.com",
      budgetCeiling: 12000,
      currency: "USD",
      messageType: "inquiry",
      specificQuestions: [
        "Do you accommodate gluten-free and vegan guests?",
        "What is your server staffing ratio?",
      ],
      notes: "Outdoor coastal venue with no kitchen prep area.",
    });

    const parsed = VendorDraftOutputSchema.safeParse(draft);
    expect(parsed.success).toBe(true);
    expect(draft.subject).toContain("2026-09-18");
    expect(draft.body).toContain("$12,000");
    expect(draft.body).toContain("gluten-free");
    expect(draft.suggestedNegotiationLever.length).toBeGreaterThan(10);
  });
});
