import { prisma, ensureDatabaseInitialized } from "@/lib/data/db";
import type {
  Event as PrismaEvent,
  BudgetCategory as PrismaCategory,
  Task as PrismaTask,
  Vendor as PrismaVendor,
  Prisma,
} from "@prisma/client";
import {
  EventWithDetails,
  IEventRepository,
} from "@/lib/data/repositories/types";
import {
  BudgetCategoryModel,
  EventModel,
  TaskModel,
  VendorModel,
} from "@/lib/domain/types";
import { CategoryKey, EventType, TimelinePhase } from "@/lib/config/constants";

let initPromise: Promise<void> | null = null;
async function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = ensureDatabaseInitialized().catch((err) => {
      console.error("Database self-healing failed:", err);
      initPromise = null;
    });
  }
  return initPromise;
}

export class PrismaEventRepository implements IEventRepository {
  private mapEvent(raw: PrismaEvent): EventModel {
    return {
      id: raw.id,
      title: raw.title,
      type: raw.type as EventType,
      date: raw.date instanceof Date ? raw.date.toISOString().slice(0, 10) : String(raw.date).slice(0, 10),
      location: raw.location,
      guestCount: raw.guestCount,
      totalBudget: raw.totalBudget,
      currency: raw.currency,
      venueCapacity: raw.venueCapacity,
      venueType: (raw.venueType as EventModel["venueType"]) || "indoor",
      venueHours: raw.venueHours,
      cateringRestrictions: raw.cateringRestrictions,
      priorities: (typeof raw.priorities === "string"
        ? JSON.parse(raw.priorities)
        : raw.priorities) as CategoryKey[],
      notes: raw.notes,
    };
  }

  private mapCategory(raw: PrismaCategory): BudgetCategoryModel {
    return {
      id: raw.id,
      eventId: raw.eventId,
      categoryKey: raw.categoryKey as CategoryKey,
      name: raw.name,
      allocatedAmount: raw.allocatedAmount,
      committedAmount: raw.committedAmount,
      isManualOverride: raw.isManualOverride,
      notes: raw.notes,
    };
  }

  private mapTask(raw: PrismaTask): TaskModel {
    return {
      id: raw.id,
      eventId: raw.eventId,
      title: raw.title,
      dueDate: raw.dueDate instanceof Date ? raw.dueDate.toISOString().slice(0, 10) : String(raw.dueDate).slice(0, 10),
      categoryKey: raw.categoryKey as CategoryKey,
      status: raw.status as TaskModel["status"],
      owner: raw.owner,
      phase: raw.phase as TimelinePhase,
      dependencyLinks: raw.dependencyLinks ? JSON.parse(raw.dependencyLinks) : [],
      notes: raw.notes,
    };
  }

  private mapVendor(raw: PrismaVendor): VendorModel {
    return {
      id: raw.id,
      eventId: raw.eventId,
      categoryKey: raw.categoryKey as CategoryKey,
      name: raw.name,
      contact: raw.contact,
      quoteAmount: raw.quoteAmount,
      depositAmount: raw.depositAmount,
      balanceDue: raw.balanceDue,
      contractStatus: raw.contractStatus as VendorModel["contractStatus"],
      notes: raw.notes,
    };
  }

  public async findById(id: string): Promise<EventWithDetails | null> {
    await ensureInit();
    const raw = await prisma.event.findUnique({
      where: { id },
      include: {
        categories: true,
        tasks: { orderBy: { dueDate: "asc" } },
        vendors: true,
      },
    });

    if (!raw && id.startsWith("demo_")) {
      const { getDemoEventData } = await import("@/lib/data/seed-data");
      const seeded = await this.create(getDemoEventData());
      if (seeded.id === id) return seeded;
    }

    if (!raw) return null;

    return {
      ...this.mapEvent(raw),
      categories: raw.categories.map((c) => this.mapCategory(c)),
      tasks: raw.tasks.map((t) => this.mapTask(t)),
      vendors: raw.vendors.map((v) => this.mapVendor(v)),
    };
  }

