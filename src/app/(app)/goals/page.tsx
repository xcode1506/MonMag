import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { GoalsView, type GoalRow } from "@/components/pages/goals-view";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { requireUser } from "@/lib/auth";
import { toDateInput, todayInAppTimezone } from "@/lib/date";
import { listGoals } from "@/lib/services/goals";
import { amountInput, localeOf } from "@/lib/ui";

async function GoalsContent() {
  "use cache: private";
  cacheLife({ stale: 60 });

  const user = await requireUser();
  const goals = await listGoals(user.id);
  const rows: GoalRow[] = goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    description: goal.description,
    targetAmount: amountInput(goal.targetAmount, user.preferredCurrency),
    currentAmount: amountInput(goal.currentAmount, user.preferredCurrency),
    targetDate: goal.targetDate ? toDateInput(goal.targetDate) : null,
    status: goal.status,
    color: goal.color,
    progress: goal.progress * 100,
    contributions: goal.contributions.map((contribution) => ({
      id: contribution.id,
      amount: amountInput(contribution.amount, user.preferredCurrency),
      note: contribution.note,
      createdAt: contribution.createdAt.toISOString(),
    })),
  }));

  return (
    <GoalsView
      rows={rows}
      currency={user.preferredCurrency}
      locale={localeOf(user.preferredLanguage)}
      today={toDateInput(todayInAppTimezone())}
      timezone={user.timezone}
    />
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GoalsContent />
    </Suspense>
  );
}
