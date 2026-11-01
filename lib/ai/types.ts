import {
  SimulationConsequenceReport,
  TradeoffAlternative,
} from "@/lib/domain/types";
import { CategoryKey, EventType } from "@/lib/config/constants";

export interface SimulationNarrativeInput {
  eventType: EventType;
  guestCount: number;
  totalBudget: number;
  currency: string;
  priorities: CategoryKey[];
  consequenceReport: SimulationConsequenceReport;
  userQuery?: string;
}

export interface SimulationNarrativeOutput {
  headline: string;
  summaryNarrative: string;
  categoryImpactAnalysis: string;
  capacityAdvisory: string;
  contingencyAdvisory: string;
  recommendedAlternatives: {
    alternativeId: string;
    actionableAdvice: string;
    tradeoffSummary: string;
    confidenceScore: number;
  }[];
}

export interface VendorDraftInput {
  eventType: EventType;
  eventDate: string;
  location: string;
  guestCount: number;
  categoryKey: CategoryKey;
  vendorName: string;
  vendorContact: string;
  budgetCeiling: number;
  currency: string;
  messageType: "inquiry" | "negotiation" | "follow_up" | "scope_adjustment";
  specificQuestions?: string[];
  notes?: string;
}

export interface VendorDraftOutput {
  subject: string;
  body: string;
  keyPointsHighlighted: string[];
  suggestedNegotiationLever: string;
}

/**
 * Common LLM provider interface implemented by both OpenAI-compatible API and Local Rule-Based Planner.
 */
export interface LLMProvider {
  readonly providerName: string;
  readonly isDemoMode: boolean;

  generateSimulationNarrative(
    input: SimulationNarrativeInput
  ): Promise<SimulationNarrativeOutput>;

  generateVendorDraft(
    input: VendorDraftInput
  ): Promise<VendorDraftOutput>;
}
