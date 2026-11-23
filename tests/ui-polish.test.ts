import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES, t } from "@/lib/i18n";
import { nextActionFor } from "@/lib/dashboard-focus";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const focusContext = {
  accountCount: 1,
  unreadNotifications: 0,
  budgets: [] as Array<{ state: string; percent: number }>,
  monthNet: 100n,
  monthTransactionCount: 4,
};

describe("dashboard next action", () => {
  it("prioritizes an account when the ledger cannot show balances", () => {
    expect(nextActionFor({ ...focusContext, accountCount: 0 })).toEqual({
      key: "addAccount",
      href: "/accounts",
      labelKey: "accounts.new",
    });
  });

  it("prioritizes an over-budget warning before softer signals", () => {
    expect(
      nextActionFor({
        ...focusContext,
        unreadNotifications: 3,
        budgets: [{ state: "exceeded", percent: 112 }],
      }),
    ).toMatchObject({ key: "reviewBudget", href: "/budgets" });
  });

  it("uses unread alerts, negative cash flow, and empty months in order", () => {
    expect(nextActionFor({ ...focusContext, unreadNotifications: 2 })).toMatchObject({
      key: "reviewAlerts",
      href: "/notifications",
    });
    expect(nextActionFor({ ...focusContext, monthNet: -50n })).toMatchObject({
      key: "reviewSpending",
      href: "/transactions",
    });
    expect(nextActionFor({ ...focusContext, monthTransactionCount: 0 })).toMatchObject({
      key: "recordTransaction",
      href: "/transactions?new=1",
    });
  });

  it("falls back to the monthly trend when the ledger is current", () => {
    expect(nextActionFor(focusContext)).toEqual({
      key: "viewReports",
      href: "/reports",
      labelKey: "reports.trend",
    });
  });
});

describe("responsive navigation and motion contract", () => {
  it("ships a mobile tab bar, active state, and route-level page transition", () => {
    const chrome = source("src/components/layout/app-chrome.tsx");
    expect(chrome).toMatch(/mobile-tabbar/);
    expect(chrome).toMatch(/MobileMoreMenu/);
    expect(chrome).toMatch(/data-active=\{active \? "true" : undefined\}/);
    expect(chrome).toMatch(/aria-current=\{active \? "page" : undefined\}/);
    expect(chrome).toMatch(/key=\{pathname\}/);
    expect(chrome).toMatch(/pb-24 sm:pb-8/);
  });

  it("uses a keyboard-accessible responsive dropdown for secondary links", () => {
    const menu = source("src/components/layout/mobile-more-menu.tsx");
    expect(menu).toMatch(/@radix-ui\/react-dropdown-menu/);
    expect(menu).toMatch(/DropdownMenu\.Trigger asChild/);
    expect(menu).toMatch(/DropdownMenu\.Item asChild/);
    expect(menu).toMatch(/aria-label=\{t\(locale, "nav\.more"\)\}/);
    expect(menu).toMatch(/side="top"/);
  });

  it("defines restrained transitions and reduced-motion fallbacks once", () => {
    const css = source("src/app/globals.css");
    expect(css).toMatch(/\.app-nav-link\[data-active="true"\]/);
    expect(css).toMatch(/\.mobile-tabbar/);
    expect(css).toMatch(/@keyframes dialog-panel-in/);
    expect(css).toMatch(/@keyframes ledger-progress/);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
    expect(css).toMatch(/\.cashflow-chart \.recharts-yAxis/);
    expect(css).not.toMatch(/animation:\s*float/i);
  });

  it("gives buttons and dialogs subtle press and enter feedback", () => {
    const button = source("src/components/ui/button.tsx");
    const modal = source("src/components/ui/modal.tsx");
    const confirm = source("src/components/ui/confirm-action-button.tsx");
    expect(button).toMatch(/active:scale-\[0\.985\]/);
    expect(modal).toMatch(/dialog-overlay/);
    expect(modal).toMatch(/dialog-panel/);
    expect(confirm).toMatch(/dialog-overlay/);
    expect(confirm).toMatch(/dialog-panel/);
  });

  it("animates progress from zero without client-side state", () => {
    const progress = source("src/components/ui/progress.tsx");
    expect(progress).toMatch(/progress-indicator/);
    expect(progress).not.toMatch(/useState/);
  });

  it("uses an editorial toast surface wired to shared action feedback", () => {
    const toaster = source("src/components/providers/toaster.tsx");
    const actionForm = source("src/components/forms/action-form.tsx");
    const confirm = source("src/components/ui/confirm-action-button.tsx");
    expect(toaster).toMatch(/ledger-toast/);
    expect(actionForm).toMatch(/useActionForm/);
    expect(confirm).toMatch(/toast\.(success|error)/);
  });
});

describe("content-state polish", () => {
  it("renders transactions as cards on small screens with clear recovery", () => {
    const view = source("src/components/pages/transactions-view.tsx");
    expect(view).toMatch(/transaction-table-shell hidden sm:block/);
    expect(view).toMatch(/transaction-card-list space-y-3 sm:hidden/);
    expect(view).toMatch(/action\.clearFilters/);
  });

  it("adds a readable category breakdown and compact chart classes", () => {
    const charts = source("src/components/charts/charts.tsx");
    expect(charts).toMatch(/cashflow-chart/);
    expect(charts).toMatch(/category-chart/);
    expect(charts).toMatch(/category-breakdown/);
    expect(charts).toMatch(/money\(/);
  });

  it("puts the four money answers and next move in the dashboard first viewport", () => {
    const dashboard = source("src/app/(app)/dashboard/page.tsx");
    for (const key of [
      "dashboard.onHand",
      "dashboard.earned",
      "dashboard.spent",
      "dashboard.saved",
      "dashboard.nextMove",
    ]) {
      expect(dashboard).toContain(key);
    }
    expect(dashboard).toMatch(/nextActionFor\(/);
  });

  it("keeps loading and error states announced and recoverable", () => {
    const skeleton = source("src/components/layout/app-shell-skeleton.tsx");
    const appError = source("src/app/(app)/error.tsx");
    const pageSkeleton = source("src/components/ui/page-skeleton.tsx");
    expect(skeleton).toMatch(/aria-busy="true"/);
    expect(appError).toMatch(/reset\(\)/);
    expect(pageSkeleton).toMatch(/aria-busy="true"/);
  });
});

describe("new polish copy", () => {
  const keys = [
    "dashboard.onHand",
    "dashboard.earned",
    "dashboard.spent",
    "dashboard.saved",
    "dashboard.nextMove",
    "nav.more",
    "action.clearFilters",
  ] as const;

  it.each(keys)("localizes %s in all ten locales", (key) => {
    for (const locale of LOCALES) {
      const value = t(locale, key);
      expect(value).toBeTruthy();
      expect(value).not.toBe(key);
    }
  });

  it("uses plain labels that fit a compact navigation item", () => {
    expect(t("en", "dashboard.onHand")).toBe("On hand");
    expect(t("en", "dashboard.earned")).toBe("Earned");
    expect(t("en", "dashboard.spent")).toBe("Spent");
    expect(t("en", "dashboard.saved")).toBe("Saved");
    expect(t("en", "dashboard.nextMove")).toBe("Next move");
    expect(t("en", "nav.more")).toBe("More");
    expect(t("en", "action.clearFilters")).toBe("Clear filters");
  });
});
