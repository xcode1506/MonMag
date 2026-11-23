import { assertOwnership } from "@/lib/auth";
import { localizedError } from "@/lib/errors";
import { estimatePayoff } from "@/lib/finance/debt";
import { prisma } from "@/lib/prisma";
import {
  debtPaymentSchemaFor,
  debtSchemaFor,
  type DebtInput,
  type DebtPaymentInput,
} from "@/lib/validation";

export async function listDebts(userId: string) {
  const debts = await prisma.debt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      payments: { orderBy: { paymentDate: "desc" }, take: 10 },
    },
  });
  return debts.map((debt) => ({
    ...debt,
    payoff: estimatePayoff(
      debt.outstandingBalance,
      debt.interestRate ? Number(debt.interestRate) : null,
      debt.monthlyPayment ?? 0n,
    ),
  }));
}

export async function createDebt(userId: string, raw: DebtInput, currency: string) {
  const input = debtSchemaFor(currency).parse(raw);
  return prisma.debt.create({
    data: {
      userId,
      name: input.name,
      lender: input.lender ?? null,
      originalAmount: input.originalAmount,
      outstandingBalance: input.outstandingBalance,
      interestRate: input.interestRate ?? null,
      monthlyPayment: input.monthlyPayment ?? null,
      dueDate: input.dueDate ?? null,
      startDate: input.startDate,
    },
  });
}

export async function updateDebt(
  userId: string,
  debtId: string,
  raw: DebtInput,
  currency: string,
) {
  const existing = await prisma.debt.findFirst({ where: { id: debtId, userId } });
  assertOwnership(existing, userId, "Debt");
  const input = debtSchemaFor(currency).parse(raw);
  return prisma.debt.update({
    where: { id: debtId },
    data: {
      name: input.name,
      lender: input.lender ?? null,
      originalAmount: input.originalAmount,
      outstandingBalance: input.outstandingBalance,
      interestRate: input.interestRate ?? null,
      monthlyPayment: input.monthlyPayment ?? null,
      dueDate: input.dueDate ?? null,
      startDate: input.startDate,
    },
  });
}

export async function recordDebtPayment(
  userId: string,
  raw: DebtPaymentInput,
  currency: string,
) {
  const input = debtPaymentSchemaFor(currency).parse(raw);
  return prisma.$transaction(async (tx) => {
    const found = await tx.debt.findFirst({ where: { id: input.debtId, userId } });
    const debt = assertOwnership(found, userId, "Debt");
    if (input.amount > debt.outstandingBalance) {
      throw localizedError(409, "conflict", "error.paymentExceedsBalance");
    }
    const payment = await tx.debtPayment.create({
      data: {
        userId,
        debtId: debt.id,
        amount: input.amount,
        paymentDate: input.paymentDate,
        note: input.note ?? null,
      },
    });
    const updated = await tx.debt.update({
      where: { id: debt.id },
      data: { outstandingBalance: debt.outstandingBalance - input.amount },
    });
    return { payment, debt: updated };
  });
}

export async function deleteDebt(userId: string, debtId: string) {
  const existing = await prisma.debt.findFirst({ where: { id: debtId, userId } });
  assertOwnership(existing, userId, "Debt");
  await prisma.debt.delete({ where: { id: debtId } });
}
