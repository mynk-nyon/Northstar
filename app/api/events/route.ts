import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { buildEventFromIntake } from "@/lib/domain/intake";
import { CATEGORY_KEYS } from "@/lib/config/constants";
import { IntakeAnswers } from "@/lib/domain/types";
import { z } from "zod";

const IntakeSubmissionSchema = z.object({
  eventType: z.enum(["wedding", "birthday", "community"]).default("wedding"),
  title: z.string().trim().max(150).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().trim().max(150),
  guestCount: z.number().int().min(1).max(10000),
  totalBudget: z.number().min(100).max(10000000),
  currency: z.string().max(10).default("USD"),
  venueCapacity: z.number().int().min(1).max(10000).nullable().optional(),
  venueType: z.enum(["indoor", "outdoor", "hybrid"]).default("indoor"),
  venueHours: z.number().int().min(1).max(24).nullable().optional(),
  cateringRestrictions: z.string().max(1000).nullable().optional(),
  priorities: z.array(z.enum(CATEGORY_KEYS)).min(1).max(20),
  notes: z.string().max(1000).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("first") === "true") {
      const firstEvent = await eventRepository.findFirst();
      if (!firstEvent) {
        return NextResponse.json({ error: "No events found" }, { status: 404 });
      }
      return NextResponse.json(firstEvent);
    }

    const events = await eventRepository.listAll();
    return NextResponse.json(events);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve events. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = IntakeSubmissionSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid event submission", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const bundle = buildEventFromIntake(parsed.data as IntakeAnswers);
    const createdEvent = await eventRepository.create(bundle);

    return NextResponse.json(createdEvent, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to create event. Please try again." },
      { status: 500 }
    );
  }
}
