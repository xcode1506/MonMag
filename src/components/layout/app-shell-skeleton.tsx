"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

export function AppShellSkeleton() {
  const locale = useClientLocale();

  return (
    <div
      className="min-h-dvh bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]"
      aria-busy="true"
      aria-label={t(locale, "aria.loadingPage")}
    >
      <div className="hidden h-dvh border-r bg-sidebar p-5 lg:block">
        <Skeleton className="h-9 w-full bg-sidebar-active" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full bg-sidebar-active" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-16 border-b bg-card px-6 py-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-6 p-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
    </div>
  );
}
