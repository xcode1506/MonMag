import type { z } from "zod";
import { accountBalance, type LedgerEntry } from "@/lib/finance/balances";
import { accountSchema } from "@/lib/validation";
import { assertOwnership } from "@/lib/auth";
import { localizedError, notFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export type AccountWithBalance = Awaited<ReturnType<typeof listAccounts>>[number];

export async function listAccounts(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: "asc" },
    include: {
      transactions: {
        where: { deletedAt: null },
        select: { type: true, amount: true, deletedAt: true },
      },
      sourceTransfers: { select: { amount: true } },
      destinationTransfers: { select: { amount: true } },
    },
  });

  return accounts.map(({ transactions, sourceTransfers, destinationTransfers, ...account }) => ({
    ...account,
    balance: accountBalance({
      initialBalance: account.initialBalance,
      transactions: transactions as LedgerEntry[],
      transferredOut: sourceTransfers.map((item) => item.amount),
      transferredIn: destinationTransfers.map((item) => item.amount),
    }),
  }));
}

export async function getAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  return assertOwnership(account, userId, "Account");
}

export async function createAccount(
  userId: string,
  raw: z.input<typeof accountSchema>,
) {
  const input = accountSchema.parse(raw);
  return prisma.account.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      currency: input.currency,
      initialBalance: input.initialBalance,
      color: input.color,
      icon: input.icon,
      description: input.description ?? null,
      creditLimit: input.creditLimit ?? null,
      archived: input.archived,
    },
  });
}

export async function updateAccount(
  userId: string,
  accountId: string,
  raw: z.input<typeof accountSchema>,
) {
  await getAccount(userId, accountId);
  const input = accountSchema.parse(raw);
  return prisma.account.update({
    where: { id: accountId },
    data: {
      name: input.name,
      type: input.type,
      currency: input.currency,
      initialBalance: input.initialBalance,
      color: input.color,
      icon: input.icon,
      description: input.description ?? null,
      creditLimit: input.creditLimit ?? null,
      archived: input.archived,
    },
  });
}

export async function deleteAccount(userId: string, accountId: string) {
  await getAccount(userId, accountId);
  const [transactions, transfers] = await Promise.all([
    prisma.transaction.count({
      where: { accountId, userId, deletedAt: null },
    }),
    prisma.transfer.count({
      where: { userId, OR: [{ sourceAccountId: accountId }, { destinationAccountId: accountId }] },
    }),
  ]);
  if (transactions > 0 || transfers > 0) {
    throw localizedError(409, "conflict", "error.accountArchiveInstead");
  }
  await prisma.account.delete({ where: { id: accountId } });
}

export async function setDefaultAccount(userId: string, accountId: string | null) {
  if (accountId) await getAccount(userId, accountId);
  return prisma.user.update({
    where: { id: userId },
    data: { defaultAccountId: accountId },
  });
}

export async function assertAccountOwner(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true, name: true, currency: true },
  });
  if (!account) throw notFoundError("Account");
  return account;
}
