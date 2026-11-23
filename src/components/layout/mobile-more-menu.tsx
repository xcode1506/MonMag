"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ElementType } from "react";
import Link from "next/link";
import {
  Bell,
  ChartNoAxesCombined,
  MoreHorizontal,
  PiggyBank,
  Repeat2,
  Settings,
  Tag,
} from "lucide-react";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";

const secondaryLinks: Array<{ href: string; label: TranslationKey; icon: ElementType }> = [
  { href: "/goals", label: "nav.goals", icon: PiggyBank },
  { href: "/debts", label: "nav.debts", icon: Tag },
  { href: "/recurring", label: "nav.recurring", icon: Repeat2 },
  { href: "/reports", label: "nav.reports", icon: ChartNoAxesCombined },
  { href: "/notifications", label: "nav.notifications", icon: Bell },
  { href: "/settings", label: "nav.settings", icon: Settings },
];

export function MobileMoreMenu({ locale, unread }: { locale: Locale; unread: number }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t(locale, "nav.more")}
          className="mobile-tabbar-link"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
          <span>{t(locale, "nav.more")}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="end"
          sideOffset={12}
          className="z-60 min-w-56 inset-control rounded-[var(--radius-card)] border bg-card p-1.5 text-card-foreground"
        >
          {secondaryLinks.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenu.Item asChild key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-[var(--radius-button)] px-3 py-2 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted data-[highlighted]:bg-muted"
                >
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1">{t(locale, item.label)}</span>
                  {item.href === "/notifications" && unread > 0 ? (
                    <span className="numeric rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-brand-foreground">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
