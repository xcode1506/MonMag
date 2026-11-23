import { describe, expect, it } from "vitest";
import { toMinorUnits } from "@/lib/money";
import {
  amountInput,
  date,
  initials,
  label,
  localeOf,
  money,
  percent,
  tone,
} from "@/lib/ui";

const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "MYR"] as const;

describe("money display scaling", () => {
  it("still formats server aggregates passed as bigint minor units", () => {
    expect(money(123456n, "USD", "en")).toBe("$1,234.56");
    expect(money(1234500n, "IDR", "id")).toMatch(/1\.234\.500/);
  });

  it("treats major-unit decimal strings as human amounts, not minor units", () => {
    expect(money("1234500.00", "USD", "en")).toBe("$1,234,500.00");
    expect(money("12.34", "EUR", "en")).toMatch(/12\.34/);
  });

  it.each(CURRENCIES)(
    "renders a form default identically to its stored minor units for %s",
    (currency) => {
      const stored = toMinorUnits("1234.56", currency);
      expect(money(amountInput(stored, currency), currency, "en")).toBe(
        money(stored, currency, "en"),
      );
    },
  );

  it.each(CURRENCIES)(
    "round-trips edit-dialog defaults back to the stored amount for %s",
    (currency) => {
      for (const major of ["0", "12.34", "1234500", "-45.67"]) {
        const stored = toMinorUnits(major, currency);
        const formDefault = amountInput(stored, currency);
        expect(toMinorUnits(formDefault, currency)).toBe(stored);
      }
    },
  );

  it("handles the numeric values produced by chart formatters", () => {
    expect(money(Number(amountInput(123456n, "USD")), "USD", "en")).toBe(
      "$1,234.56",
    );
    expect(money(0, "IDR", "en")).toMatch(/0/);
  });
});

describe("ui helpers", () => {
  it("resolves every supported locale", () => {
    expect(localeOf("id")).toBe("id");
    expect(localeOf("en")).toBe("en");
    expect(localeOf("fr")).toBe("fr");
    expect(localeOf("zh-CN")).toBe("zh");
    expect(localeOf(null)).toBe("en");
  });

  it("formats money with the selected locale", () => {
    expect(money(123456n, "USD", "de")).toContain("1.234,56");
    expect(money(123456n, "USD", "fr")).toMatch(/1[\s\u202f\u00a0]234,56/);
  });

  it("converts money for display without changing the stored amount", () => {
    expect(money(16_000n, "IDR", "en", "USD")).toBe("$1.00");
    expect(money(100n, "EUR", "en", "GBP")).toBe("£0.63");
    expect(money(16_000n, "IDR", "en", "IDR")).toMatch(/16,000/);
  });

  it("formats dates and initials in the user's timezone", () => {
    expect(date("2026-11-23T00:00:00.000Z", "en")).toBe("23/11/2026");
    expect(date("2024-07-02T00:30:00.000Z", "en", "America/New_York")).toBe(
      "01/07/2024",
    );
    expect(initials(" Alice Wonderland ")).toBe("AW");
    expect(initials("Bob")).toBe("B");
    expect(initials("  ")).toBe("");
  });

  it("translates known labels and tones and passes unknown values through", () => {
    expect(label("INCOME", "id")).toBe("Pemasukan");
    expect(label("INCOME", "en")).toBe("Income");
    expect(label("CUSTOM_VALUE", "en")).toBe("CUSTOM_VALUE");
    expect(tone("EXPENSE")).toBe("negative");
    expect(tone("UNKNOWN")).toBe("default");
    expect(percent(12.34)).toBe("12.3%");
    expect(percent(0)).toBe("0%");
  });
});
