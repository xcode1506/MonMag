"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(app)/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { t, type Locale } from "@/lib/i18n";
import { date, label, tone } from "@/lib/ui";

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsView({
  rows,
  unread,
  locale,
  timezone = "Asia/Jakarta",
}: {
  rows: NotificationRow[];
  unread: number;
  locale: Locale;
  timezone?: string;
}) {
  const router = useRouter();
  const refresh = React.useCallback(() => router.refresh(), [router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "notifications.heading")}
        description={t(locale, "notifications.subheading")}
        actions={unread > 0 ? (
          <ActionForm
            action={markAllNotificationsReadAction}
            submitLabel={t(locale, "action.markAllRead")}
            onSuccess={refresh}
          >
            <span className="sr-only">{t(locale, "action.markAllRead")}</span>
          </ActionForm>
        ) : undefined}
      />

      {rows.length ? (
        <Card>
          <CardContent className="divide-y p-0">
            {rows.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${
                  item.read ? "" : "bg-brand/5"
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-button)] bg-muted text-muted-foreground" aria-hidden="true">
                    <Bell className="size-4" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      {!item.read ? <Badge variant="brand">{t(locale, "common.new")}</Badge> : null}
                      <Badge variant={tone(item.type)}>{label(item.type, locale)}</Badge>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {item.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {date(item.createdAt, locale, timezone)}
                    </p>
                  </div>
                </div>
                {!item.read ? (
                  <ActionForm
                    action={markNotificationReadAction}
                    submitLabel={t(locale, "action.markRead")}
                    submitAriaLabel={t(locale, "notifications.markReadItem", { name: item.title })}
                    className="[&>div]:pt-0"
                    onSuccess={refresh}
                  >
                    <input type="hidden" name="id" value={item.id} />
                  </ActionForm>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title={t(locale, "notifications.empty")}
          description={t(locale, "notifications.emptyHint")}
          icon={Bell}
        />
      )}
    </div>
  );
}
