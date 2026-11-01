import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { z } from "zod";

const TaskUpdateSchema = z.object({
  id: z.string(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  owner: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TaskUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid task update parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const updated = await eventRepository.updateTask(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
