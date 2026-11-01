import { z } from "zod";
import { CATEGORY_KEYS, EVENT_TYPES } from "@/lib/config/constants";

/**
 * Strict bounds on free-text user inputs to mitigate injection and buffer attacks.
 */
export const FreeTextSchema = z
  .string()
  .trim()
  .max(1000, "Input must not exceed 1000 characters")
  .refine(
    (val) => !/(<script|javascript:|eval\(|base64)/i.test(val),
    "Input contains prohibited script patterns"
  );

export const ShortTextSchema = z
  .string()
  .trim()
  .max(150, "Input must not exceed 150 characters");

export const CategoryKeySchema = z.enum(CATEGORY_KEYS);

export const EventTypeSchema = z.enum(EVENT_TYPES);

/**
 * Schema for Simulation consequence request.
 */
export const SimulateRequestSchema = z
  .object({
    eventId: ShortTextSchema.optional(),
    eventType: EventTypeSchema,
    originalGuestCount: z.number().int().min(1).max(10000),
    simulatedGuestCount: z.number().int().min(1).max(10000),
    originalBudget: z.number().min(0).max(10000000),
    simulatedBudget: z.number().min(0).max(10000000),
    venueCapacity: z.number().int().min(1).max(10000).nullable().optional(),
    priorities: z.array(CategoryKeySchema).max(20).optional(),
    userQuery: FreeTextSchema.optional(),
  })
  .strict();

export type SimulateRequest = z.infer<typeof SimulateRequestSchema>;

/**
 * Schema for LLM Simulation Narrative Output.
 */
export const SimulationNarrativeOutputSchema = z
  .object({
    headline: z.string().min(5).max(250),
    summaryNarrative: z.string().min(20).max(2000),
    categoryImpactAnalysis: z.string().min(10).max(2000),
    capacityAdvisory: z.string().min(5).max(1000),
    contingencyAdvisory: z.string().min(5).max(1000),
    recommendedAlternatives: z
      .array(
        z.object({
          alternativeId: z.string().max(100),
          actionableAdvice: z.string().min(5).max(500),
          tradeoffSummary: z.string().min(5).max(500),
          confidenceScore: z.number().min(0).max(100),
        })
      )
      .min(1)
      .max(5),
  })
  .strict();

/**
 * Schema for Vendor Draft Request.
 */
export const VendorDraftRequestSchema = z
  .object({
    eventType: EventTypeSchema,
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    location: ShortTextSchema,
    guestCount: z.number().int().min(1).max(10000),
    categoryKey: CategoryKeySchema,
    vendorName: ShortTextSchema,
    vendorContact: ShortTextSchema,
    budgetCeiling: z.number().min(0).max(10000000),
    currency: z.string().min(1).max(10).default("USD"),
    messageType: z.enum([
      "inquiry",
      "negotiation",
      "follow_up",
      "scope_adjustment",
    ]),
    specificQuestions: z.array(ShortTextSchema).max(10).optional(),
    notes: FreeTextSchema.optional(),
  })
  .strict();

export type VendorDraftRequest = z.infer<typeof VendorDraftRequestSchema>;

/**
 * Schema for Vendor Draft Output.
 */
export const VendorDraftOutputSchema = z
  .object({
    subject: z.string().min(5).max(200),
    body: z.string().min(20).max(3000),
    keyPointsHighlighted: z.array(z.string().max(200)).min(1).max(8),
    suggestedNegotiationLever: z.string().min(5).max(500),
  })
  .strict();

/**
 * Schema for Event Creation / Update from API.
 */
export const EventCreateSchema = z
  .object({
    title: ShortTextSchema,
    type: EventTypeSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    location: ShortTextSchema,
    guestCount: z.number().int().min(1).max(10000),
    totalBudget: z.number().min(100).max(10000000),
    currency: z.string().min(1).max(10).default("USD"),
    venueCapacity: z.number().int().min(1).max(10000).nullable().optional(),
    venueType: z.enum(["indoor", "outdoor", "hybrid"]).default("indoor"),
    venueHours: z.number().int().min(1).max(24).nullable().optional(),
    cateringRestrictions: FreeTextSchema.nullable().optional(),
    priorities: z.array(CategoryKeySchema).min(1).max(20),
    notes: FreeTextSchema.nullable().optional(),
  })
  .strict();

export const TaskUpdateSchema = z
  .object({
    title: ShortTextSchema.optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
    owner: ShortTextSchema.nullable().optional(),
    notes: FreeTextSchema.nullable().optional(),
  })
  .strict();

export const VendorUpdateSchema = z
  .object({
    name: ShortTextSchema.optional(),
    contact: ShortTextSchema.optional(),
    quoteAmount: z.number().min(0).optional(),
    depositAmount: z.number().min(0).optional(),
    balanceDue: z.number().min(0).optional(),
    contractStatus: z.enum([
      "contacted",
      "quoted",
      "negotiating",
      "contract_signed",
      "deposit_paid",
      "completed",
      "cancelled",
    ]).optional(),
    notes: FreeTextSchema.nullable().optional(),
  })
  .strict();
