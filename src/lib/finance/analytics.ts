import { sumMoney } from "@/lib/money";
import type { LedgerEntry } from "./balances";

export interface DatedLedgerEntry extends LedgerEntry {
  transactionDate: Date;
  categoryId?: string | null;
}

export function cashflowSummary(entries: readonly DatedLedgerEntry[]): {
  income: bigint;
  expense: bigint;
  net: bigint;
  savingsRate: number;
} {
  const active = entries.filter((entry) => !entry.deletedAt);
  const income = sumMoney(
    active.filter((entry) => entry.type === "INCOME").map((entry) => entry.amount),
  );
  const expense = sumMoney(
    active.filter((entry) => entry.type === "EXPENSE").map((entry) => entry.amount),
  );
  const net = income - expense;
  const savingsRate = income === 0n ? 0 : (Number(net) / Number(income)) * 100;
  return { income, expense, net, savingsRate: Math.round(savingsRate * 10) / 10 };
}

export function categoryTotals(
  entries: readonly DatedLedgerEntry[],
  type: "INCOME" | "EXPENSE",
): Array<{ categoryId: string; total: bigint }> {
  const totals = new Map<string, bigint>();
  for (const entry of entries) {
    if (entry.deletedAt || entry.type !== type || !entry.categoryId) continue;
    totals.set(
      entry.categoryId,
      (totals.get(entry.categoryId) ?? 0n) + entry.amount,
    );
  }
  return [...totals.entries()]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => (a.total < b.total ? 1 : a.total > b.total ? -1 : 0));
}

export function monthlyCashflow(entries: readonly DatedLedgerEntry[]): Array<{
  month: string;
  income: bigint;
  expense: bigint;
  net: bigint;
}> {
  const months = new Map<string, DatedLedgerEntry[]>();
  for (const entry of entries) {
    if (entry.deletedAt) continue;
    const key = `${entry.transactionDate.getUTCFullYear()}-${String(
      entry.transactionDate.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const bucket = months.get(key) ?? [];
    bucket.push(entry);
    months.set(key, bucket);
  }
  return [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, items]) => {
      const summary = cashflowSummary(items);
      return {
        month,
        income: summary.income,
        expense: summary.expense,
        net: summary.net,
      };
    });
}

export function runningBalance(
  entries: readonly DatedLedgerEntry[],
  startingBalance = 0n,
): Array<{ date: Date; balance: bigint }> {
  const sorted = [...entries]
    .filter((entry) => !entry.deletedAt)
    .sort((a, b) => a.transactionDate.valueOf() - b.transactionDate.valueOf());
  let balance = startingBalance;
  return sorted.map((entry) => {
    balance +=
      entry.type === "INCOME" ? entry.amount : entry.type === "EXPENSE" ? -entry.amount : 0n;
    return { date: entry.transactionDate, balance };
  });
}
