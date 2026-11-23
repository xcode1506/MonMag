import { Suspense } from "react";
import { RecurringView, type RecurringRow } from "@/components/pages/recurring-view";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { requireUser } from "@/lib/auth";
import { toDateInput, todayInAppTimezone } from "@/lib/date";
import { listAccounts } from "@/lib/services/accounts";
import { listCategories } from "@/lib/services/categories";
import { listRecurring } from "@/lib/services/recurring";
import { localeOf } from "@/lib/ui";
import { toRecurringRow } from "@/lib/view-models/recurring";

async function RecurringContent() {
  const user = await requireUser();
  const [rules, accounts, categories] = await Promise.all([
    listRecurring(user.id),
    listAccounts(user.id),
    listCategories(user.id),
  ]);
  const currency = user.preferredCurrency;
  const rows: RecurringRow[] = rules.map((rule) =>
    toRecurringRow(rule, currency),
  );

  return (
    <RecurringView
      rows={rows}
      accounts={accounts.map((account) => ({
        value: account.id,
        label: account.name,
        currency: account.currency,
      }))}
      categories={categories.map((category) => ({ value: category.id, label: category.name }))}
      currency={currency}
      locale={localeOf(user.preferredLanguage)}
      timezone={user.timezone}
      today={toDateInput(todayInAppTimezone())}
    />
  );
}

export default function RecurringPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RecurringContent />
    </Suspense>
  );
}
