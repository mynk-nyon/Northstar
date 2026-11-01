import React from "react";
import { notFound } from "next/navigation";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { ExportClient } from "@/components/ExportClient";

export const dynamic = "force-dynamic";

export default async function EventExportPage({
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
    <ExportClient
      event={event}
      categories={event.categories}
      tasks={event.tasks}
      vendors={event.vendors}
    />
  );
}
