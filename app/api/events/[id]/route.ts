import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { z } from "zod";

const EventUpdateSchema = z.object({
  title: z.string().trim().max(150).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().trim().max(150).optional(),
  guestCount: z.number().int().min(1).max(10000).optional(),
  totalBudget: z.number().min(100).max(10000000).optional(),
  venueCapacity: z.number().int().min(1).max(10000).nullable().optional(),
  cateringRestrictions: z.string().max(1000).nullable().optional(),
  priorities: z.array(z.string()).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await eventRepository.findById(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = EventUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await eventRepository.update(id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await eventRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
