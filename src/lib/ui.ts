import { formatDate } from "@/lib/date";
import { localeOf, localeTag, t, type Locale, type TranslationKey } from "@/lib/i18n";
import {
  convertMinorUnits,
  formatMoney,
  fromMinorUnits,
  isCurrencyCode,
  toMinorUnits,
} from "@/lib/money";

export { localeOf };

type Tone = "default" | "brand" | "positive" | "negative" | "warning" | "outline";

/**
 * Format an amount for display.
 *
 * - `bigint` values are already integer minor units (database values and
 *   server-side aggregates), so they are passed through unchanged.
 * - `string` and `number` values are human-readable major units such as the
 *   decimal strings produced by `amountInput()` for form defaults. They are
 *   converted with the source currency scale so a scale-2 amount is not
 *   shrunk 100x.
 * - `displayCurrency` applies static reference-rate conversion for display
 *   only. Stored amounts and account currencies are never changed.
 */
export function money(
  value: bigint | string | number,
  currency = "IDR",
  locale: Locale = "id",
  displayCurrency?: string,
): string {
  const source = isCurrencyCode(currency) ? currency.toUpperCase() : "IDR";
  const target =
    displayCurrency && isCurrencyCode(displayCurrency)
      ? displayCurrency.toUpperCase()
      : source;
  const minor =
    typeof value === "bigint" ? value : toMinorUnits(value, source);
  const displayed = convertMinorUnits(minor, source, target);
  return formatMoney(displayed, target, localeTag(localeOf(locale)));
}

/** Format a date in the user's locale and timezone. */
export function date(
  value: Date | string,
  locale: Locale = "id",
  timeZone = "Asia/Jakarta",
): string {
  return formatDate(value, locale, timeZone);
}

/** BigInt cannot cross the server/client boundary, so expose amounts as decimal strings. */
export function amountInput(value: bigint, currency = "IDR"): string {
  return fromMinorUnits(value, currency);
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const LABEL_KEYS: Record<string, TranslationKey> = {
  INCOME: "transactions.income",
  EXPENSE: "transactions.expense",
  TRANSFER: "transactions.transfer",
  CASH: "form.cash",
  BANK: "form.bank",
  EWALLET: "form.eWallet",
  SAVINGS: "form.savings",
  CREDIT_CARD: "form.creditCard",
  OTHER: "form.other",
  WEEKLY: "form.weekly",
  MONTHLY: "form.monthly",
  YEARLY: "form.yearly",
  CUSTOM: "form.custom",
  DAILY: "form.daily",
  ACTIVE: "common.active",
  COMPLETED: "goals.completed",
  ARCHIVED: "common.archived",
  BUDGET_WARNING: "budgets.warning",
  BUDGET_EXCEEDED: "budgets.exceeded",
  RECURRING_UPCOMING: "notifications.recurringDue",
  DEBT_UPCOMING: "notifications.debtDue",
  SAVINGS_MILESTONE: "notifications.savingsMilestone",
  MONTHLY_SUMMARY: "notifications.monthlySummary",
  SYSTEM: "form.system",
  system: "form.system",
  light: "form.light",
  dark: "form.dark",
};

/** Human-readable label for stored enum values and common string values. */
export function label(value: string, locale: Locale = "id"): string {
  const key = LABEL_KEYS[value];
  return key ? t(localeOf(locale), key) : value;
}

const tones: Record<string, Tone> = {
  INCOME: "positive",
  EXPENSE: "negative",
  TRANSFER: "brand",
  ACTIVE: "positive",
  COMPLETED: "positive",
  ARCHIVED: "default",
  BUDGET_WARNING: "warning",
  BUDGET_EXCEEDED: "negative",
  RECURRING_UPCOMING: "brand",
  DEBT_UPCOMING: "negative",
  SAVINGS_MILESTONE: "positive",
  MONTHLY_SUMMARY: "brand",
  SYSTEM: "default",
};

export function tone(value: string): Tone {
  return tones[value] ?? "default";
}

export function percent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}%`;
}
