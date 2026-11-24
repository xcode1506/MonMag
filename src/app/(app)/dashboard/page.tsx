import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { ArrowUpRight, PiggyBank, Plus, Wallet } from "lucide-react";
import {
  CashflowChart,
  CategoryRankingChart,
  NetTrendChart,
} from "@/components/charts/charts";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { nextActionFor } from "@/lib/dashboard-focus";
import {
  buildCashflowTrend,
  rankCategories,
} from "@/lib/finance/chart-view-models";
import { dateLocaleTag, t } from "@/lib/i18n";
import { getDashboardData } from "@/lib/services/dashboard";
import { amountInput, label, localeOf, money, percent } from "@/lib/ui";

function FocusFigure({
  index,
  label,
  value,
  hint,
  tone = "default",
}: {
  index: number;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="bg-card px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center justify-between gap-2">
        <p className="figure-index">{String(index).padStart(2, "0")}</p>
        <span className="h-px w-6 bg-border" aria-hidden="true" />
      </div>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`numeric mt-2 truncate font-display text-2xl font-medium tracking-tight sm:text-3xl ${
          tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

async function DashboardContent() {
  "use cache: private";
  cacheLife({ stale: 60 });

  const user = await requireUser();
  const locale = localeOf(user.preferredLanguage);
  const currency = user.preferredCurrency;
  const timezone = user.timezone;
  const data = await getDashboardData(user.id);
  const nextAction = nextActionFor({
    accountCount: data.accounts.length,
    unreadNotifications: data.unreadNotifications,
    budgets: data.budgets,
    monthNet: data.monthSummary.net,
    monthTransactionCount: data.monthTransactionCount,
  });

  const monthLabel = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    month: "short",
    timeZone: "UTC",
  });
  const trend = buildCashflowTrend(
    data.cashflow.map((point) => ({
      month: monthLabel.format(new Date(`${point.month}-01T00:00:00Z`)),
      income: amountInput(point.income, currency),
      expense: amountInput(point.expense, currency),
    })),
  );
  const spending = rankCategories(
    data.spendingByCategory.map((item) => ({
      name: item.name,
      value: amountInput(item.total, currency),
      color: item.color,
    })),
    6,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "dashboard.heading", {
          name: user.fullName.split(" ")[0],
        })}
        description={t(locale, "dashboard.subheading")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/transactions?new=1">
                <Plus aria-hidden="true" />
                {t(locale, "transactions.new")}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/accounts">
                <Wallet aria-hidden="true" />
                {t(locale, "nav.accounts")}
              </Link>
            </Button>
          </>
        }
      />

      <section
        aria-label={t(locale, "dashboard.nextMove")}
        className="next-move-band"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center border border-current">
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="muted-on-band text-[11px] font-medium uppercase tracking-[0.14em]">
              {t(locale, "dashboard.nextMove")}
            </p>
            <p className="truncate font-display text-base font-medium tracking-tight sm:text-lg">
              {t(locale, nextAction.labelKey)}
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="button-on-band self-start sm:self-auto">
          <Link href={nextAction.href}>
            {t(locale, "dashboard.nextMove")}
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <section aria-label={t(locale, "dashboard.heading", { name: user.fullName.split(" ")[0] })}>
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
          <FocusFigure
            index={1}
            label={t(locale, "dashboard.onHand")}
            value={money(data.netWorth.total, currency, locale, currency)}
            hint={`${t(locale, "nav.debts")} ${money(data.totalDebt, currency, locale, currency)}`}
          />
          <FocusFigure
            index={2}
            label={t(locale, "dashboard.earned")}
            value={money(data.monthSummary.income, currency, locale, currency)}
            hint={t(locale, "common.thisMonth")}
            tone="positive"
          />
          <FocusFigure
            index={3}
            label={t(locale, "dashboard.spent")}
            value={money(data.monthSummary.expense, currency, locale, currency)}
            hint={t(locale, "common.thisMonth")}
            tone="negative"
          />
          <FocusFigure
            index={4}
            label={t(locale, "dashboard.saved")}
            value={money(data.monthSummary.net, currency, locale, currency)}
            hint={`${t(locale, "dashboard.savingsRate")} ${data.monthSummary.savingsRate}%`}
            tone={data.monthSummary.net >= 0n ? "positive" : "negative"}
          />
        </div>
      </section>

      <div className="chart-grid">
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "dashboard.cashflow")}</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length ? (
              <CashflowChart
                data={trend}
                currency={currency}
                locale={locale}
                displayCurrency={currency}
              />
            ) : (
              <EmptyState
                title={t(locale, "dashboard.emptyCashflowTitle")}
                description={t(locale, "dashboard.emptyCashflowDescription")}
                icon={ArrowUpRight}
                action={
                  <Button asChild>
                    <Link href="/transactions">{t(locale, "transactions.new")}</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "dashboard.netFlow")}</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length ? (
              <NetTrendChart
                data={trend}
                currency={currency}
                locale={locale}
                displayCurrency={currency}
              />
            ) : (
              <EmptyState
                title={t(locale, "dashboard.emptyCashflowTitle")}
                description={t(locale, "dashboard.emptyCashflowDescription")}
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t(locale, "dashboard.categoryRank")}</CardTitle>
          </CardHeader>
          <CardContent>
            {spending.length ? (
              <CategoryRankingChart
                data={spending}
                currency={currency}
                locale={locale}
                displayCurrency={currency}
              />
            ) : (
              <EmptyState
                title={t(locale, "dashboard.emptySpendingTitle")}
                description={t(locale, "dashboard.emptySpendingDescription")}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t(locale, "nav.budgets")}</CardTitle>
            <Button asChild variant="link" size="sm">
              <Link href="/budgets">{t(locale, "dashboard.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.budgets.length ? (
              data.budgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{budget.name}</span>
                    <span className="numeric text-muted-foreground">
                      {money(budget.spent, currency, locale, currency)} / {" "}
                      {money(budget.amount, currency, locale, currency)}
                    </span>
                  </div>
                  <Progress
                    value={budget.percent}
                    label={`${budget.name} usage`}
                    indicatorClassName={
                      budget.state === "exceeded"
                        ? "bg-negative"
                        : budget.state === "warning"
                          ? "bg-[#a67c2e]"
                          : undefined
                    }
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title={t(locale, "dashboard.emptyBudgetsTitle")}
                description={t(locale, "dashboard.emptyBudgetsDescription")}
                action={
                  <Button asChild>
                    <Link href="/budgets">{t(locale, "budgets.new")}</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t(locale, "nav.goals")}</CardTitle>
            <Button asChild variant="link" size="sm">
              <Link href="/goals">{t(locale, "dashboard.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.goals.length ? (
              data.goals.map((goal) => {
                const ratio =
                  goal.targetAmount === 0n
                    ? 0
                    : Number((goal.currentAmount * 100n) / goal.targetAmount);
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <PiggyBank className="size-4 text-brand" aria-hidden="true" />
                        {goal.name}
                      </span>
                      <Badge variant={ratio >= 100 ? "positive" : "brand"}>
                        {percent(ratio)}
                      </Badge>
                    </div>
                    <Progress value={ratio} label={`${goal.name} progress`} />
                    <p className="text-xs text-muted-foreground">
                      {money(goal.currentAmount, currency, locale, currency)} of {" "}
                      {money(goal.targetAmount, currency, locale, currency)}
                    </p>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title={t(locale, "dashboard.emptyGoalsTitle")}
                description={t(locale, "dashboard.emptyGoalsDescription")}
                action={
                  <Button asChild>
                    <Link href="/goals">{t(locale, "goals.new")}</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t(locale, "nav.accounts")}</CardTitle>
          <Button asChild variant="link" size="sm">
            <Link href="/accounts">{t(locale, "dashboard.viewAll")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.accounts.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.accounts.map((account) => (
                <Link
                  key={account.id}
                  href="/accounts"
                  className="border border-l-2 border-l-brand border-border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <p className="text-sm text-muted-foreground">{account.name}</p>
                  <p className="numeric mt-1 font-display text-lg font-medium">
                    {money(account.balance, account.currency, locale, currency)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {label(account.type, locale)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t(locale, "dashboard.emptyAccountsTitle")}
              description={t(locale, "dashboard.emptyAccountsDescription")}
              action={
                <Button asChild>
                  <Link href="/accounts">{t(locale, "accounts.new")}</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        {formatDate(new Date(), locale, timezone)} · {t(locale, "settings.timezone")}: {timezone}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
