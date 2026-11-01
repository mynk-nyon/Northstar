/**
 * Formatting helpers for currency, percentages, and dates.
 */

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString()}`;
  }
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day));
      return d.toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}
