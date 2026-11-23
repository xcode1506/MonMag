import type { Frequency } from "@/generated/prisma/enums";
import { assertOwnership } from "@/lib/auth";
import { nextOccurrence, todayInAppTimezone } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import {
  entityIdSchema,
  recurringSchemaFor,
  type RecurringInput,
} from "@/lib/validation";
import { assertAccountOwner } from "./accounts";

export async function listRecurring(userId: string) {
  return prisma.recurringTransaction.findMany({
    where: { userId },
    orderBy: { nextRun: "asc" },
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, color: true } },
    },
  });
}

export async function createRecurring(userId: string, raw: RecurringInput) {
  const accountId = entityIdSchema.parse(raw.accountId);
  const account = await assertAccountOwner(userId, accountId);
  const input = recurringSchemaFor(account.currency).parse(raw);
  return prisma.recurringTransaction.create({
    data: {
      userId,
      accountId: input.accountId,
      title: input.title,
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId ?? null,
      frequency: input.frequency,
      interval: input.interval,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      nextRun: nextOccurrence(input.startDate, input.frequency, input.interval, input.startDate),
      active: input.active,
    },
  });
}

export async function updateRecurring(
  userId: string,
  ruleId: string,
  raw: RecurringInput,
) {
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: ruleId, userId },
  });
  assertOwnership(existing, userId, "Recurring transaction");
  const accountId = entityIdSchema.parse(raw.accountId);
  const account = await assertAccountOwner(userId, accountId);
  const input = recurringSchemaFor(account.currency).parse(raw);
  return prisma.recurringTransaction.update({
    where: { id: ruleId },
    data: {
      accountId: input.accountId,
      title: input.title,
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId ?? null,
      frequency: input.frequency,
      interval: input.interval,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      active: input.active,
    },
  });
}

export async function toggleRecurring(userId: string, ruleId: string, active: boolean) {
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: ruleId, userId },
  });
  assertOwnership(existing, userId, "Recurring transaction");
  return prisma.recurringTransaction.update({
    where: { id: ruleId },
    data: { active },
  });
}

export async function deleteRecurring(userId: string, ruleId: string) {
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: ruleId, userId },
  });
  assertOwnership(existing, userId, "Recurring transaction");
  await prisma.recurringTransaction.delete({ where: { id: ruleId } });
}

/**
 * Materialize all due recurring rules into real transactions.
 * Idempotency key is derived from rule + scheduled date so a rerun is a no-op.
 */
export async function processDueRecurring(userId: string, now = todayInAppTimezone()) {
  const rules = await prisma.recurringTransaction.findMany({
    where: { userId, active: true, nextRun: { lte: now } },
  });
  let created = 0;

  for (const rule of rules) {
    const scheduled = rule.nextRun;
    if (rule.endDate && scheduled > rule.endDate) {
      await prisma.recurringTransaction.update({
        where: { id: rule.id },
        data: { active: false },
      });
      continue;
    }
    const idempotencyKey = `recurring:${rule.id}:${scheduled.toISOString()}`;
    await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { idempotencyKey } });
      if (!existing) {
        await tx.transaction.create({
          data: {
            userId,
            accountId: rule.accountId,
            title: rule.title,
            type: rule.type,
            amount: rule.amount,
            categoryId: rule.categoryId ?? null,
            transactionDate: scheduled,
            recurringId: rule.id,
            idempotencyKey,
            description: "Generated from a recurring rule",
          },
        });
        created += 1;
      }
      const next = nextOccurrence(
        scheduled,
        rule.frequency as Frequency,
        rule.interval,
        now,
      );
      await tx.recurringTransaction.update({
        where: { id: rule.id },
        data: { nextRun: next, lastProcessedRun: scheduled },
      });
    });
  }

  return { processed: rules.length, created };
}
