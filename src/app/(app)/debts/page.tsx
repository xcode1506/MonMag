import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { DebtsView, type DebtRow } from "@/components/pages/debts-view";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { requireUser } from "@/lib/auth";
import { toDateInput, todayInAppTimezone } from "@/lib/date";
import { listDebts } from "@/lib/services/debts";
import { amountInput, localeOf } from "@/lib/ui";

async function DebtsContent() {
  "use cache: private";
  cacheLife({ stale: 60 });

  const user = await requireUser();
  const debts = await listDebts(user.id);
  const currency = user.preferredCurrency;
  const rows: DebtRow[] = debts.map((debt) => ({
    id: debt.id,
    name: debt.name,
    lender: debt.lender,
    originalAmount: amountInput(debt.originalAmount, currency),
    outstandingBalance: amountInput(debt.outstandingBalance, currency),
    interestRate: debt.interestRate ? Number(debt.interestRate) : null,
    monthlyPayment: debt.monthlyPayment ? amountInput(debt.monthlyPayment, currency) : null,
    startDate: toDateInput(debt.startDate),
    dueDate: debt.dueDate ? toDateInput(debt.dueDate) : null,
    payoff: {
      months: debt.payoff.months,
      totalInterest: amountInput(debt.payoff.totalInterest, currency),
      totalPaid: amountInput(debt.payoff.totalPaid, currency),
      paidOff: debt.payoff.paidOff,
    },
    payments: debt.payments.map((payment) => ({
      id: payment.id,
      amount: amountInput(payment.amount, currency),
      paymentDate: toDateInput(payment.paymentDate),
      note: payment.note,
    })),
  }));

  return (
    <DebtsView
      rows={rows}
      currency={currency}
      locale={localeOf(user.preferredLanguage)}
      timezone={user.timezone}
      today={toDateInput(todayInAppTimezone())}
    />
  );
}

export default function DebtsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DebtsContent />
    </Suspense>
  );
}
