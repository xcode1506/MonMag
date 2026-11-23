import type { TranslationKey } from "@/lib/i18n";

export interface NextAction {
  key: "addAccount" | "reviewBudget" | "reviewAlerts" | "reviewSpending" | "recordTransaction" | "viewReports";
  href: string;
  labelKey: TranslationKey;
}

export interface DashboardFocusContext {
  accountCount: number;
  unreadNotifications: number;
  budgets: ReadonlyArray<{ state: string; percent: number }>;
  monthNet: bigint;
  monthTransactionCount: number;
}

/**
 * Picks the single most useful next step from data already loaded by the
 * dashboard. The order favors blockers and risks before optional exploration.
 */
export function nextActionFor(context: DashboardFocusContext): NextAction {
  if (context.accountCount <= 0) {
    return { key: "addAccount", href: "/accounts", labelKey: "accounts.new" };
  }

  const exceeded = context.budgets.find((budget) => budget.state === "exceeded");
  if (exceeded) {
    return { key: "reviewBudget", href: "/budgets", labelKey: "nav.budgets" };
  }

  if (context.unreadNotifications > 0) {
    return { key: "reviewAlerts", href: "/notifications", labelKey: "nav.notifications" };
  }

  if (context.monthNet < 0n) {
    return { key: "reviewSpending", href: "/transactions", labelKey: "nav.transactions" };
  }

  if (context.monthTransactionCount <= 0) {
    return { key: "recordTransaction", href: "/transactions?new=1", labelKey: "transactions.new" };
  }

  return { key: "viewReports", href: "/reports", labelKey: "reports.trend" };
}
