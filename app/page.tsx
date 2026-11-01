import { redirect } from "next/navigation";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const firstEvent = await eventRepository.findFirst();

  if (firstEvent) {
    redirect(`/events/${firstEvent.id}`);
  } else {
    redirect("/events/new");
  }
}