  public async findFirst(): Promise<EventWithDetails | null> {
    await ensureInit();
    const raw = await prisma.event.findFirst({
      include: {
        categories: true,
        tasks: { orderBy: { dueDate: "asc" } },
        vendors: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!raw) {
      // Auto-seed on first run for zero-configuration evaluation
      const { getDemoEventData } = await import("@/lib/data/seed-data");
      return this.create(getDemoEventData());
    }

    return {
      ...this.mapEvent(raw),
      categories: raw.categories.map((c) => this.mapCategory(c)),
      tasks: raw.tasks.map((t) => this.mapTask(t)),
      vendors: raw.vendors.map((v) => this.mapVendor(v)),
    };
  }

  public async listAll(): Promise<EventModel[]> {
    await ensureInit();
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
    });
    return events.map((e) => this.mapEvent(e));
  }

  public async create(data: {
    event: EventModel;
    categories: BudgetCategoryModel[];
    tasks: TaskModel[];
    vendors: VendorModel[];
  }): Promise<EventWithDetails> {
    await ensureInit();
    const { event, categories, tasks, vendors } = data;

    const created = await prisma.event.create({
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
      include: {
        categories: true,
        tasks: { orderBy: { dueDate: "asc" } },
        vendors: true,
      },
    });

    return {
      ...this.mapEvent(created),
      categories: created.categories.map((c) => this.mapCategory(c)),
      tasks: created.tasks.map((t) => this.mapTask(t)),
      vendors: created.vendors.map((v) => this.mapVendor(v)),
    };
  }

  public async update(
    id: string,
    data: Partial<Omit<EventModel, "id" | "priorities">> & {
      priorities?: string[];
    }
  ): Promise<EventModel> {
    await ensureInit();
    const { priorities, date, ...rest } = data;
    const updatePayload: Prisma.EventUpdateInput = { ...rest };
    if (date) {
      updatePayload.date = new Date(`${date}T00:00:00Z`);
    }
    if (priorities) {
      updatePayload.priorities = JSON.stringify(priorities);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updatePayload,
    });

    return this.mapEvent(updated);
  }

  public async delete(id: string): Promise<void> {
    await ensureInit();
    await prisma.event.delete({ where: { id } });
  }

  public async updateCategory(
    eventId: string,
    categoryKey: string,
    data: { allocatedAmount?: number; committedAmount?: number; isManualOverride?: boolean; notes?: string | null }
  ): Promise<BudgetCategoryModel> {
    await ensureInit();
    const updated = await prisma.budgetCategory.update({
      where: {
        eventId_categoryKey: {
          eventId,
          categoryKey,
        },
      },
      data,
    });
    return this.mapCategory(updated);
  }

  public async updateTask(
    id: string,
    data: Partial<Omit<TaskModel, "id" | "eventId">>
  ): Promise<TaskModel> {
    await ensureInit();
    const { dependencyLinks, dueDate, ...rest } = data;
    const updatePayload: Prisma.TaskUpdateInput = { ...rest };
    if (dueDate) {
      updatePayload.dueDate = new Date(`${dueDate}T00:00:00Z`);
    }
    if (dependencyLinks) {
      updatePayload.dependencyLinks = JSON.stringify(dependencyLinks);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updatePayload,
    });
    return this.mapTask(updated);
  }

  public async updateVendor(
    id: string,
    data: Partial<Omit<VendorModel, "id" | "eventId">>
  ): Promise<VendorModel> {
    await ensureInit();
    const updated = await prisma.vendor.update({
      where: { id },
      data,
    });
    return this.mapVendor(updated);
  }

  public async createVendor(
    eventId: string,
    vendor: Omit<VendorModel, "id" | "eventId">
  ): Promise<VendorModel> {
    await ensureInit();
    const created = await prisma.vendor.create({
      data: {
        eventId,
        categoryKey: vendor.categoryKey,
        name: vendor.name,
        contact: vendor.contact,
        quoteAmount: vendor.quoteAmount,
        depositAmount: vendor.depositAmount,
        balanceDue: vendor.balanceDue,
        contractStatus: vendor.contractStatus,
        notes: vendor.notes,
      },
    });
    return this.mapVendor(created);
  }
}

export const eventRepository = new PrismaEventRepository();
