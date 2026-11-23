import type { Prisma } from "@/generated/prisma/client";
import { assertOwnership } from "@/lib/auth";
import { endOfInputDate } from "@/lib/date";
import { localizedError, notFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  entityIdSchema,
  transactionSchemaFor,
  transferSchemaFor,
  type TransactionInput,
  type TransferInput,
} from "@/lib/validation";
import { assertAccountOwner } from "./accounts";

export interface TransactionFilters {
  search?: string;
  type?: "INCOME" | "EXPENSE";
  accountId?: string;
  categoryId?: string;
  from?: Date;
  to?: Date;
  take?: number;
  skip?: number;
}

export async function listTransactions(userId: string, filters: TransactionFilters = {}) {
  const where: Prisma.TransactionWhereInput = {
    userId,
    deletedAt: null,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.from || filters.to
      ? {
          transactionDate: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: endOfInputDate(filters.to) } : {}),
          },
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      take: Math.min(filters.take ?? 50, 200),
      skip: filters.skip ?? 0,
      include: {
        account: { select: { id: true, name: true, currency: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items, total };
}

async function assertCategoryOwner(userId: string, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  if (!category) throw notFoundError("Category");
}

export async function createTransaction(userId: string, raw: TransactionInput) {
  const accountId = entityIdSchema.parse(raw.accountId);
  const account = await assertAccountOwner(userId, accountId);
  const input = transactionSchemaFor(account.currency).parse(raw);
  await assertCategoryOwner(userId, input.categoryId);

  if (input.idempotencyKey) {
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return assertOwnership(existing, userId, "Transaction");
  }

  return prisma.transaction.create({
    data: {
      userId,
      accountId: input.accountId,
      title: input.title,
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId ?? null,
      transactionDate: input.transactionDate,
      paymentMethod: input.paymentMethod ?? null,
      description: input.description ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
    },
  });
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  raw: TransactionInput,
) {
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId, deletedAt: null },
  });
  assertOwnership(existing, userId, "Transaction");
  const accountId = entityIdSchema.parse(raw.accountId);
  const account = await assertAccountOwner(userId, accountId);
  const input = transactionSchemaFor(account.currency).parse(raw);
  await assertCategoryOwner(userId, input.categoryId);

  return prisma.transaction.update({
    where: { id: transactionId },
    data: {
      accountId: input.accountId,
      title: input.title,
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId ?? null,
      transactionDate: input.transactionDate,
      paymentMethod: input.paymentMethod ?? null,
      description: input.description ?? null,
    },
  });
}

/** Soft delete keeps the audit trail and reverses the balance contribution. */
export async function deleteTransaction(userId: string, transactionId: string) {
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId, deletedAt: null },
  });
  assertOwnership(existing, userId, "Transaction");
  return prisma.transaction.update({
    where: { id: transactionId },
    data: { deletedAt: new Date() },
  });
}

export async function createTransfer(userId: string, raw: TransferInput) {
  const sourceAccountId = entityIdSchema.parse(raw.sourceAccountId);
  const destinationAccountId = entityIdSchema.parse(raw.destinationAccountId);
  const [source, destination] = await Promise.all([
    assertAccountOwner(userId, sourceAccountId),
    assertAccountOwner(userId, destinationAccountId),
  ]);
  if (source.currency !== destination.currency) {
    throw localizedError(409, "conflict", "error.transferSameCurrency");
  }
  const input = transferSchemaFor(source.currency).parse(raw);

  if (input.idempotencyKey) {
    const existing = await prisma.transfer.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return assertOwnership(existing, userId, "Transfer");
  }

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.create({
      data: {
        userId,
        sourceAccountId: input.sourceAccountId,
        destinationAccountId: input.destinationAccountId,
        amount: input.amount,
        transactionDate: input.transactionDate,
        description: input.description ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
      },
    });

    await tx.transaction.createMany({
      data: [
        {
          userId,
          accountId: input.sourceAccountId,
          title: `Transfer to ${destination.name}`,
          type: "TRANSFER",
          amount: input.amount,
          transactionDate: input.transactionDate,
          description: input.description ?? null,
          transferId: transfer.id,
          idempotencyKey: input.idempotencyKey
            ? `${input.idempotencyKey}:out`
            : null,
        },
        {
          userId,
          accountId: input.destinationAccountId,
          title: `Transfer from ${source.name}`,
          type: "TRANSFER",
          amount: input.amount,
          transactionDate: input.transactionDate,
          description: input.description ?? null,
          transferId: transfer.id,
          idempotencyKey: input.idempotencyKey
            ? `${input.idempotencyKey}:in`
            : null,
        },
      ],
    });

    return transfer;
  });
}

/** Hard ceiling so a large ledger cannot be loaded into memory for one export. */
export const MAX_EXPORT_ROWS = 10_000;

export async function getTransactionsForExport(
  userId: string,
  from?: Date,
  to?: Date,
  take = MAX_EXPORT_ROWS,
) {
  return prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(from || to
        ? {
            transactionDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: endOfInputDate(to) } : {}),
            },
          }
        : {}),
    },
    take: Math.min(Math.max(1, take), MAX_EXPORT_ROWS),
    orderBy: { transactionDate: "desc" },
    include: {
      account: { select: { name: true, currency: true } },
      category: { select: { name: true } },
    },
  });
}
