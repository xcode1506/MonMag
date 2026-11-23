import { describe, expect, it } from "vitest";
import type { BudgetPeriod, Frequency } from "@/generated/prisma/enums";
import {
  APP_TIMEZONE,
  DATE_FORMAT,
  formatDate,
  formatDateTime,
  formatMonth,
  nextOccurrence,
  parseDateInput,
  periodRange,
  toDateInput,
  todayInAppTimezone,
} from "@/lib/date";

const utc = (iso: string) => new Date(iso);

const expectLocalDate = (value: Date, year: number, month: number, day: number) => {
  expect(value.getFullYear()).toBe(year);
  expect(value.getMonth()).toBe(month - 1);
  expect(value.getDate()).toBe(day);
};

describe("parseDateInput", () => {
  it("parses DD/MM/YYYY into UTC midnight", () => {
    expect(parseDateInput("31/12/2024")?.toISOString()).toBe(
      "2024-12-31T00:00:00.000Z",
    );
    expect(parseDateInput(" 01/02/2024 ")?.toISOString()).toBe(
      "2024-02-01T00:00:00.000Z",
    );
  });

  it("parses ISO strings by taking the date portion only", () => {
    expect(parseDateInput("2024-01-15T22:30:00Z")?.toISOString()).toBe(
      "2024-01-15T00:00:00.000Z",
    );
  });

  it("returns null for a well-formed ISO prefix with an invalid date", () => {
    expect(parseDateInput("2024-13-40")).toBeNull();
  });

  it.each(["", "2024/01/15", "15-01-2024", "not-a-date"])(
    "returns null for unsupported input %j",
    (input) => {
      expect(parseDateInput(input)).toBeNull();
    },
  );
});

describe("date formatting helpers", () => {
  it("exposes the application timezone and display format", () => {
    expect(APP_TIMEZONE).toBe("Asia/Jakarta");
    expect(DATE_FORMAT).toBe("DD/MM/YYYY");
  });

  it("converts dates and strings to the app-local date input value", () => {
    expect(toDateInput(utc("2024-01-01T00:00:00.000Z"))).toBe("2024-01-01");
    expect(toDateInput("2024-01-01T20:00:00.000Z")).toBe("2024-01-02");
  });

  it("formats dates in the requested locale", () => {
    expect(formatDate(utc("2024-01-02T00:00:00.000Z"))).toBe("02/01/2024");
    expect(formatDate(utc("2024-01-02T00:00:00.000Z"), "en")).toBe("02/01/2024");
    expect(formatDate("2024-01-02T00:00:00.000Z")).toBe("02/01/2024");
  });

  it("formats date times using the app timezone", () => {
    const formatted = formatDateTime(utc("2024-01-02T00:30:00.000Z"));
    expect(formatted).toMatch(/02\/01\/2024/);
    expect(formatted).toMatch(/07[.:]30/);
    expect(formatDateTime(utc("2024-01-02T00:30:00.000Z"), "en")).toMatch(
      /02\/01\/2024/,
    );
    expect(formatDateTime("2024-01-02T00:30:00.000Z")).toMatch(/02\/01\/2024/);
  });

  it("formats months in Indonesian and English", () => {
    const date = utc("2024-01-15T00:00:00.000Z");
    expect(formatMonth(date)).toBe("Januari 2024");
    expect(formatMonth(date, "en")).toBe("January 2024");
    expect(formatMonth("2024-01-15T00:00:00.000Z")).toBe("Januari 2024");
  });

  it("returns today as a UTC-midnight Date", () => {
    const today = todayInAppTimezone();
    expect(today.getUTCHours()).toBe(0);
    expect(today.getUTCMinutes()).toBe(0);
    expect(today.getUTCSeconds()).toBe(0);
    expect(today.getUTCFullYear()).toBeGreaterThanOrEqual(2024);
  });
});

describe("periodRange", () => {
  const reference = utc("2024-01-03T12:00:00.000Z");

  it("returns a Monday-to-Sunday week", () => {
    const range = periodRange("WEEKLY", reference);
    expectLocalDate(range.start, 2024, 1, 1);
    expectLocalDate(range.end, 2024, 1, 7);
  });

  it("returns calendar year boundaries", () => {
    const range = periodRange("YEARLY", reference);
    expectLocalDate(range.start, 2024, 1, 1);
    expectLocalDate(range.end, 2024, 12, 31);
  });

  it("uses custom end when provided and end of month otherwise", () => {
    const customEnd = utc("2024-01-20T00:00:00.000Z");
    expect(periodRange("CUSTOM", reference, customEnd).end).toBe(customEnd);
    expectLocalDate(periodRange("CUSTOM", reference).end, 2024, 1, 31);
    expectLocalDate(periodRange("CUSTOM", reference).start, 2024, 1, 3);
  });

  it("defaults to the current month for monthly and unknown periods", () => {
    const february = utc("2024-02-10T12:00:00.000Z");
    expectLocalDate(periodRange("MONTHLY", february).start, 2024, 2, 1);
    expectLocalDate(periodRange("MONTHLY", february).end, 2024, 2, 29);
    expectLocalDate(
      periodRange("UNKNOWN" as BudgetPeriod, february).start,
      2024,
      2,
      1,
    );
  });
});

describe("nextOccurrence", () => {
  const previous = utc("2024-01-01T00:00:00.000Z");
  const after = utc("2024-01-20T00:00:00.000Z");

  it.each([
    ["DAILY", "2024-01-21T00:00:00.000Z"],
    ["WEEKLY", "2024-01-22T00:00:00.000Z"],
    ["MONTHLY", "2024-02-01T00:00:00.000Z"],
    ["YEARLY", "2025-01-01T00:00:00.000Z"],
    ["CUSTOM", "2024-01-21T00:00:00.000Z"],
  ] as const)("advances a %s schedule past the reference date", (frequency, expected) => {
    expect(
      nextOccurrence(previous, frequency as Frequency, 1, after).toISOString(),
    ).toBe(expected);
  });

  it("honors the interval and clamps non-positive intervals to one", () => {
    expect(
      nextOccurrence(previous, "DAILY", 3, utc("2024-01-05T00:00:00.000Z")).toISOString(),
    ).toBe("2024-01-07T00:00:00.000Z");
    expect(
      nextOccurrence(previous, "DAILY", 0, utc("2024-01-05T00:00:00.000Z")).toISOString(),
    ).toBe("2024-01-06T00:00:00.000Z");
  });

  it("uses today as the default reference date", () => {
    const result = nextOccurrence(previous, "YEARLY");
    expect(result.valueOf()).toBeGreaterThan(todayInAppTimezone().valueOf());
  });

  it("stops after the iteration guard is reached", () => {
    const result = nextOccurrence(
      utc("1970-01-01T00:00:00.000Z"),
      "DAILY",
      1,
      utc("2100-01-01T00:00:00.000Z"),
    );
    expect(result.valueOf()).toBeGreaterThan(utc("1970-01-01T00:00:00.000Z").valueOf());
    expect(result.valueOf()).toBeLessThan(utc("2100-01-01T00:00:00.000Z").valueOf());
  });
});
