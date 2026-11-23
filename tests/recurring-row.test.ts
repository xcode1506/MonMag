import { describe, expect, it } from "vitest";
import { money } from "@/lib/ui";
import { toRecurringRow } from "@/lib/view-models/recurring";

describe("recurring row view model", () => {
  const base = {
    id: "rule-1",
    title: "Subscription",
    type: "EXPENSE",
    amount: 1234n,
    accountId: "account-1",
    account: { name: "USD Wallet", currency: "USD" },
    categoryId: null,
    category: null,
    frequency: "MONTHLY",
    interval: 1,
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: null,
    nextRun: new Date("2026-02-01T00:00:00.000Z"),
    active: true,
  };

  it("carries the account currency with a recurring row", () => {
    const row = toRecurringRow(base, "IDR");

    expect(row.amount).toBe("12.34");
    expect(row.accountCurrency).toBe("USD");
    expect(money(row.amount, row.accountCurrency, "en")).toBe("$12.34");
  });

  it("falls back to the preferred currency when the account is unavailable", () => {
    const row = toRecurringRow({ ...base, account: null }, "IDR");

    expect(row.accountName).toBe("Unknown account");
    expect(row.accountCurrency).toBe("IDR");
    expect(row.amount).toBe("1234");
  });
});
