import {
  BudgetCategoryModel,
  EventModel,
  TaskModel,
  VendorModel,
} from "@/lib/domain/types";

export interface EventWithDetails extends EventModel {
  categories: BudgetCategoryModel[];
  tasks: TaskModel[];
  vendors: VendorModel[];
}

export interface IEventRepository {
  findById(id: string): Promise<EventWithDetails | null>;
  findFirst(): Promise<EventWithDetails | null>;
  listAll(): Promise<EventModel[]>;
  create(data: {
    event: EventModel;
    categories: BudgetCategoryModel[];
    tasks: TaskModel[];
    vendors: VendorModel[];
  }): Promise<EventWithDetails>;
  update(
    id: string,
    data: Partial<Omit<EventModel, "id" | "priorities">> & {
      priorities?: string[];
    }
  ): Promise<EventModel>;
  delete(id: string): Promise<void>;

  updateCategory(
    eventId: string,
    categoryKey: string,
    data: { allocatedAmount?: number; committedAmount?: number; isManualOverride?: boolean; notes?: string | null }
  ): Promise<BudgetCategoryModel>;

  updateTask(
    id: string,
    data: Partial<Omit<TaskModel, "id" | "eventId">>
  ): Promise<TaskModel>;

  updateVendor(
    id: string,
    data: Partial<Omit<VendorModel, "id" | "eventId">>
  ): Promise<VendorModel>;

  createVendor(
    eventId: string,
    vendor: Omit<VendorModel, "id" | "eventId">
  ): Promise<VendorModel>;
}
