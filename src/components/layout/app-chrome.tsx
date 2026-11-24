"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Bell,
  ChartNoAxesCombined,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Repeat2,
  Settings,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileMoreMenu } from "./mobile-more-menu";
import { cn } from "@/lib/utils";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";

const navItems: Array<{ href: string; label: TranslationKey; icon: React.ElementType }> = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "nav.transactions", icon: CreditCard },
  { href: "/accounts", label: "nav.accounts", icon: Wallet },
  { href: "/budgets", label: "nav.budgets", icon: HandCoins },
  { href: "/goals", label: "nav.goals", icon: PiggyBank },
  { href: "/debts", label: "nav.debts", icon: Tag },
  { href: "/recurring", label: "nav.recurring", icon: Repeat2 },
  { href: "/reports", label: "nav.reports", icon: ChartNoAxesCombined },
  { href: "/notifications", label: "nav.notifications", icon: Bell },
  { href: "/settings", label: "nav.settings", icon: Settings },
];

const mobileNavItems = navItems.slice(0, 4);

interface AppChromeProps {
  children: React.ReactNode;
  name: string;
  email: string;
  locale: Locale;
  unread: number;
}

export function AppChrome({ children, name, email, locale, unread }: AppChromeProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const currentSection = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const currentLabel = currentSection ? t(locale, currentSection.label) : t(locale, "app.category");

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="app-brandmark" aria-hidden="true">
          <span>MM</span>
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-none tracking-tight">
            {t(locale, "app.name")}
          </p>
          <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-sidebar-muted">
            PRIVATE
          </p>
        </div>
      </div>

      <nav
        aria-label={t(locale, "aria.primaryNavigation")}
        className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5"
      >
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
          {t(locale, "app.category")}
        </p>
        {navItems.map((item, index) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <React.Fragment key={item.href}>
              {index === 4 || index === 8 ? (
                <div className="mx-3 my-3 border-t border-sidebar-border" aria-hidden="true" />
              ) : null}
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                data-active={active ? "true" : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "app-nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-sidebar-active text-sidebar-strong"
                    : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{t(locale, item.label)}</span>
                {item.href === "/notifications" && unread > 0 ? (
                  <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-brand-foreground">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-sidebar-border bg-sidebar-active font-display text-sm text-sidebar-strong">
            {name.trim().charAt(0).toUpperCase() || "M"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-sidebar-muted">{email}</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-sidebar-border lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t(locale, "aria.closeNavigation")}
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="vault-panel absolute inset-y-0 left-0 w-[280px]">
            <ButtonClose locale={locale} onClick={() => setMobileOpen(false)} />
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="app-topbar sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="hidden rounded-[var(--radius-button)] p-2 text-fog transition-colors hover:bg-indigo-surface hover:text-foreground sm:inline-flex"
            aria-label={t(locale, "aria.openNavigation")}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="header-context">
              <span>{t(locale, "app.name")}</span>
              <span className="header-context-divider" aria-hidden="true">/</span>
              <span className="truncate">{currentLabel}</span>
            </p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {t(locale, "app.tagline")}
            </p>
          </div>
          <ThemeToggle locale={locale} />
          <Link
            href="/notifications"
            aria-label={`${t(locale, "nav.notifications")}${unread > 0 ? ` (${unread})` : ""}`}
            className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-5" />
            {unread > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-negative" />
            ) : null}
          </Link>
          <React.Suspense fallback={<Skeleton className="size-9 rounded-full" />}>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-9",
                },
              }}
            />
          </React.Suspense>
        </header>
        <main className="app-canvas mx-auto w-full max-w-[1400px] flex-1 space-y-8 px-4 pt-6 pb-24 sm:pb-8 sm:px-6 sm:pt-8">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>

      <nav className="mobile-tabbar sm:hidden" aria-label={t(locale, "aria.primaryNavigation")}>
        {mobileNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active ? "true" : undefined}
              aria-current={active ? "page" : undefined}
              className="mobile-tabbar-link"
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{t(locale, item.label)}</span>
              {item.href === "/notifications" && unread > 0 ? (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-negative" />
              ) : null}
            </Link>
          );
        })}
        <MobileMoreMenu locale={locale} unread={unread} />
      </nav>
    </div>
  );
}

function ButtonClose({ locale, onClick }: { locale: Locale; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t(locale, "aria.closeNavigation")}
      className="absolute right-2 top-2 z-10 rounded-[var(--radius-button)] p-2 text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-foreground"
    >
      <X className="size-4" />
    </button>
  );
}
