import {
  CAPACITY_BREACH_THRESHOLD,
  CAPACITY_WARNING_THRESHOLD,
} from "@/lib/config/constants";
import { CapacityEvaluation } from "@/lib/domain/types";

/**
 * Pure evaluation function for venue capacity constraints.
 * Calculates utilization rate, flags safety warnings, and detects capacity breaches.
 *
 * @param guestCount - Planned or simulated number of guests
 * @param venueCapacity - Maximum allowed venue capacity, or null/undefined if unconstrained
 * @returns CapacityEvaluation containing utilization metrics and actionable messages
 */
export function evaluateCapacity(
  guestCount: number,
  venueCapacity?: number | null
): CapacityEvaluation {
  const safeGuestCount = Math.max(0, Math.round(guestCount));

  if (!venueCapacity || venueCapacity <= 0) {
    return {
      guestCount: safeGuestCount,
      venueCapacity: null,
      utilizationRate: null,
      isBreached: false,
      isNearCapacity: false,
      excessGuests: 0,
      remainingSeats: 0,
      safetyMarginPercentage: 100,
      warningMessage: null,
    };
  }

  const utilizationRate = Math.round((safeGuestCount / venueCapacity) * 1000) / 1000;
  const isBreached = safeGuestCount > venueCapacity;
  const isNearCapacity =
    !isBreached && utilizationRate >= CAPACITY_WARNING_THRESHOLD;

  const excessGuests = isBreached ? safeGuestCount - venueCapacity : 0;
  const remainingSeats = isBreached ? 0 : venueCapacity - safeGuestCount;
  const safetyMarginPercentage = isBreached
    ? 0
    : Math.round(((venueCapacity - safeGuestCount) / venueCapacity) * 1000) / 10;

  let warningMessage: string | null = null;
  if (isBreached) {
    warningMessage = `CRITICAL: Guest count (${safeGuestCount}) exceeds venue legal capacity (${venueCapacity}) by ${excessGuests} people. Fire code and venue insurance will be breached.`;
  } else if (isNearCapacity) {
    warningMessage = `WARNING: Guest count (${safeGuestCount}) is at ${Math.round(
      utilizationRate * 100
    )}% of venue capacity (${venueCapacity}). Only ${remainingSeats} seat(s) remain before fire limits.`;
  }

  return {
    guestCount: safeGuestCount,
    venueCapacity,
    utilizationRate,
    isBreached,
    isNearCapacity,
    excessGuests,
    remainingSeats,
    safetyMarginPercentage,
    warningMessage,
  };
}
