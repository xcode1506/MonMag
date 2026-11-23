import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppShellSkeleton } from "@/components/layout/app-shell-skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
