import { describe, expect, it } from "vitest";
import {
  rescaleAmountText,
  resolveAccountCurrency,
} from "@/lib/view-models/form-currency";

const accounts = [
  { value: "idr-cash", currency: "IDR" },
  { value: "usd-wallet", currency: "USD" },
];

describe("form amount currency", () => {
  it("follows the selected account instead of the preferred currency", () => {
    expect(resolveAccountCurrency(accounts, "usd-wallet", "IDR")).toBe("USD");
  });

  it("uses the preferred currency only when no account is selected", () => {
    expect(resolveAccountCurrency(accounts, undefined, "IDR")).toBe("IDR");
    expect(resolveAccountCurrency(accounts, "missing", "EUR")).toBe("EUR");
  });

  it("keeps the first account's currency as the new-form default", () => {
    expect(resolveAccountCurrency(accounts, accounts[0]?.value, "USD")).toBe("IDR");
  });

  it("rescales an entered amount when the account currency changes", () => {
    expect(rescaleAmountText("12.34", "USD", "IDR")).toBe("1234");
    expect(rescaleAmountText("1234", "IDR", "USD")).toBe("12.34");
    expect(rescaleAmountText("", "USD", "IDR")).toBe("");
  });
});
