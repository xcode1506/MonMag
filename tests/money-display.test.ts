import { describe, expect, it } from "vitest";
import {
  CONVERTIBLE_CURRENCIES,
  convertMinorUnits,
  currencyScale,
  formatConvertedMoney,
  isCurrencyCode,
} from "@/lib/money";

describe("world currency metadata", () => {
  it("recognizes major world currencies with their minor-unit scales", () => {
    expect(isCurrencyCode("JPY")).toBe(true);
    expect(isCurrencyCode("CNY")).toBe(true);
    expect(isCurrencyCode("GBP")).toBe(true);
    expect(isCurrencyCode("INR")).toBe(true);
    expect(currencyScale("JPY")).toBe(0);
    expect(currencyScale("KRW")).toBe(0);
    expect(currencyScale("USD")).toBe(2);
    expect(currencyScale("BHD")).toBe(3);
  });

  it("exposes a stable display currency list for settings", () => {
    expect(CONVERTIBLE_CURRENCIES).toContain("IDR");
    expect(CONVERTIBLE_CURRENCIES).toContain("USD");
    expect(CONVERTIBLE_CURRENCIES).toContain("JPY");
    expect(CONVERTIBLE_CURRENCIES.length).toBeGreaterThanOrEqual(20);
  });
});

describe("display-only reference-rate conversion", () => {
  it("converts IDR ledger minor units into USD display minor units", () => {
    // IDR has no minor unit (scale 0); 1 USD = 16,000 IDR, so 16,000 minor
    // units of IDR are 1.00 USD = 100 USD cents.
    expect(convertMinorUnits(16_000n, "IDR", "USD")).toBe(100n);
    expect(convertMinorUnits(8_000n, "IDR", "USD")).toBe(50n);
  });

  it("converts between two non-base currencies through USD", () => {
    // Rates are units per 1 USD: 1 USD = 0.80 EUR and 1 USD = 0.50 GBP,
    // so 1 EUR = 1.25 USD = 0.625 GBP (62.5 GBP minor units, rounded up).
    expect(convertMinorUnits(100n, "EUR", "USD")).toBe(125n);
    expect(convertMinorUnits(100n, "EUR", "GBP")).toBe(63n);
  });

  it("respects source and target minor-unit scales", () => {
    // 1 USD = 150 JPY; JPY has scale 0 and USD has scale 2.
    expect(convertMinorUnits(100n, "USD", "JPY")).toBe(150n);
    expect(convertMinorUnits(150n, "JPY", "USD")).toBe(100n);
  });

  it("rounds half away from zero and preserves sign", () => {
    expect(convertMinorUnits(-16_000n, "IDR", "USD")).toBe(-100n);
    expect(convertMinorUnits(24_000n, "IDR", "USD")).toBe(150n);
  });

  it("returns amounts unchanged when currencies match", () => {
    expect(convertMinorUnits(123456n, "USD", "USD")).toBe(123456n);
  });

  it("falls back to the source currency for unknown codes", () => {
    expect(convertMinorUnits(500n, "XYZ", "USD")).toBe(500n);
    expect(convertMinorUnits(500n, "USD", "XYZ")).toBe(500n);
  });

  it("formats a converted amount with the requested locale", () => {
    expect(formatConvertedMoney(16_000n, "IDR", "USD", "en-US")).toMatch(
      /1\.00/,
    );
    expect(formatConvertedMoney(16_000n, "IDR", "USD", "de-DE")).toMatch(
      /1,00/,
    );
  });
});
