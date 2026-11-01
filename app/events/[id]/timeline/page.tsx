import React from "react";
import { notFound } from "next/navigation";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { TimelineClient } from "@/components/TimelineClient";

export const dynamic = "force-dynamic";

export default async function EventTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await eventRepository.findById(id);

  if (!event) {
    notFound();
  }

  return (
    <TimelineClient
      initialTasks={event.tasks}
      eventDate={event.date}
    />
  );
}
