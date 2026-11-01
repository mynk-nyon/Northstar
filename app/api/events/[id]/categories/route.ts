import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { z } from "zod";

const CategoryUpdateSchema = z.object({
  categoryKey: z.string(),
  allocatedAmount: z.number().min(0).optional(),
  committedAmount: z.number().min(0).optional(),
  isManualOverride: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const parsed = CategoryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { categoryKey, ...updateData } = parsed.data;
    const updated = await eventRepository.updateCategory(
      eventId,
      categoryKey,
      updateData
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/events/[id]/categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
