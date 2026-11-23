"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { deleteBudgetAction } from "@/app/(app)/actions";
import { BudgetForm, type Option } from "@/components/forms/entity-forms";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { t, type Locale } from "@/lib/i18n";
import { toMinorUnits } from "@/lib/money";
import { label, money, percent } from "@/lib/ui";

export interface BudgetRow {
  id: string;
  name: string;
  categoryName: string | null;
  categoryId: string | null;
  amount: string;
  spent: string;
  remaining: string;
  period: string;
  startDate: string;
  endDate: string | null;
  alertThreshold: number;
  state: string;
  percent: number;
}

export function BudgetsView({
  rows,
  categories,
  currency,
  locale,
  today,
}: {
  rows: BudgetRow[];
  categories: Option[];
  currency: string;
  locale: Locale;
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BudgetRow | null>(null);
  const close = () => { setOpen(false); setEditing(null); };
  const saved = () => { close(); router.refresh(); };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "budgets.heading")}
        description={t(locale, "budgets.subheading")}
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus aria-hidden="true" />
            {t(locale, "budgets.new")}
          </Button>
        }
      />

      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((budget) => (
            <Card key={budget.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{budget.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {budget.categoryName ?? t(locale, "budgets.allExpenses")} · {label(budget.period, locale)}
                    </p>
                  </div>
                  <Badge variant={budget.state === "exceeded" ? "negative" : budget.state === "warning" ? "warning" : "positive"}>
                    {t(locale, budget.state === "exceeded" ? "budgets.exceeded" : budget.state === "warning" ? "budgets.warning" : "budgets.safe")}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="numeric font-medium">{money(budget.spent, currency, locale, currency)}</span>
                    <span className="numeric text-muted-foreground">{t(locale, "common.of")} {money(budget.amount, currency, locale, currency)}</span>
                  </div>
                  <Progress
                    value={budget.percent}
                    label={t(locale, "budgets.usage", { name: budget.name })}
                    indicatorClassName={budget.state === "exceeded" ? "bg-negative" : budget.state === "warning" ? "bg-[#a67c2e]" : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    {budget.remaining.startsWith("-")
                      ? t(locale, "budgets.overAmount", { amount: money(budget.remaining.slice(1), currency, locale, currency) })
                      : `${money(budget.remaining, currency, locale, currency)} ${t(locale, "budgets.remainingLabel")}`} · {percent(budget.percent)} {t(locale, "budgets.usedLabel")}
                  </p>
                </div>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(budget); setOpen(true); }}>{t(locale, "action.edit")}</Button>
                  <ConfirmActionButton action={deleteBudgetAction} id={budget.id} label={t(locale, "action.delete")} locale={locale} title={t(locale, "confirm.deleteBudget")} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t(locale, "budgets.empty")}
          description={t(locale, "budgets.emptyHint")}
          icon={Plus}
          action={<Button onClick={() => setOpen(true)}>{t(locale, "budgets.new")}</Button>}
        />
      )}

      <Modal
        open={open}
        onOpenChange={(next) => (next ? null : close())}
        title={t(locale, editing ? "budgets.editTitle" : "budgets.new")}
        description={t(locale, "budgets.modalHint")}
      >
        <BudgetForm
          locale={locale}
          onSuccess={saved}
          categories={categories}
          currency={currency}
          today={today}
          item={editing ? {
            id: editing.id,
            name: editing.name,
            categoryId: editing.categoryId,
            amount: toMinorUnits(editing.amount, currency),
            period: editing.period,
            startDate: editing.startDate,
            endDate: editing.endDate,
            alertThreshold: editing.alertThreshold,
          } : undefined}
        />
      </Modal>
    </div>
  );
}
