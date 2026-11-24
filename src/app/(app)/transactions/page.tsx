import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { TransactionsView } from "@/components/pages/transactions-view";
import { requireUser } from "@/lib/auth";
import { parseDateInput, toDateInput, todayInAppTimezone } from "@/lib/date";
import { listAccounts } from "@/lib/services/accounts";
import { listCategories } from "@/lib/services/categories";
import { listTransactions } from "@/lib/services/transactions";
import { toTransactionRow } from "@/lib/view-models/transactions";
import { localeOf } from "@/lib/ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

async function TransactionsContent({ searchParams }: { searchParams: SearchParams }) {
  "use cache: private";
  cacheLife({ stale: 60 });

  const params = await searchParams;
  const user = await requireUser();
  const locale = localeOf(user.preferredLanguage);
  const filters = {
    search: first(params.search).slice(0, 120),
    type: first(params.type) === "INCOME" || first(params.type) === "EXPENSE" ? first(params.type) : "",
    accountId: first(params.accountId),
    categoryId: first(params.categoryId),
    from: first(params.from),
    to: first(params.to),
  };

  const [accounts, categories] = await Promise.all([
    listAccounts(user.id),
    listCategories(user.id),
  ]);
  const { items, total } = await listTransactions(user.id, {
    search: filters.search || undefined,
    type: filters.type ? (filters.type as "INCOME" | "EXPENSE") : undefined,
    accountId: filters.accountId || undefined,
    categoryId: filters.categoryId || undefined,
    from: parseDateInput(filters.from) ?? undefined,
    to: parseDateInput(filters.to) ?? undefined,
    take: 100,
  });

  const exportQuery = new URLSearchParams();
  if (filters.from) exportQuery.set("from", filters.from);
  if (filters.to) exportQuery.set("to", filters.to);

  return (
    <TransactionsView
      rows={items.map(toTransactionRow)}
      total={total}
      accounts={accounts.map((account) => ({
        value: account.id,
        label: account.name,
        currency: account.currency,
      }))}
      categories={categories.map((category) => ({
        value: category.id,
        label: `${category.type === "INCOME" ? "+" : ""}${category.name}`,
      }))}
      categoriesWithType={categories.map((category) => ({
        value: category.id,
        label: category.name,
        type: category.type,
        isDefault: category.isDefault,
        color: category.color,
      }))}
      currency={user.preferredCurrency}
      locale={locale}
      today={toDateInput(todayInAppTimezone())}
      exportHref={`/api/transactions/export${exportQuery.size ? `?${exportQuery.toString()}` : ""}`}
      filters={filters}
      autoOpen={first(params.new) === "1"}
      timezone={user.timezone}
    />
  );
}

export default function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TransactionsContent searchParams={searchParams} />
    </Suspense>
  );
}
