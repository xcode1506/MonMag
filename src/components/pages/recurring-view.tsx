"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Plus } from "lucide-react";
import {
  deleteRecurringAction,
  toggleRecurringAction,
} from "@/app/(app)/actions";
import { ActionForm } from "@/components/forms/action-form";
import { RecurringForm } from "@/components/forms/entity-forms";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { parseDateInput } from "@/lib/date";
import { t, type Locale } from "@/lib/i18n";
import { toMinorUnits } from "@/lib/money";
import { date, money } from "@/lib/ui";

export interface RecurringRow {
  id: string;
  title: string;
  type: string;
  amount: string;
  accountCurrency: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  frequency: string;
  interval: number;
  startDate: string;
  endDate: string | null;
  nextRun: string;
  active: boolean;
}

export function RecurringView({
  rows,
  accounts,
  categories,
  currency,
  locale,
  timezone = "Asia/Jakarta",
  today,
}: {
  rows: RecurringRow[];
  accounts: Array<{ value: string; label: string; currency: string }>;
  categories: Array<{ value: string; label: string }>;
  currency: string;
  locale: Locale;
  timezone?: string;
  today: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RecurringRow | null>(null);
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };
  const savedForm = () => {
    closeForm();
    router.refresh();
  };

  const activeCount = rows.filter((rule) => rule.active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "recurring.heading")}
        description={t(locale, "recurring.subheading")}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus aria-hidden="true" />
            {t(locale, "recurring.new")}
          </Button>
        }
      />

      {rows.length ? (
        <>
          <div className="flex flex-wrap gap-6 ledger-panel border bg-card px-5 py-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t(locale, "recurring.activeRules")}</p>
              <p className="mt-0.5 text-lg font-semibold text-positive">{activeCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t(locale, "recurring.pausedRules")}</p>
              <p className="mt-0.5 text-lg font-semibold">{rows.length - activeCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t(locale, "recurring.nextRun")}</p>
              <p className="mt-0.5 text-lg font-semibold">
                {rows.filter((rule) => rule.active).length
                  ? date(
                      rows.filter((rule) => rule.active).reduce((earliest, rule) =>
                        rule.nextRun < earliest ? rule.nextRun : earliest,
                        rows.filter((rule) => rule.active)[0].nextRun,
                      ),
                      locale,
                      timezone,
                    )
                  : t(locale, "common.notProvided")}
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="divide-y p-0">
              {rows.map((rule) => (
                <div
                  key={rule.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-button)] bg-brand/10 text-brand" aria-hidden="true">
                      <CalendarRange className="size-4" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{rule.title}</p>
                        <Badge variant={rule.active ? "positive" : "outline"}>
                          {t(locale, rule.active ? "common.active" : "common.paused")}
                        </Badge>
                        <Badge variant={rule.type === "INCOME" ? "brand" : "default"}>
                          {t(locale, rule.type === "INCOME" ? "transactions.income" : "transactions.expense")}
                        </Badge>
                      </div>
                      <p className="numeric text-sm font-semibold">
                        {money(rule.amount, rule.accountCurrency, locale, currency)}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {t(locale, "recurring.every", { interval: rule.interval, frequency: rule.frequency.toLowerCase() })}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rule.accountName}
                        {rule.categoryName ? ` · ${rule.categoryName}` : ""}
                        {` · ${t(locale, "recurring.nextOn", { date: date(rule.nextRun, locale, timezone) })}`}
                        {rule.endDate ? ` · ${t(locale, "recurring.endsOn", { date: date(rule.endDate, locale, timezone) })}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <ActionForm
                      action={toggleRecurringAction}
                      submitLabel={t(locale, rule.active ? "action.pause" : "action.activate")}
                      submitAriaLabel={t(locale, "recurring.toggleRule", {
                        action: t(locale, rule.active ? "action.pause" : "action.activate"),
                        name: rule.title,
                      })}
                      className="[&>div]:pt-0"
                    >
                      <input type="hidden" name="id" value={rule.id} />
                      <input type="hidden" name="active" value={rule.active ? "off" : "on"} />
                    </ActionForm>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(rule); setFormOpen(true); }}>
                      {t(locale, "action.edit")}
                    </Button>
                    <ConfirmActionButton
                      action={deleteRecurringAction}
                      id={rule.id}
                      label={t(locale, "action.delete")}
                      locale={locale}
                      title={t(locale, "confirm.deleteRule")}
                      description={t(locale, "confirm.detailRule")}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          title={t(locale, "recurring.emptyTitle")}
          description={t(locale, "recurring.empty")}
          icon={CalendarRange}
          action={<Button onClick={() => setFormOpen(true)}>{t(locale, "action.create")}</Button>}
        />
      )}

      <Modal
        open={formOpen}
        onOpenChange={(next) => (next ? null : closeForm())}
        title={t(locale, editing ? "recurring.editTitle" : "recurring.new")}
        description={t(locale, "recurring.modalHint")}
      >
        <RecurringForm
          locale={locale}
          onSuccess={savedForm}
          accounts={accounts}
          categories={categories}
          currency={editing?.accountCurrency ?? currency}
          today={today}
          item={editing ? {
            id: editing.id,
            title: editing.title,
            type: editing.type,
            amount: toMinorUnits(editing.amount, editing.accountCurrency),
            accountId: editing.accountId,
            categoryId: editing.categoryId,
            frequency: editing.frequency,
            interval: editing.interval,
            startDate: parseDateInput(editing.startDate)!,
            endDate: editing.endDate ? parseDateInput(editing.endDate) : null,
            active: editing.active,
          } : undefined}
        />
      </Modal>
    </div>
  );
}
