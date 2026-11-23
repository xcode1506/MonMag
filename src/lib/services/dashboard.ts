import { todayInAppTimezone } from "@/lib/date";
import {
  cashflowSummary,
  categoryTotals,
  monthlyCashflow,
  type DatedLedgerEntry,
} from "@/lib/finance/analytics";
import { netWorth } from "@/lib/finance/balances";
import { prisma } from "@/lib/prisma";
import { listAccounts } from "./accounts";
import { listBudgets } from "./budgets";

export async function getDashboardData(userId: string) {
  const now = todayInAppTimezone();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [accounts, budgets, monthTransactions, allTransactions, categories, goals, debts, alerts] =
    await Promise.all([
      listAccounts(userId),
      listBudgets(userId),
      prisma.transaction.findMany({
        where: { userId, deletedAt: null, transactionDate: { gte: monthStart } },
        select: {
          type: true,
          amount: true,
          deletedAt: true,
          transactionDate: true,
          categoryId: true,
        },
      }),
      prisma.transaction.findMany({
        where: { userId, deletedAt: null, transactionDate: { gte: new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)) } },
        select: {
          type: true,
          amount: true,
          deletedAt: true,
          transactionDate: true,
          categoryId: true,
        },
      }),
      prisma.category.findMany({ where: { userId }, select: { id: true, name: true, color: true } }),
      prisma.savingsGoal.findMany({ where: { userId, status: "ACTIVE" }, select: { id: true, name: true, currentAmount: true, targetAmount: true } }),
      prisma.debt.aggregate({ where: { userId }, _sum: { outstandingBalance: true } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

  const monthSummary = cashflowSummary(monthTransactions as DatedLedgerEntry[]);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const spendingByCategory = categoryTotals(
    monthTransactions as DatedLedgerEntry[],
    "EXPENSE",
  ).map((item) => ({
    ...item,
    name: categoryMap.get(item.categoryId)?.name ?? "Uncategorized",
    color: categoryMap.get(item.categoryId)?.color ?? "#64748B",
  }));

  return {
    netWorth: netWorth(accounts),
    monthSummary,
    cashflow: monthlyCashflow(allTransactions as DatedLedgerEntry[]).slice(-12),
    spendingByCategory,
    accounts,
    budgets: budgets.slice(0, 5),
    goals: goals.slice(0, 4),
    totalDebt: debts._sum.outstandingBalance ?? 0n,
    unreadNotifications: alerts,
    monthTransactionCount: monthTransactions.length,
  };
}
