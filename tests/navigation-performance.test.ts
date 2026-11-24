import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("dashboard navigation responsiveness", () => {
  it("removes numbered indices from the primary navigation", () => {
    const chrome = source("src/components/layout/app-chrome.tsx");
    expect(chrome).not.toContain("nav-index");
    expect(chrome).not.toMatch(/String\(index \+ 1\)\.padStart/);
    expect(chrome).not.toMatch(/\{index \+ 1\}/);

    const css = source("src/app/globals.css");
    expect(css).not.toContain(".nav-index");
  });

  it("keeps the shell mounted while a page loads", () => {
    const layout = source("src/app/(app)/layout.tsx");
    expect(layout).not.toContain("AppShellSkeleton");
    expect(layout).toContain("Suspense");
    expect(layout).toContain("fallback={<PageSkeleton />}");
    expect(layout).toContain("<AppShell>{children}</AppShell>");

    const loading = source("src/app/(app)/loading.tsx");
    expect(loading).toContain("PageSkeleton");
    expect(loading).not.toContain("AppShellSkeleton");

    const chrome = source("src/components/layout/app-chrome.tsx");
    expect(chrome).not.toMatch(/key=\{pathname\}/);
  });

  it("loads only the unread count for the shell badge", () => {
    const shell = source("src/components/layout/app-shell.tsx");
    expect(shell).toContain("countUnreadNotifications");
    expect(shell).not.toContain("listNotifications");

    const notifications = source("src/lib/services/notifications.ts");
    expect(notifications).toMatch(/export async function countUnreadNotifications/);
    expect(notifications).toMatch(/prisma\.notification\.count\(\{ where: \{ userId, read: false \} \}\)/);
  });

  it("dedupes the current user lookup within a server request", () => {
    const auth = source("src/lib/auth.ts");
    expect(auth).toContain('from "react"');
    expect(auth).toMatch(/export const getCurrentUser = cache\(/);
  });

  it("prefetches full route data for every primary navigation link", () => {
    const chrome = source("src/components/layout/app-chrome.tsx");
    expect(chrome.match(/prefetch=\{true\}/g)).toHaveLength(3);

    const moreMenu = source("src/components/layout/mobile-more-menu.tsx");
    expect(moreMenu).toContain("prefetch={true}");
  });

  it("caches authenticated page content so revisits resolve from the client router cache", () => {
    const pages = [
      "dashboard",
      "transactions",
      "accounts",
      "budgets",
      "goals",
      "debts",
      "recurring",
      "reports",
      "notifications",
      "settings",
    ];
    for (const page of pages) {
      const content = source(`src/app/(app)/${page}/page.tsx`);
      expect(content, page).toContain('use cache: private');
      expect(content, page).toContain('from "next/cache"');
      expect(content, page).toMatch(/cacheLife\(\{ stale: \d+ \}\)/);
    }
  });
});
