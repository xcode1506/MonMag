"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

/** Minimal midnight shell: Clerk owns the entire sign-in/sign-up card. */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  const locale = useClientLocale();

  return (
    <main className="auth-page flex min-h-dvh flex-col bg-background">
      <header className="auth-masthead mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="system-seal" aria-hidden="true">
            MM
          </span>
          <span>
            <span className="block font-display text-xl font-semibold leading-none tracking-[-0.02em]">
              MonMag
            </span>
            <span className="mt-1 block text-[0.625rem] font-normal uppercase tracking-[0.04em] text-mist">
              {t(locale, "app.name")} / PRIVATE ACCESS
            </span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full flex-1 items-center justify-center px-5 pb-16 pt-8 sm:px-8">
        {children}
      </div>
    </main>
  );
}
