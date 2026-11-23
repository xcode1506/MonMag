import Link from "next/link";
import { Suspense } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Wallet } from "lucide-react";
import {
  CategoryRankingChart,
  NetTrendChart,
} from "@/components/charts/charts";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import {
  buildCashflowTrend,
  rankCategories,
} from "@/lib/finance/chart-view-models";
import { dateLocaleTag, t } from "@/lib/i18n";
import { getDashboardData } from "@/lib/services/dashboard";
import { amountInput, localeOf, money } from "@/lib/ui";

async function ReportsContent() {
  const user = await requireUser();
  const locale = localeOf(user.preferredLanguage);
  const currency = user.preferredCurrency;
  const timezone = user.timezone;
  const data = await getDashboardData(user.id);

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
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "reports.heading")}
        description={t(locale, "reports.subheading")}
        actions={
          <Button asChild variant="outline">
            <Link href="/transactions">{t(locale, "nav.transactions")}</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`${t(locale, "dashboard.income")} · ${t(locale, "common.thisMonth")}`}
          value={money(data.monthSummary.income, currency, locale, currency)}
          hint={`${t(locale, "settings.timezone")}: ${timezone}`}
          icon={ArrowUpRight}
          tone="positive"
        />
        <StatCard
          label={`${t(locale, "dashboard.expense")} · ${t(locale, "common.thisMonth")}`}
          value={money(data.monthSummary.expense, currency, locale, currency)}
          hint={`${data.spendingByCategory.length} ${t(locale, "common.category")}`}
          icon={ArrowDownRight}
          tone="negative"
        />
        <StatCard
          label={`${t(locale, "common.net")} · ${t(locale, "common.thisMonth")}`}
          value={money(data.monthSummary.net, currency, locale, currency)}
          hint={`${t(locale, "dashboard.savingsRate")} ${data.monthSummary.savingsRate}%`}
          icon={BarChart3}
        />
        <StatCard
          label={t(locale, "dashboard.netWorth")}
          value={money(data.netWorth.total, currency, locale, currency)}
          hint={t(locale, "dashboard.netWorthHint")}
          icon={Wallet}
        />
      </div>

      <div className="chart-grid">
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
                title={t(locale, "reports.emptyCashflowTitle")}
                description={t(locale, "reports.emptyCashflowDescription")}
                icon={BarChart3}
                action={
                  <Button asChild>
                    <Link href="/transactions?new=1">{t(locale, "transactions.new")}</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
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
                title={t(locale, "reports.emptySpendingTitle")}
                description={t(locale, "reports.emptySpendingDescription")}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "reports.trend")}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.cashflow.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th scope="col" className="py-2 font-medium">{t(locale, "reports.month")}</th>
                    <th scope="col" className="py-2 text-right font-medium">{t(locale, "dashboard.income")}</th>
                    <th scope="col" className="py-2 text-right font-medium">{t(locale, "dashboard.expense")}</th>
                    <th scope="col" className="py-2 text-right font-medium">{t(locale, "common.net")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...data.cashflow].reverse().map((point) => {
                    const net = point.income - point.expense;
                    return (
                      <tr key={point.month}>
                        <th scope="row" className="py-2 text-left font-medium">{point.month}</th>
                        <td className="numeric py-2 text-right text-positive">{money(point.income, currency, locale, currency)}</td>
                        <td className="numeric py-2 text-right text-negative">{money(point.expense, currency, locale, currency)}</td>
                        <td className={`numeric py-2 text-right font-medium ${net < 0n ? "text-negative" : "text-positive"}`}>
                          {money(net, currency, locale, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title={t(locale, "reports.emptyMonthlyTitle")}
              description={t(locale, "reports.emptyMonthlyDescription")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}
