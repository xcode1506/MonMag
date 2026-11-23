import { Suspense } from "react";
import { AccountsView, type AccountRow } from "@/components/pages/accounts-view";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { requireUser } from "@/lib/auth";
import { listAccounts } from "@/lib/services/accounts";
import { amountInput, localeOf } from "@/lib/ui";

async function AccountsContent() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);
  const rows: AccountRow[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    currency: account.currency,
    balance: amountInput(account.balance, account.currency),
    initialBalance: amountInput(account.initialBalance, account.currency),
    creditLimit: account.creditLimit ? amountInput(account.creditLimit, account.currency) : null,
    color: account.color,
    icon: account.icon,
    description: account.description,
    archived: account.archived,
  }));
  const total = accounts.reduce((sum, account) => sum + account.balance, 0n);

  return (
    <AccountsView
      rows={rows}
      currency={user.preferredCurrency}
      locale={localeOf(user.preferredLanguage)}
      total={amountInput(total, user.preferredCurrency)}
    />
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AccountsContent />
    </Suspense>
  );
}
