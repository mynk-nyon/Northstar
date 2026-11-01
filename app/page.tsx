import { redirect } from "next/navigation";
import { eventRepository } from "@/lib/data/repositories/prisma-event-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let targetUrl = "/events/new";
  try {
    const firstEvent = await eventRepository.findFirst();
    if (firstEvent) {
      targetUrl = `/events/${firstEvent.id}`;
    }
  } catch (error) {
    console.error("HomePage finding first event error:", error);
    targetUrl = "/events/new";
  }

  redirect(targetUrl);
}
