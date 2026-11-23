import { describe, expect, it } from "vitest";
import { endOfInputDate, parseDateInput } from "@/lib/date";

describe("endOfInputDate", () => {
  it("expands a UTC-midnight input date to the inclusive end of that day", () => {
    const start = parseDateInput("23/11/2026");
    expect(start?.toISOString()).toBe("2026-11-23T00:00:00.000Z");
    expect(endOfInputDate(start!).toISOString()).toBe(
      "2026-11-23T23:59:59.999Z",
    );
  });

  it("includes transactions recorded later on the selected end date", () => {
    const end = endOfInputDate(parseDateInput("23/11/2026")!);
    expect(new Date("2026-11-23T20:15:00.000Z") <= end).toBe(true);
    expect(new Date("2026-11-24T00:00:00.000Z") <= end).toBe(false);
  });
});
