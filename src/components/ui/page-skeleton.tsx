"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

export function PageSkeleton() {
  const locale = useClientLocale();
  return (
    <div className="space-y-6" aria-busy="true" aria-label={t(locale, "aria.loadingPage")}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
