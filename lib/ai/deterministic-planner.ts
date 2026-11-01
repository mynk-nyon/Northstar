import {
  LLMProvider,
  SimulationNarrativeInput,
  SimulationNarrativeOutput,
  VendorDraftInput,
  VendorDraftOutput,
} from "@/lib/ai/types";
import { CATEGORY_TAXONOMY } from "@/lib/config/constants";

/**
 * Deterministic local rule-based planner.
 * Implements LLMProvider with zero external API dependencies.
 * Ensures the entire application runs offline with zero configuration in evaluation demo mode.
 */
export class DeterministicRuleBasedPlanner implements LLMProvider {
  public readonly providerName = "Local Rule-Based Planner (Demo Mode)";
  public readonly isDemoMode = true;

  public async generateSimulationNarrative(
    input: SimulationNarrativeInput
  ): Promise<SimulationNarrativeOutput> {
    const { eventType, consequenceReport, currency, totalBudget } = input;
    const rep = consequenceReport;

    // 1. Headline
    let headline = `Simulation: Headcount ${rep.newGuestCount} (${
      rep.guestDelta >= 0 ? "+" : ""
    }${rep.guestDelta}) | Budget ${currency} ${rep.newBudget}`;
    if (rep.capacityBreach.occurred) {
      headline = `Capacity Breach Warning: ${rep.capacityBreach.excessGuests} Guests Over Venue Limit`;
    } else if (rep.contingencyStatus.isDrainedBelowReserve) {
      headline = `Critical Budget Alert: Contingency Reserve Depleted Below Safe Reserve`;
    } else if (rep.guestDelta > 0) {
      headline = `Guest Growth Impact: +${rep.guestDelta} Attendees Adds ${currency} ${Math.abs(
        rep.cateringTotalDelta
      )} in Catering Load`;
    }

    // 2. Summary Narrative
    const summaryNarrative = [
      `Adjusting your ${eventType} to ${rep.newGuestCount} guests with a total budget of ${currency} ${rep.newBudget.toLocaleString()} produces a net budget delta of ${
        rep.budgetDelta >= 0 ? "+" : ""
      }${currency} ${rep.budgetDelta.toLocaleString()}.`,
      `Food and beverage requirements scale directly with headcount: baseline catering is calculated at ${currency} ${rep.originalCateringCostPerHead.toFixed(
        2
      )} per head, yielding an adjusted catering allocation of ${currency} ${(
        rep.newCateringCostPerHead * rep.newGuestCount
      ).toFixed(2)}.`,
      rep.capacityBreach.occurred
        ? `Legal venue capacity of ${rep.capacityBreach.venueCapacity} is exceeded by ${rep.capacityBreach.excessGuests} attendees, which violates local safety regulations.`
        : `Venue capacity utilization is currently within safe operational limits.`,
    ].join(" ");

    // 3. Category Impact Analysis
    let categoryImpactAnalysis = "";
    if (rep.affectedCategories.length === 0) {
      categoryImpactAnalysis = "All budget categories remain balanced within target percentages.";
    } else {
      const positiveCategories = rep.affectedCategories
        .filter((c) => c.delta > 0)
        .map((c) => `${c.name} (+${currency} ${c.delta.toLocaleString()})`);
      const negativeCategories = rep.affectedCategories
        .filter((c) => c.delta < 0)
        .map((c) => `${c.name} (-${currency} ${Math.abs(c.delta).toLocaleString()})`);

      categoryImpactAnalysis = `Financial trade-offs by category: ${
        negativeCategories.length > 0
          ? `Budget absorbed cuts in ${negativeCategories.join(", ")}. `
          : ""
      }${
        positiveCategories.length > 0
          ? `Reallocated surplus into ${positiveCategories.join(", ")}. `
          : ""
      }Non-variable vendor commitments must be reviewed to prevent contract defaults.`;
    }

    // 4. Capacity Advisory
    const capacityAdvisory = rep.capacityBreach.occurred
      ? `CRITICAL CAPACITY ALERT: The venue is legally rated for ${rep.capacityBreach.venueCapacity} occupants. Hosting ${rep.newGuestCount} people introduces serious fire code liabilities, risk of venue shutdown, and compromised seating/restroom comfort.`
      : `Capacity Check: Current attendance (${rep.newGuestCount}) is comfortably accommodated by the venue layout with appropriate spacing for dining tables and dance floor.`;

    // 5. Contingency Advisory
    const contingencyAdvisory = rep.contingencyStatus.isDrainedBelowReserve
      ? `CONTINGENCY VULNERABILITY: Emergency reserves stand at ${currency} ${rep.contingencyStatus.newAmount.toFixed(
          2
        )} (${rep.contingencyStatus.newPercentage}% of budget), which is below the mandatory 5% safety margin. Any unexpected sound permit fee or weather rental will cause a direct budget overrun.`
      : `Contingency Health: You have a healthy reserve of ${currency} ${rep.contingencyStatus.newAmount.toFixed(
          2
        )} (${rep.contingencyStatus.newPercentage}% of budget) earmarked for unexpected adjustments.`;

    // 6. Recommended Alternatives
    const recommendedAlternatives = rep.alternatives.map((alt) => ({
      alternativeId: alt.id,
      actionableAdvice: `${alt.recommendedAction} (Impact: ${alt.costImpact >= 0 ? "+" : ""}${currency} ${alt.costImpact.toFixed(
        2
      )})`,
      tradeoffSummary: `${alt.tradeOff} Sacrifice: ${alt.sacrifice}`,
      confidenceScore: alt.feasibilityScore,
    }));

    return {
      headline,
      summaryNarrative,
      categoryImpactAnalysis,
      capacityAdvisory,
      contingencyAdvisory,
      recommendedAlternatives,
    };
  }

