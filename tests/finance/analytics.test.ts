import { describe, expect, it } from "vitest";
import {
  cashflowSummary,
  categoryTotals,
  monthlyCashflow,
  runningBalance,
  type DatedLedgerEntry,
} from "@/lib/finance/analytics";

const date = (iso: string) => new Date(iso);

const entry = (
  overrides: Partial<DatedLedgerEntry> & Pick<DatedLedgerEntry, "type" | "amount">,
): DatedLedgerEntry => ({
  transactionDate: date("2024-01-01T00:00:00.000Z"),
  deletedAt: null,
  categoryId: null,
  ...overrides,
});

describe("cashflowSummary", () => {
  it("sums active income and expense entries and ignores transfers", () => {
    const summary = cashflowSummary([
      entry({ type: "INCOME", amount: 200n }),
      entry({ type: "EXPENSE", amount: 50n }),
      entry({ type: "TRANSFER", amount: 999n }),
      entry({ type: "INCOME", amount: 1_000n, deletedAt: date("2024-02-01T00:00:00.000Z") }),
    ]);

    expect(summary).toEqual({
      income: 200n,
      expense: 50n,
      net: 150n,
      savingsRate: 75,
    });
  });

  it("uses a zero savings rate when there is no income", () => {
    expect(cashflowSummary([entry({ type: "EXPENSE", amount: 10n })])).toEqual({
      income: 0n,
      expense: 10n,
      net: -10n,
      savingsRate: 0,
    });
  });

  it("rounds the savings rate to one decimal", () => {
    expect(
      cashflowSummary([
        entry({ type: "INCOME", amount: 3n }),
        entry({ type: "EXPENSE", amount: 1n }),
      ]).savingsRate,
    ).toBe(66.7);
  });

  it("returns zeroes for an empty ledger", () => {
    expect(cashflowSummary([])).toEqual({
      income: 0n,
      expense: 0n,
      net: 0n,
      savingsRate: 0,
    });
  });
});

describe("categoryTotals", () => {
  it("aggregates the requested type by category and sorts descending", () => {
    const totals = categoryTotals(
      [
        entry({ type: "EXPENSE", amount: 30n, categoryId: "food" }),
        entry({ type: "EXPENSE", amount: 20n, categoryId: "food" }),
        entry({ type: "EXPENSE", amount: 40n, categoryId: "rent" }),
        entry({ type: "EXPENSE", amount: 100n, categoryId: "food", deletedAt: date("2024-02-01T00:00:00.000Z") }),
        entry({ type: "INCOME", amount: 999n, categoryId: "food" }),
        entry({ type: "EXPENSE", amount: 10n, categoryId: null }),
      ],
      "EXPENSE",
    );

    expect(totals).toEqual([
      { categoryId: "food", total: 50n },
      { categoryId: "rent", total: 40n },
    ]);
  });

  it("returns an empty list when no entries qualify", () => {
    expect(categoryTotals([], "INCOME")).toEqual([]);
    expect(
      categoryTotals([entry({ type: "EXPENSE", amount: 10n, categoryId: "food" })], "INCOME"),
    ).toEqual([]);
  });

  it("preserves insertion order for equal totals", () => {
    expect(
      categoryTotals(
        [
          entry({ type: "INCOME", amount: 10n, categoryId: "a" }),
          entry({ type: "INCOME", amount: 10n, categoryId: "b" }),
        ],
        "INCOME",
      ),
    ).toEqual([
      { categoryId: "a", total: 10n },
      { categoryId: "b", total: 10n },
    ]);
  });
});

describe("monthlyCashflow", () => {
  it("buckets by UTC month, sorts chronologically and skips deleted entries", () => {
    const result = monthlyCashflow([
      entry({
        type: "INCOME",
        amount: 100n,
        transactionDate: date("2024-02-05T00:00:00.000Z"),
      }),
      entry({
        type: "EXPENSE",
        amount: 30n,
        transactionDate: date("2024-01-10T00:00:00.000Z"),
      }),
      entry({
        type: "INCOME",
        amount: 200n,
        transactionDate: date("2024-01-20T00:00:00.000Z"),
      }),
      entry({
        type: "INCOME",
        amount: 500n,
        transactionDate: date("2024-03-01T00:00:00.000Z"),
        deletedAt: date("2024-03-02T00:00:00.000Z"),
      }),
    ]);

    expect(result).toEqual([
      { month: "2024-01", income: 200n, expense: 30n, net: 170n },
      { month: "2024-02", income: 100n, expense: 0n, net: 100n },
    ]);
  });

  it("includes months that only contain transfers as zero-value summaries", () => {
    expect(
      monthlyCashflow([
        entry({
          type: "TRANSFER",
          amount: 50n,
          transactionDate: date("2024-04-01T00:00:00.000Z"),
        }),
      ]),
    ).toEqual([{ month: "2024-04", income: 0n, expense: 0n, net: 0n }]);
  });
});

describe("runningBalance", () => {
  it("sorts by date, applies the starting balance and ignores deleted entries", () => {
    const jan1 = date("2024-01-01T00:00:00.000Z");
    const jan2 = date("2024-01-02T00:00:00.000Z");
    const jan3 = date("2024-01-03T00:00:00.000Z");

    const result = runningBalance(
      [
        entry({ type: "EXPENSE", amount: 30n, transactionDate: jan2 }),
        entry({ type: "TRANSFER", amount: 999n, transactionDate: jan3 }),
        entry({ type: "INCOME", amount: 100n, transactionDate: jan1 }),
        entry({
          type: "EXPENSE",
          amount: 500n,
          transactionDate: jan2,
          deletedAt: date("2024-02-01T00:00:00.000Z"),
        }),
      ],
      10n,
    );

    expect(result).toEqual([
      { date: jan1, balance: 110n },
      { date: jan2, balance: 80n },
      { date: jan3, balance: 80n },
    ]);
  });

  it("defaults the starting balance to zero", () => {
    expect(runningBalance([])).toEqual([]);
    expect(
      runningBalance([
        entry({ type: "INCOME", amount: 5n, transactionDate: date("2024-01-01T00:00:00.000Z") }),
      ]),
    ).toEqual([
      { date: date("2024-01-01T00:00:00.000Z"), balance: 5n },
    ]);
  });
});
