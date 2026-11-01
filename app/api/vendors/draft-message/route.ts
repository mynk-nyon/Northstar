import { NextRequest, NextResponse } from "next/server";
import { VendorDraftRequestSchema } from "@/lib/ai/schemas";
import { getLLMProvider } from "@/lib/ai/provider";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`draft:${clientIp}`, 20, 60);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a moment before drafting more messages.",
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
    const parsed = VendorDraftRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid vendor drafting parameters",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 3. Generate draft using LLM provider (or fallback rule-based planner)
    const provider = getLLMProvider();
    const draft = await provider.generateVendorDraft(input as any);

    return NextResponse.json({
      success: true,
      draft,
      meta: {
        providerName: provider.providerName,
        isDemoMode: provider.isDemoMode,
      },
    });
  } catch (error) {
    console.error("POST /api/vendors/draft-message error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the vendor draft." },
      { status: 500 }
    );
  }
}
