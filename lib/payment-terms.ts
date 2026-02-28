export const PAYMENT_TERMS_STORAGE_KEY = "fabsystem_payment_terms_days";

export function normalizePaymentTermsDays(value: unknown): 0 | 30 {
  if (value === 0 || value === "0") {
    return 0;
  }

  return 30;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
