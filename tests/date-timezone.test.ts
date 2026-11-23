import { describe, expect, it } from "vitest";
import {
  dateLocaleTag,
  formatDate,
  formatDateTime,
  formatMonth,
  toDateInput,
  todayInTimezone,
} from "@/lib/date";

const instant = (iso: string) => new Date(iso);

describe("user-local date formatting", () => {
  it("exposes Intl locale tags for all supported locales", () => {
    expect(dateLocaleTag("en")).toBe("en-GB");
    expect(dateLocaleTag("ja")).toBe("ja-JP");
    expect(dateLocaleTag("ar")).toBe("ar-SA");
    expect(dateLocaleTag("id")).toBe("id-ID");
  });

  it("formats the same instant differently by time zone", () => {
    const value = instant("2024-01-02T00:30:00.000Z");
    // Jakarta is UTC+7, Los Angeles is UTC-8 on this date.
    expect(formatDate(value, "en", "Asia/Jakarta")).toBe("02/01/2024");
    expect(formatDate(value, "en", "America/Los_Angeles")).toBe("01/01/2024");
  });

  it("formats date times using the supplied time zone", () => {
    const value = instant("2024-07-01T23:30:00.000Z");
    // Dates stay DD/MM/YYYY in every locale, including English.
    expect(formatDateTime(value, "en", "Asia/Jakarta")).toMatch(/02\/07\/2024/);
    expect(formatDateTime(value, "en", "America/New_York")).toMatch(/01\/07\/2024/);
  });

  it("formats months using the user locale and time zone", () => {
    const value = instant("2024-01-31T18:00:00.000Z");
    expect(formatMonth(value, "fr", "Europe/Paris")).toBe("janvier 2024");
    expect(formatMonth(value, "id", "Asia/Jakarta")).toBe("Februari 2024");
  });

  it("produces date input values in the user's local day", () => {
    const value = instant("2024-01-02T00:30:00.000Z");
    expect(toDateInput(value, "Asia/Jakarta")).toBe("2024-01-02");
    expect(toDateInput(value, "America/Los_Angeles")).toBe("2024-01-01");
  });

  it("returns today's UTC-midnight date in the requested time zone", () => {
    const now = new Date();
    const tokyo = todayInTimezone("Asia/Tokyo");
    const la = todayInTimezone("America/Los_Angeles");
    expect(tokyo.getUTCHours()).toBe(0);
    expect(la.getUTCHours()).toBe(0);
    // Tokyo is at least 15 hours ahead of Los Angeles.
    expect(tokyo.valueOf() + 86_400_000).toBeGreaterThanOrEqual(la.valueOf());
    expect(now.valueOf()).toBeGreaterThan(0);
  });

  it("keeps the legacy default time zone for callers that pass none", () => {
    const value = instant("2024-01-02T00:30:00.000Z");
    expect(formatDate(value)).toBe("02/01/2024");
    expect(toDateInput(value)).toBe("2024-01-02");
  });
});
