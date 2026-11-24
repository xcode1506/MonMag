import { Suspense } from "react";
import { cacheLife } from "next/cache";
import {
  NotificationsView,
  type NotificationRow,
} from "@/components/pages/notifications-view";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/services/notifications";
import { localeOf } from "@/lib/ui";

async function NotificationsContent() {
  "use cache: private";
  cacheLife({ stale: 300 });

  const user = await requireUser();
  const { items, unread } = await listNotifications(user.id);
  const rows: NotificationRow[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    type: item.type,
    read: item.read,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <NotificationsView
      rows={rows}
      unread={unread}
      locale={localeOf(user.preferredLanguage)}
      timezone={user.timezone}
    />
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotificationsContent />
    </Suspense>
  );
}
