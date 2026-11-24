import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
