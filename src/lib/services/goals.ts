import { assertOwnership } from "@/lib/auth";
import { localizedError } from "@/lib/errors";
import { ratioOf } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import {
  savingsContributionSchemaFor,
  savingsGoalSchemaFor,
  type SavingsContributionInput,
  type SavingsGoalInput,
} from "@/lib/validation";

export async function listGoals(userId: string) {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      contributions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  return goals.map((goal) => ({
    ...goal,
    progress: ratioOf(goal.currentAmount, goal.targetAmount),
  }));
}

export async function createGoal(
  userId: string,
  raw: SavingsGoalInput,
  currency: string,
) {
  const input = savingsGoalSchemaFor(currency).parse(raw);
  return prisma.savingsGoal.create({
    data: {
      userId,
      name: input.name,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate ?? null,
      description: input.description ?? null,
      icon: input.icon,
      color: input.color,
    },
  });
}

export async function updateGoal(
  userId: string,
  goalId: string,
  raw: SavingsGoalInput,
  currency: string,
) {
  const existing = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId } });
  assertOwnership(existing, userId, "Savings goal");
  const input = savingsGoalSchemaFor(currency).parse(raw);
  return prisma.savingsGoal.update({
    where: { id: goalId },
    data: {
      name: input.name,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate ?? null,
      description: input.description ?? null,
      icon: input.icon,
      color: input.color,
    },
  });
}

/** Deposit (positive) or withdraw (negative) from a goal, atomically. */
export async function contributeToGoal(
  userId: string,
  raw: SavingsContributionInput,
  currency: string,
) {
  const input = savingsContributionSchemaFor(currency).parse(raw);
  return prisma.$transaction(async (tx) => {
    const found = await tx.savingsGoal.findFirst({ where: { id: input.goalId, userId } });
    const goal = assertOwnership(found, userId, "Savings goal");
    const next = goal.currentAmount + input.amount;
    if (next < 0n) {
      throw localizedError(409, "conflict", "error.withdrawalExceedsBalance");
    }

    const contribution = await tx.savingsContribution.create({
      data: {
        userId,
        goalId: goal.id,
        amount: input.amount,
        note: input.note ?? null,
      },
    });
    const updated = await tx.savingsGoal.update({
      where: { id: goal.id },
      data: {
        currentAmount: next,
        status: next >= goal.targetAmount ? "COMPLETED" : "ACTIVE",
        completedAt: next >= goal.targetAmount ? new Date() : null,
      },
    });
    return { contribution, goal: updated };
  });
}

export async function deleteGoal(userId: string, goalId: string) {
  const existing = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId } });
  assertOwnership(existing, userId, "Savings goal");
  await prisma.savingsGoal.delete({ where: { id: goalId } });
}
