import React from "react";
import { notFound } from "next/navigation";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";
import { VendorClient } from "@/components/VendorClient";

export const dynamic = "force-dynamic";

export default async function EventVendorsPage({
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
    <VendorClient
      event={event}
      initialVendors={event.vendors}
      categories={event.categories}
    />
  );
}
