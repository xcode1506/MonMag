import { describe, expect, it } from "vitest";
import {
  absMoney,
  currencyScale,
  formatMoney,
  fromMinorUnits,
  isCurrencyCode,
  normalizeDecimalInput,
  percentOf,
  ratioOf,
  sumMoney,
  toMinorUnits,
} from "@/lib/money";

describe("currency metadata", () => {
  it("recognizes supported currencies", () => {
    expect(isCurrencyCode("IDR")).toBe(true);
    expect(isCurrencyCode("USD")).toBe(true);
    expect(isCurrencyCode("JPY")).toBe(true);
  });

  it("uses the currency scale and falls back to two decimals", () => {
    expect(currencyScale("IDR")).toBe(0);
    expect(currencyScale("EUR")).toBe(2);
    expect(currencyScale("UNKNOWN")).toBe(2);
  });
});

describe("normalizeDecimalInput", () => {
  it.each([
    ["Rp 1.250,50", "1250.50"],
    ["1,250.50", "1250.50"],
    ["-500", "-500"],
    ["1,234", "1234"],
    ["1.234", "1234"],
    ["1,23", "1.23"],
    ["00012.30", "12.30"],
    ["1.23456789", "1.234567"],
    ["-0.00", "0.00"],
    [".50", "0.50"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeDecimalInput(input)).toBe(expected);
  });

  it.each(["", "   ", "abc", "Rp "])("returns zero for non-numeric input %j", (input) => {
    expect(normalizeDecimalInput(input)).toBe("0");
  });
});

describe("toMinorUnits", () => {
  it("stores IDR as whole rupiah", () => {
    expect(toMinorUnits("1.234")).toBe(1234n);
    expect(toMinorUnits(123n)).toBe(123n);
    expect(toMinorUnits(0n)).toBe(0n);
  });

  it("stores two-decimal currencies using localized separators", () => {
    expect(toMinorUnits("1,234.50", "USD")).toBe(123450n);
    expect(toMinorUnits("Rp 1.250,50", "EUR")).toBe(125050n);
    expect(toMinorUnits(12.34, "SGD")).toBe(1234n);
  });

  it("rounds the first discarded digit away from zero", () => {
    expect(toMinorUnits("1.2349", "USD")).toBe(123n);
    expect(toMinorUnits("1.2350", "USD")).toBe(124n);
    expect(toMinorUnits("-1.2350", "USD")).toBe(-124n);
    expect(toMinorUnits("1.5", "IDR")).toBe(2n);
  });

  it("stores zero-decimal currencies as whole units", () => {
    expect(toMinorUnits("9.99", "JPY")).toBe(10n);
    expect(toMinorUnits("9.49", "JPY")).toBe(9n);
  });

  it("falls back to a two-decimal scale for unknown currencies", () => {
    expect(toMinorUnits("9.99", "XYZ")).toBe(999n);
  });
});

describe("fromMinorUnits", () => {
  it("renders whole and fractional currencies without separators", () => {
    expect(fromMinorUnits(1234n)).toBe("1234");
    expect(fromMinorUnits(123456n, "USD")).toBe("1234.56");
    expect(fromMinorUnits(0n, "USD")).toBe("0.00");
  });

  it("preserves negative values and unknown-currency scale", () => {
    expect(fromMinorUnits(-50n, "USD")).toBe("-0.50");
    expect(fromMinorUnits(-1234n)).toBe("-1234");
    expect(fromMinorUnits(123n, "JPY")).toBe("123");
    expect(fromMinorUnits(123n, "XYZ")).toBe("1.23");
  });
});

describe("formatMoney", () => {
  it("formats currency using the requested locale", () => {
    expect(formatMoney(1234500n)).toMatch(/1\.234\.500/);
    expect(formatMoney(123456n, "USD", "en-US")).toMatch(/1,234\.56/);
  });

  it("supports compact and always-visible signs", () => {
    expect(formatMoney(1234500n, "IDR", "id-ID", { compact: true })).toMatch(/1/);
    expect(formatMoney(1000n, "IDR", "id-ID", { sign: true })).toMatch(/\+/);
  });
});

describe("money helpers", () => {
  it("sums signed BigInt values and handles an empty list", () => {
    expect(sumMoney([1n, -2n, 3n])).toBe(2n);
    expect(sumMoney([])).toBe(0n);
  });

  it("returns the absolute value", () => {
    expect(absMoney(42n)).toBe(42n);
    expect(absMoney(-42n)).toBe(42n);
    expect(absMoney(0n)).toBe(0n);
  });

  it("calculates percentages and ratios, including zero denominators", () => {
    expect(percentOf(25n, 200n)).toBe(12.5);
    expect(percentOf(150n, 100n)).toBe(150);
    expect(percentOf(5n, 0n)).toBe(0);
    expect(ratioOf(1n, 4n)).toBe(0.25);
    expect(ratioOf(1n, 0n)).toBe(0);
  });
});