  public async generateVendorDraft(
    input: VendorDraftInput
  ): Promise<VendorDraftOutput> {
    const {
      eventType,
      eventDate,
      location,
      guestCount,
      categoryKey,
      vendorName,
      budgetCeiling,
      currency,
      messageType,
      specificQuestions = [],
      notes = "",
    } = input;

    const categoryLabel = CATEGORY_TAXONOMY[categoryKey].label;

    let subject = "";
    let body = "";
    let suggestedNegotiationLever = "";

    const formattedBudget =
      currency === "USD" || currency === "$"
        ? `$${budgetCeiling.toLocaleString()}`
        : `${currency} ${budgetCeiling.toLocaleString()}`;

    if (messageType === "inquiry") {
      subject = `Availability & Proposal Request: ${eventType.toUpperCase()} on ${eventDate} (${guestCount} Guests) - ${categoryLabel}`;
      body = `Dear ${vendorName} Team,

I hope this message finds you well.

We are currently planning a ${eventType} taking place on ${eventDate} in ${location} with approximately ${guestCount} guests, and we have been thoroughly impressed with your work in ${categoryLabel}.

We are currently gathering proposals for our celebration. Our approved budget ceiling allocated for this scope is ${formattedBudget}. We would love to review your standard packages and check your availability for this date.

Specifically, could you please provide insight on:
${
  specificQuestions.length > 0
    ? specificQuestions.map((q) => `- ${q}`).join("\n")
    : `- Package inclusions and typical service hours\n- Deposit schedules and cancellation terms\n- Load-in and staffing requirements`
}
${notes ? `\nAdditional event context: ${notes}\n` : ""}
Thank you very much for your time and guidance. We look forward to hearing from you.

Warm regards,
Event Host`;
      suggestedNegotiationLever = "Ask if booking early or off-peak grants a complimentary upgrade or secondary coverage.";
    } else if (messageType === "negotiation") {
      subject = `Proposal Review & Scope Discussion: ${eventType} on ${eventDate} - ${categoryLabel}`;
      body = `Dear ${vendorName} Team,

Thank you for sending over your detailed proposal for our ${eventType} on ${eventDate}. We love your style and would genuinely prefer to partner with you for our celebration.

We are reviewing all line items with our planning team. Our strict budget ceiling for ${categoryLabel} is ${formattedBudget}. To bridge the current quote and our authorized ceiling without compromising your craft, we would love to discuss potential adjustments.

Areas we could explore:
- Trimming 1 hour of optional coverage or simplifying load-in setup
- Providing our own print materials or specialized rentals
- Flexibility on payment milestone timing

${
  specificQuestions.length > 0
    ? "Additional questions:\n" + specificQuestions.map((q) => `- ${q}`).join("\n") + "\n"
    : ""
}
Could we schedule a brief 10-minute phone call this week to finalize an agreement within our ${formattedBudget} parameters?

Best regards,
Event Host`;
      suggestedNegotiationLever = "Offer flexibility on breakdown/cleanup timing or cash payment discount in exchange for meeting the target price ceiling.";
    } else {
      subject = `Timeline & Run-of-Show Alignment: ${eventType} on ${eventDate} - ${categoryLabel}`;
      body = `Dear ${vendorName} Team,

I hope you are having a wonderful week.

As we approach our event date (${eventDate}), we are finalizing the master vendor run-of-show for our ${guestCount}-guest celebration in ${location}.

Our records show our confirmed contract is set with a budget ceiling of ${formattedBudget}. 

Could you please confirm the following operational details:
${
  specificQuestions.length > 0
    ? specificQuestions.map((q) => `- ${q}`).join("\n")
    : `- Expected arrival and load-in time window\n- Any power or staging setup requirements we should prepare\n- Final balance payment procedure`
}

Thank you for your partnership in making this celebration unforgettable!

Warm regards,
Event Host`;
      suggestedNegotiationLever = "Request a final walkthrough to confirm line of sight and audio/power connections.";
    }

    const keyPointsHighlighted = [
      `Event Date & Location: ${eventDate} in ${location}`,
      `Headcount: ${guestCount} guests`,
      `Strict Budget Ceiling: ${formattedBudget}`,
      `Scope Focus: ${categoryLabel}`,
    ];

    return {
      subject,
      body,
      keyPointsHighlighted,
      suggestedNegotiationLever,
    };
  }
}
