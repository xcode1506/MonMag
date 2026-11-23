import type { BudgetPeriod } from "@/generated/prisma/enums";
import { assertOwnership } from "@/lib/auth";
import { periodRange } from "@/lib/date";
import { notFoundError } from "@/lib/errors";
import { budgetStatus, type BudgetStatus } from "@/lib/finance/budgets";
import { sumMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { budgetSchemaFor, type BudgetInput } from "@/lib/validation";

export type BudgetWithStatus = Awaited<ReturnType<typeof listBudgets>>[number];

export async function listBudgets(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    include: { category: { select: { id: true, name: true, color: true } } },
  });

  return Promise.all(
    budgets.map(async (budget) => {
      const { start, end } = periodRange(
        budget.period as BudgetPeriod,
        budget.startDate,
        budget.endDate,
      );
      const spent = await prisma.transaction.aggregate({
        where: {
          userId,
          deletedAt: null,
          type: "EXPENSE",
          transactionDate: { gte: start, lte: end },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
        _sum: { amount: true },
      });
      const status: BudgetStatus = budgetStatus(
        spent._sum.amount ?? 0n,
        budget.amount,
        budget.alertThreshold,
      );
      return {
        ...budget,
        spent: status.spent,
        remaining: status.remaining,
        percent: status.percent,
        state: status.state,
      };
    }),
  );
}

export async function createBudget(userId: string, raw: BudgetInput, currency: string) {
  const input = budgetSchemaFor(currency).parse(raw);
  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, userId },
      select: { id: true },
    });
    if (!category) throw notFoundError("Category");
  }
  return prisma.budget.create({
    data: {
      userId,
      name: input.name,
      categoryId: input.categoryId ?? null,
      amount: input.amount,
      period: input.period,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      alertThreshold: input.alertThreshold,
    },
  });
}

export async function updateBudget(
  userId: string,
  budgetId: string,
  raw: BudgetInput,
  currency: string,
) {
  const existing = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  assertOwnership(existing, userId, "Budget");
  const input = budgetSchemaFor(currency).parse(raw);
  return prisma.budget.update({
    where: { id: budgetId },
    data: {
      name: input.name,
      categoryId: input.categoryId ?? null,
      amount: input.amount,
      period: input.period,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      alertThreshold: input.alertThreshold,
    },
  });
}

export async function deleteBudget(userId: string, budgetId: string) {
  const existing = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  assertOwnership(existing, userId, "Budget");
  await prisma.budget.delete({ where: { id: budgetId } });
}

export function totalBudgetLimit(budgets: readonly { amount: bigint }[]): bigint {
  return sumMoney(budgets.map((budget) => budget.amount));
}
