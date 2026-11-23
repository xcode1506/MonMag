import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { BudgetPeriod, Frequency } from "@/generated/prisma/enums";
import { dateLocaleTag, type Locale } from "@/lib/i18n";

export { dateLocaleTag };

/** Legacy default for callers that do not yet supply the user's preference. */
export const APP_TIMEZONE = "Asia/Jakarta";
export const DATE_FORMAT = "DD/MM/YYYY";

/** Common IANA zones offered in preference forms; any valid zone is accepted. */
export const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Zurich",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Africa/Casablanca",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Ho_Chi_Minh",
  "Asia/Manila",
  "Asia/Kuala_Lumpur",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu",
] as const;

/** Parse DD/MM/YYYY (or ISO) into a UTC-midnight Date for stable storage. */
export function parseDateInput(value: string): Date | null {
  const slash = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (slash) {
    const [, day, month, year] = slash;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(date.valueOf()) ? null : date;
  }
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(value.trim());
  if (iso) {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    return Number.isNaN(date.valueOf()) ? null : date;
  }
  return null;
}

/**
 * Inclusive upper bound for an input date stored as UTC midnight.
 * `parseDateInput` returns `00:00:00Z`; a raw `lte` filter would drop every
 * transaction recorded later on the selected day.
 */
export function endOfInputDate(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999),
  );
}

function validZone(timeZone: string | null | undefined): string {
  return timeZone || APP_TIMEZONE;
}

export function toDateInput(
  date: Date | string,
  timeZone: string = APP_TIMEZONE,
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: validZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function formatDate(
  date: Date | string,
  locale: Locale = "id",
  timeZone: string = APP_TIMEZONE,
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(dateLocaleTag(locale), {
    timeZone: validZone(timeZone),
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

export function formatDateTime(
  date: Date | string,
  locale: Locale = "id",
  timeZone: string = APP_TIMEZONE,
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(dateLocaleTag(locale), {
    timeZone: validZone(timeZone),
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

export function formatMonth(
  date: Date | string,
  locale: Locale = "id",
  timeZone: string = APP_TIMEZONE,
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(dateLocaleTag(locale), {
    timeZone: validZone(timeZone),
    month: "long",
    year: "numeric",
  }).format(value);
}

/** Resolve the current calendar day in a time zone to a UTC-midnight Date. */
export function todayInTimezone(timeZone: string = APP_TIMEZONE): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: validZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "1";
  return new Date(Date.UTC(Number(get("year")), Number(get("month")) - 1, Number(get("day"))));
}

export function todayInAppTimezone(): Date {
  return todayInTimezone(APP_TIMEZONE);
}

export function periodRange(
  period: BudgetPeriod,
  reference: Date = todayInAppTimezone(),
  customEnd?: Date | null,
): { start: Date; end: Date } {
  switch (period) {
    case "WEEKLY":
      return {
        start: startOfWeek(reference, { weekStartsOn: 1 }),
        end: addDays(startOfWeek(reference, { weekStartsOn: 1 }), 6),
      };
    case "YEARLY":
      return { start: startOfYear(reference), end: endOfYear(reference) };
    case "CUSTOM":
      return { start: startOfDay(reference), end: customEnd ?? endOfMonth(reference) };
    case "MONTHLY":
    default:
      return { start: startOfMonth(reference), end: endOfMonth(reference) };
  }
}

/** Calculate the next run date for a recurring transaction. */
export function nextOccurrence(
  previous: Date,
  frequency: Frequency,
  interval = 1,
  after: Date = todayInAppTimezone(),
): Date {
  const step = Math.max(1, interval);
  let candidate = previous;
  let guard = 0;
  while (candidate <= after && guard < 10000) {
    switch (frequency) {
      case "DAILY":
        candidate = addDays(candidate, step);
        break;
      case "WEEKLY":
        candidate = addWeeks(candidate, step);
        break;
      case "MONTHLY":
        candidate = addMonths(candidate, step);
        break;
      case "YEARLY":
        candidate = addYears(candidate, step);
        break;
      case "CUSTOM":
      default:
        candidate = addDays(candidate, step);
        break;
    }
    guard += 1;
  }
  return candidate;
}

export const dateFnsIdLocale = idLocale;
