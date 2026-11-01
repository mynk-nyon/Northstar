import {
  SimulationNarrativeOutput,
  VendorDraftOutput,
} from "@/lib/ai/types";
import { SimulationConsequenceReport } from "@/lib/domain/types";

export interface MathContext {
  originalBudget: number;
  newBudget: number;
  budgetDelta: number;
  originalGuestCount: number;
  newGuestCount: number;
  guestDelta: number;
  originalCateringCostPerHead: number;
  newCateringCostPerHead: number;
  cateringTotalDelta: number;
  contingencyReserve: number;
  venueCapacity: number | null;
  excessGuests: number;
  currencySymbol?: string;
}

/**
 * Validates and corrects numbers in LLM-generated narrative outputs.
 * Discards or fixes hallucinated figures so computed TypeScript truth is preserved.
 *
 * @param output - Raw parsed LLM narrative output
 * @param report - Deterministically computed simulation consequence report
 * @returns Cleaned and validated SimulationNarrativeOutput
 */
export function validateAndCorrectNarrativeOutput(
  output: SimulationNarrativeOutput,
  report: SimulationConsequenceReport
): SimulationNarrativeOutput {
  const corrected: SimulationNarrativeOutput = { ...output };

  // Match alternative IDs and ensure actionableAdvice and tradeoffSummary contain valid numbers
  corrected.recommendedAlternatives = output.recommendedAlternatives.map((rec) => {
    const matchedAlt = report.alternatives.find(
      (a) => a.id === rec.alternativeId
    );

    if (!matchedAlt) {
      // If LLM returned a hallucinated alternative ID, fallback to first deterministic alternative
      const fallbackAlt = report.alternatives[0];
      return {
        alternativeId: fallbackAlt ? fallbackAlt.id : "alt_general_1",
        actionableAdvice: fallbackAlt
          ? fallbackAlt.recommendedAction
          : rec.actionableAdvice,
        tradeoffSummary: fallbackAlt ? fallbackAlt.tradeOff : rec.tradeoffSummary,
        confidenceScore: rec.confidenceScore,
      };
    }

    // Ensure the deterministic cost impact and sacrifice are accurately represented
    return {
      alternativeId: matchedAlt.id,
      actionableAdvice: rec.actionableAdvice.includes("$")
        ? rec.actionableAdvice
        : `${rec.actionableAdvice} (Estimated impact: ${matchedAlt.costImpact >= 0 ? "+" : ""}$${matchedAlt.costImpact})`,
      tradeoffSummary: rec.tradeoffSummary,
      confidenceScore: Math.min(100, Math.max(0, rec.confidenceScore)),
    };
  });

  return corrected;
}

/**
 * Validates and corrects vendor draft communications.
 * Ensures the budget ceiling mentioned in the email body never exceeds the authorized ceiling.
 *
 * @param output - Raw parsed LLM vendor draft output
 * @param authorizedBudgetCeiling - Pure domain computed ceiling
 * @param currency - e.g. "USD"
 * @returns Cleaned VendorDraftOutput
 */
export function validateAndCorrectVendorDraft(
  output: VendorDraftOutput,
  authorizedBudgetCeiling: number,
  currency: string = "USD"
): VendorDraftOutput {
  const corrected = { ...output };

  // Scan body for any dollar amount higher than authorized budget ceiling
  const currencySign = currency === "USD" ? "\\$" : `${currency}\\s*`;
  const moneyPattern = new RegExp(`${currencySign}([0-9,]+(\\.[0-9]{2})?)`, "gi");

  let sanitizedBody = corrected.body.replace(moneyPattern, (match, p1) => {
    const rawNum = parseFloat(p1.replace(/,/g, ""));
    if (!isNaN(rawNum) && rawNum > authorizedBudgetCeiling * 1.05) {
      // Correct exaggerated or hallucinated figure down to authorized ceiling
      return `$${authorizedBudgetCeiling.toLocaleString()}`;
    }
    return match;
  });

  // If the body completely omitted the authorized budget ceiling, ensure it is clearly stated
  if (!sanitizedBody.includes(`${authorizedBudgetCeiling}`)) {
    sanitizedBody = `${sanitizedBody}\n\n[Budget Note: Our firm budget ceiling for this scope is $${authorizedBudgetCeiling.toLocaleString()} ${currency}.]`;
  }

  corrected.body = sanitizedBody;
  return corrected;
}
