import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { CATEGORY_KEYS } from "@/lib/config/constants";
import { VendorModel } from "@/lib/domain/types";
import { z } from "zod";

const VendorCreateSchema = z.object({
  eventId: z.string(),
  categoryKey: z.enum(CATEGORY_KEYS),
  name: z.string().trim().min(1).max(100),
  contact: z.string().trim().max(100),
  quoteAmount: z.number().min(0).default(0),
  depositAmount: z.number().min(0).default(0),
  balanceDue: z.number().min(0).default(0),
  contractStatus: z.enum([
    "contacted",
    "quoted",
    "negotiating",
    "contract_signed",
    "deposit_paid",
    "completed",
    "cancelled",
  ]).default("contacted"),
  notes: z.string().max(1000).nullable().optional(),
});

const VendorUpdateSchema = z.object({
  id: z.string(),
  name: z.string().trim().max(100).optional(),
  contact: z.string().trim().max(100).optional(),
  quoteAmount: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional(),
  balanceDue: z.number().min(0).optional(),
  contractStatus: z.enum([
    "contacted",
    "quoted",
    "negotiating",
    "contract_signed",
    "deposit_paid",
    "completed",
    "cancelled",
  ]).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VendorCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid vendor creation data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { eventId, ...vendorData } = parsed.data;
    const created = await eventRepository.createVendor(eventId, vendorData as Omit<VendorModel, "id" | "eventId">);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/vendors error:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VendorUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid vendor update data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { id, ...vendorData } = parsed.data;
    const updated = await eventRepository.updateVendor(id, vendorData as Partial<Omit<VendorModel, "id" | "eventId">>);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/vendors error:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}
