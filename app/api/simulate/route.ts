import { NextRequest, NextResponse } from "next/server";
import { SimulateRequestSchema } from "@/lib/ai/schemas";
import { simulateWhatIf } from "@/lib/domain/simulator";
import { getLLMProvider } from "@/lib/ai/provider";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`simulate:${clientIp}`, 30, 60);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a moment before running more simulations.",
          resetSeconds: rateCheck.resetSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.resetSeconds),
          },
        }
      );
    }

    // 2. Strict input validation
    const rawBody = await req.json();
    const parsed = SimulateRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid simulation parameters",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 3. Pure deterministic mathematical consequence report
    const consequenceReport = simulateWhatIf({
      eventType: input.eventType,
      originalGuestCount: input.originalGuestCount,
      simulatedGuestCount: input.simulatedGuestCount,
      originalBudget: input.originalBudget,
      simulatedBudget: input.simulatedBudget,
      venueCapacity: input.venueCapacity,
      originalPriorities: input.priorities,
      simulatedPriorities: input.priorities,
    });

    // 4. Generate LLM Narrative (with fallback to local rule-based planner)
    const provider = getLLMProvider();
    const narrative = await provider.generateSimulationNarrative({
      eventType: input.eventType,
      guestCount: input.simulatedGuestCount,
      totalBudget: input.simulatedBudget,
      currency: "USD",
      priorities: input.priorities || [],
      consequenceReport,
      userQuery: input.userQuery,
    });

    return NextResponse.json({
      success: true,
      consequenceReport,
      narrative,
      meta: {
        providerName: provider.providerName,
        isDemoMode: provider.isDemoMode,
      },
    });
  } catch (error) {
    console.error("POST /api/simulate unhandled error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the simulation report." },
      { status: 500 }
    );
  }
}
