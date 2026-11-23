"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, PiggyBank, Plus } from "lucide-react";
import { deleteGoalAction } from "@/app/(app)/actions";
import {
  ContributionForm,
  GoalForm,
} from "@/components/forms/entity-forms";
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
import { date, money, percent, tone } from "@/lib/ui";

export interface GoalRow {
  id: string;
  name: string;
  description: string | null;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
  status: string;
  color: string;
  progress: number;
  contributions: Array<{
    id: string;
    amount: string;
    note: string | null;
    createdAt: string;
  }>;
}

export function GoalsView({
  rows,
  currency,
  locale,
  today,
  timezone = "Asia/Jakarta",
}: {
  rows: GoalRow[];
  currency: string;
  locale: Locale;
  today: string;
  timezone?: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GoalRow | null>(null);
  const [contributing, setContributing] = React.useState<GoalRow | null>(null);
  const closeForm = () => { setFormOpen(false); setEditing(null); };
  const closeContribution = () => { setContributing(null); };
  const savedForm = () => { closeForm(); router.refresh(); };
  const savedContribution = () => { closeContribution(); router.refresh(); };

  const totalSaved = sumMoneyValues(
    rows.map((goal) => goal.currentAmount),
    currency,
  );
  const totalTarget = sumMoneyValues(
    rows.map((goal) => goal.targetAmount),
    currency,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "goals.heading")}
        description={t(locale, "goals.subheading")}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus aria-hidden="true" />
            {t(locale, "goals.new")}
          </Button>
        }
      />

      {rows.length ? (
        <>
          <div className="flex flex-wrap gap-6 ledger-panel border bg-card px-5 py-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t(locale, "goals.totalSaved")}</p>
              <p className="numeric mt-0.5 text-lg font-semibold text-positive">
                {money(totalSaved, currency, locale, currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t(locale, "goals.combinedTarget")}</p>
              <p className="numeric mt-0.5 text-lg font-semibold">
                {money(totalTarget, currency, locale, currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t(locale, "goals.activeGoals")}</p>
              <p className="mt-0.5 text-lg font-semibold">
                {rows.filter((goal) => goal.status === "ACTIVE").length}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((goal) => {
              const current = parseMoneyInput(goal.currentAmount, currency);
              const target = parseMoneyInput(goal.targetAmount, currency);
              const progress = Math.round(percentOf(current, target));
              return (
                <Card key={goal.id}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-button)] text-white"
                          style={{ backgroundColor: goal.color }}
                          aria-hidden="true"
                        >
                          <PiggyBank className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{goal.name}</p>
                          <Badge variant={tone(goal.status)}>
                            {goal.status === "COMPLETED" ? t(locale, "goals.completed") : goal.status === "ACTIVE" ? t(locale, "common.active") : goal.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {goal.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{goal.description}</p>
                    ) : null}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="numeric font-medium">{money(goal.currentAmount, currency, locale, currency)}</span>
                        <span className="numeric text-muted-foreground">{t(locale, "common.of")} {money(goal.targetAmount, currency, locale, currency)}</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} label={t(locale, "goals.progressLabel", { name: goal.name })} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t(locale, "goals.complete", { percent: percent(progress) })}</span>
                        {goal.targetDate ? (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="size-3" aria-hidden="true" />
                            {date(goal.targetDate, locale, timezone)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {goal.contributions.length ? (
                      <div className="space-y-1 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground">{t(locale, "goals.recentContributions")}</p>
                        {goal.contributions.slice(0, 3).map((contribution) => (
                          <div key={contribution.id} className="flex justify-between gap-2 text-xs">
                            <span className="truncate text-muted-foreground">
                              {contribution.note || date(contribution.createdAt, locale, timezone)}
                            </span>
                            <span className={contribution.amount.startsWith("-") ? "numeric text-negative" : "numeric text-positive"}>
                              {money(contribution.amount, currency, locale, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => setContributing(goal)}>
                        <Plus aria-hidden="true" />
                        {t(locale, "action.deposit")}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(goal); setFormOpen(true); }}>{t(locale, "action.edit")}</Button>
                      <ConfirmActionButton
                        action={deleteGoalAction}
                        id={goal.id}
                        label={t(locale, "action.delete")}
                        locale={locale}
                        title={t(locale, "confirm.deleteGoal")}
                        description={t(locale, "confirm.detailGoal")}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          title={t(locale, "goals.empty")}
          description={t(locale, "goals.emptyHint")}
          icon={PiggyBank}
          action={<Button onClick={() => setFormOpen(true)}>{t(locale, "goals.new")}</Button>}
        />
      )}

      <Modal
        open={formOpen}
        onOpenChange={(next) => (next ? null : closeForm())}
        title={t(locale, editing ? "goals.editTitle" : "goals.new")}
        description={t(locale, "goals.modalHint")}
      >
        <GoalForm
          locale={locale}
          onSuccess={savedForm}
          currency={currency}
          today={today}
          item={editing ? {
            id: editing.id,
            name: editing.name,
            targetAmount: toMinorUnits(editing.targetAmount, currency),
            targetDate: editing.targetDate ? parseDateInput(editing.targetDate) : null,
            description: editing.description,
            color: editing.color,
          } : undefined}
        />
      </Modal>

      <Modal
        open={Boolean(contributing)}
        onOpenChange={(next) => (next ? null : closeContribution())}
        title={t(locale, "goals.contributionTitle", { name: contributing?.name ?? t(locale, "goals.target") })}
        description={t(locale, "goals.contributionHint")}
      >
        {contributing ? (
          <ContributionForm
            locale={locale}
            onSuccess={savedContribution}
            goalId={contributing.id}
            currency={currency}
          />
        ) : null}
      </Modal>
    </div>
  );
}
