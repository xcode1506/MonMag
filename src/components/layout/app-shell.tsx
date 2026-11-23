import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { localeOf } from "@/lib/i18n";
import { listNotifications } from "@/lib/services/notifications";
import { AppChrome } from "./app-chrome";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.onboardingCompleted) redirect("/onboarding");
  const { unread } = await listNotifications(user.id, 1);

  return (
    <AppChrome
      name={user.fullName}
      email={user.email}
      locale={localeOf(user.preferredLanguage)}
      unread={unread}
    >
      {children}
    </AppChrome>
  );
}
