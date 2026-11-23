import { describe, expect, it } from "vitest";
import { accountBalance, netWorth, type LedgerEntry } from "@/lib/finance/balances";

const entry = (
  type: LedgerEntry["type"],
  amount: bigint,
  deletedAt: Date | null = null,
): LedgerEntry => ({ type, amount, deletedAt });

describe("accountBalance", () => {
  it("combines opening balance, income, expenses and transfers", () => {
    const balance = accountBalance({
      initialBalance: 100n,
      transactions: [
        entry("INCOME", 50n),
        entry("EXPENSE", 20n),
        entry("TRANSFER", 999n),
        entry("INCOME", 1_000n, new Date("2024-01-01T00:00:00.000Z")),
      ],
      transferredOut: [30n],
      transferredIn: [10n],
    });

    expect(balance).toBe(110n);
  });

  it("handles empty ledgers, zero amounts and negative balances", () => {
    expect(
      accountBalance({
        initialBalance: -50n,
        transactions: [],
        transferredOut: [],
        transferredIn: [],
      }),
    ).toBe(-50n);
    expect(
      accountBalance({
        initialBalance: 0n,
        transactions: [entry("INCOME", 0n), entry("EXPENSE", 0n)],
        transferredOut: [],
        transferredIn: [],
      }),
    ).toBe(0n);
  });

  it("ignores deleted transactions regardless of their amount", () => {
    expect(
      accountBalance({
        initialBalance: 10n,
        transactions: [
          entry("INCOME", 100n, new Date()),
          entry("EXPENSE", 70n, new Date()),
        ],
        transferredOut: [],
        transferredIn: [],
      }),
    ).toBe(10n);
  });
});

describe("netWorth", () => {
  it("treats credit cards and negative balances as liabilities", () => {
    const result = netWorth([
      { balance: 100n, type: "CASH" },
      { balance: -30n, type: "BANK" },
      { balance: 50n, type: "CREDIT_CARD" },
      { balance: 0n, type: "SAVINGS" },
      { balance: -20n, type: "CREDIT_CARD" },
      { balance: 70n, type: "EWALLET" },
    ]);

    expect(result).toEqual({ assets: 170n, liabilities: 100n, total: 70n });
  });

  it("returns zeroes for no accounts", () => {
    expect(netWorth([])).toEqual({ assets: 0n, liabilities: 0n, total: 0n });
  });
});
