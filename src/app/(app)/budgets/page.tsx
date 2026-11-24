import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { BudgetsView, type BudgetRow } from "@/components/pages/budgets-view";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { requireUser } from "@/lib/auth";
import { toDateInput, todayInAppTimezone } from "@/lib/date";
import { listCategories } from "@/lib/services/categories";
import { listBudgets } from "@/lib/services/budgets";
import { amountInput, localeOf } from "@/lib/ui";

async function BudgetsContent() {
  "use cache: private";
  cacheLife({ stale: 60 });

  const user = await requireUser();
  const [budgets, categories] = await Promise.all([
    listBudgets(user.id),
    listCategories(user.id, "EXPENSE"),
  ]);
  const rows: BudgetRow[] = budgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    categoryName: budget.category?.name ?? null,
    categoryId: budget.categoryId,
    amount: amountInput(budget.amount, user.preferredCurrency),
    spent: amountInput(budget.spent, user.preferredCurrency),
    remaining: amountInput(budget.remaining, user.preferredCurrency),
    period: budget.period,
    startDate: toDateInput(budget.startDate),
    endDate: budget.endDate ? toDateInput(budget.endDate) : null,
    alertThreshold: budget.alertThreshold,
    state: budget.state,
    percent: budget.percent,
  }));

  return (
    <BudgetsView
      rows={rows}
      categories={categories.map((category) => ({ value: category.id, label: category.name }))}
      currency={user.preferredCurrency}
      locale={localeOf(user.preferredLanguage)}
      today={toDateInput(todayInAppTimezone())}
    />
  );
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BudgetsContent />
    </Suspense>
  );
}
