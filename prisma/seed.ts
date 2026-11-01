import { PrismaClient } from "@prisma/client";
import { getDemoEventData } from "../lib/data/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with demo event...");
  const { event, categories, tasks, vendors } = getDemoEventData();

  // Clean up any existing demo event
  await prisma.event.deleteMany({
    where: { id: event.id },
  });

  await prisma.event.create({
    data: {
      id: event.id,
      title: event.title,
      type: event.type,
      date: new Date(`${event.date}T00:00:00Z`),
      location: event.location,
      guestCount: event.guestCount,
      totalBudget: event.totalBudget,
      currency: event.currency,
      venueCapacity: event.venueCapacity,
      venueType: event.venueType,
      venueHours: event.venueHours,
      cateringRestrictions: event.cateringRestrictions,
      priorities: JSON.stringify(event.priorities),
      notes: event.notes,
      categories: {
        create: categories.map((c) => ({
          id: c.id,
          categoryKey: c.categoryKey,
          name: c.name,
          allocatedAmount: c.allocatedAmount,
          committedAmount: c.committedAmount,
          isManualOverride: c.isManualOverride,
          notes: c.notes,
        })),
      },
      tasks: {
        create: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: new Date(`${t.dueDate}T00:00:00Z`),
          categoryKey: t.categoryKey,
          status: t.status,
          owner: t.owner,
          phase: t.phase,
          dependencyLinks: t.dependencyLinks ? JSON.stringify(t.dependencyLinks) : null,
          notes: t.notes,
        })),
      },
      vendors: {
        create: vendors.map((v) => ({
          id: v.id,
          categoryKey: v.categoryKey,
          name: v.name,
          contact: v.contact,
          quoteAmount: v.quoteAmount,
          depositAmount: v.depositAmount,
          balanceDue: v.balanceDue,
          contractStatus: v.contractStatus,
          notes: v.notes,
        })),
      },
    },
  });

  console.log(`Successfully seeded demo event: "${event.title}" (${event.id})`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
