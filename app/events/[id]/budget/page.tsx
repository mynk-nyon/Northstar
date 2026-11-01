import React from "react";
import { notFound } from "next/navigation";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { BudgetSimulatorClient } from "@/components/BudgetSimulatorClient";

export const dynamic = "force-dynamic";

export default async function EventBudgetPage({
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
    <BudgetSimulatorClient
      event={event}
      categories={event.categories}
    />
  );
}
