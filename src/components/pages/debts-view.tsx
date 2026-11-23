"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Landmark, Plus } from "lucide-react";
import { deleteDebtAction } from "@/app/(app)/actions";
import { DebtForm, DebtPaymentForm } from "@/components/forms/entity-forms";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { parseDateInput } from "@/lib/date";
import { t, type Locale } from "@/lib/i18n";
import {
  parseMoneyInput,
  percentOf,
  sumMoneyValues,
  toMinorUnits,
} from "@/lib/money";
import { date, money } from "@/lib/ui";

export interface DebtRow {
  id: string;
  name: string;
  lender: string | null;
  originalAmount: string;
  outstandingBalance: string;
  interestRate: number | null;
  monthlyPayment: string | null;
  startDate: string;
  dueDate: string | null;
  payoff: {
    months: number;
    totalInterest: string;
    totalPaid: string;
    paidOff: boolean;
  };
  payments: Array<{
    id: string;
    amount: string;
    paymentDate: string;
    note: string | null;
  }>;
}

export function DebtsView({
  rows,
  currency,
  locale,
  timezone = "Asia/Jakarta",
  today,
}: {
  rows: DebtRow[];
  currency: string;
  locale: Locale;
  timezone?: string;
  today: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DebtRow | null>(null);
  const [paying, setPaying] = React.useState<DebtRow | null>(null);
  const closeForm = () => { setFormOpen(false); setEditing(null); };
  const closePayment = () => { setPaying(null); };
  const savedForm = () => { closeForm(); router.refresh(); };
  const savedPayment = () => { closePayment(); router.refresh(); };

  const totalOutstanding = sumMoneyValues(
    rows.map((debt) => debt.outstandingBalance),
    currency,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "debts.heading")}
        description={t(locale, "debts.subheading")}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus aria-hidden="true" />
            {t(locale, "debts.new")}
          </Button>
        }
      />

      {rows.length ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 ledger-panel border bg-card px-5 py-4">
            <div>
              <p className="text-sm text-muted-foreground">{t(locale, "debts.outstanding")}</p>
              <p className="numeric mt-0.5 text-2xl font-semibold text-negative">
                {money(totalOutstanding, currency, locale, currency)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{t(locale, "debts.across", { count: rows.length })}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((debt) => {
              const original = parseMoneyInput(debt.originalAmount, currency);
              const outstanding = parseMoneyInput(debt.outstandingBalance, currency);
              const paidPercent = Math.max(
                0,
                Math.min(100, percentOf(original - outstanding, original)),
              );
              return (
                <Card key={debt.id}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-button)] bg-negative/10 text-negative" aria-hidden="true">
                          <Landmark className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{debt.name}</p>
                          {debt.lender ? <p className="truncate text-xs text-muted-foreground">{debt.lender}</p> : null}
                        </div>
                      </div>
                      {debt.payoff.paidOff ? (
                        <Badge variant="positive">{t(locale, "debts.paidOff")}</Badge>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="numeric font-medium text-negative">
                          {money(debt.outstandingBalance, currency, locale, currency)}
                        </span>
                        <span className="numeric text-muted-foreground">{t(locale, "common.of")} {money(debt.originalAmount, currency, locale, currency)}</span>
                      </div>
                      <Progress value={paidPercent} label={t(locale, "debts.progressLabel", { name: debt.name })} indicatorClassName="bg-positive" />
                      <p className="text-xs text-muted-foreground">{t(locale, "debts.repaid", { percent: Math.round(paidPercent) })}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-card)] bg-muted/50 p-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">{t(locale, "debts.interestRate")}</p>
                        <p className="mt-0.5 font-medium">{debt.interestRate !== null ? `${debt.interestRate}%` : t(locale, "common.notProvided")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t(locale, "debts.monthlyPayment")}</p>
                        <p className="numeric mt-0.5 font-medium">
                          {debt.monthlyPayment ? money(debt.monthlyPayment, currency, locale, currency) : t(locale, "common.notProvided")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t(locale, "debts.payoff")}</p>
                        <p className="mt-0.5 font-medium">
                          {debt.payoff.paidOff ? t(locale, "debts.complete") : debt.payoff.months >= 600 ? t(locale, "debts.setPayment") : `${debt.payoff.months} ${t(locale, "debts.months")}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t(locale, "debts.estimatedInterest")}</p>
                        <p className="numeric mt-0.5 font-medium">{money(debt.payoff.totalInterest, currency, locale, currency)}</p>
                      </div>
                    </div>

                    {debt.dueDate ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="size-3.5" aria-hidden="true" />
                        {t(locale, "debts.due", { date: date(debt.dueDate, locale, timezone) })}
                      </p>
                    ) : null}

                    {debt.payments.length ? (
                      <div className="space-y-1 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground">{t(locale, "debts.recentPayments")}</p>
                        {debt.payments.slice(0, 3).map((payment) => (
                          <div key={payment.id} className="flex justify-between gap-2 text-xs">
                            <span className="truncate text-muted-foreground">
                              {date(payment.paymentDate, locale, timezone)}{payment.note ? ` · ${payment.note}` : ""}
                            </span>
                            <span className="numeric text-positive">{money(payment.amount, currency, locale, currency)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => setPaying(debt)}>{t(locale, "action.pay")}</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(debt); setFormOpen(true); }}>{t(locale, "action.edit")}</Button>
                      <ConfirmActionButton action={deleteDebtAction} id={debt.id} label={t(locale, "action.delete")} locale={locale} title={t(locale, "confirm.deleteDebt")} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          title={t(locale, "debts.empty")}
          description={t(locale, "debts.emptyHint")}
          icon={Landmark}
          action={<Button onClick={() => setFormOpen(true)}>{t(locale, "debts.new")}</Button>}
        />
      )}

      <Modal
        open={formOpen}
        onOpenChange={(next) => (next ? null : closeForm())}
        title={t(locale, editing ? "debts.editTitle" : "debts.new")}
        description={t(locale, "debts.modalHint")}
      >
        <DebtForm
          locale={locale}
          onSuccess={savedForm}
          currency={currency}
          today={today}
          item={editing ? {
            id: editing.id,
            name: editing.name,
            lender: editing.lender,
            originalAmount: toMinorUnits(editing.originalAmount, currency),
            outstandingBalance: toMinorUnits(editing.outstandingBalance, currency),
            interestRate: editing.interestRate,
            monthlyPayment: editing.monthlyPayment
              ? toMinorUnits(editing.monthlyPayment, currency)
              : null,
            startDate: parseDateInput(editing.startDate)!,
            dueDate: editing.dueDate ? parseDateInput(editing.dueDate) : null,
          } : undefined}
        />
      </Modal>

      <Modal
        open={Boolean(paying)}
        onOpenChange={(next) => (next ? null : closePayment())}
        title={t(locale, "debts.paymentTitle", { name: paying?.name ?? t(locale, "debts.heading") })}
        description={t(locale, "debts.paymentHint")}
      >
        {paying ? (
          <DebtPaymentForm
            locale={locale}
            onSuccess={savedPayment}
            debtId={paying.id}
            currency={currency}
            today={today}
          />
        ) : null}
      </Modal>
    </div>
  );
}
