import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { SettingsView } from "@/components/pages/settings-view";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { requireUser } from "@/lib/auth";
import { listAccounts } from "@/lib/services/accounts";
import { localeOf } from "@/lib/ui";

async function SettingsContent() {
  "use cache: private";
  cacheLife({ stale: 300 });

  const user = await requireUser();
  const accounts = await listAccounts(user.id);

  return (
    <SettingsView
      user={{
        fullName: user.fullName,
        email: user.email,
        preferredCurrency: user.preferredCurrency,
        preferredLanguage: user.preferredLanguage,
        timezone: user.timezone,
        dateFormat: user.dateFormat,
        firstDayOfWeek: user.firstDayOfWeek,
        defaultAccountId: user.defaultAccountId,
        theme: user.theme,
      }}
      accounts={accounts.map((account) => ({
        value: account.id,
        label: account.name,
      }))}
      locale={localeOf(user.preferredLanguage)}
      timezone={user.timezone}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
