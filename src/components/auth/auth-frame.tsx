"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

interface AuthFrameProps {
  children: React.ReactNode;
  width?: "signIn" | "signUp";
}

/** Midnight vault shell for Clerk sign-in and sign-up surfaces. */
export function AuthFrame({ children, width = "signIn" }: AuthFrameProps) {
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

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 pb-16 pt-8 sm:px-8">
        <p className="hero-eyebrow mb-5 justify-center">{t(locale, "landing.privateChip")}</p>
        <section
          className={cn(
            "auth-sheet vault-panel w-full p-6 sm:p-10",
            width === "signIn" ? "max-w-md" : "max-w-lg",
          )}
          aria-label={t(locale, "app.name")}
        >
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="font-mono text-xs tracking-[0.04em] text-candy-sky">01 / ACCESS</p>
              <p className="mt-1 text-xs text-fog">{t(locale, "landing.dataScoped")}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-button)] bg-indigo-surface text-brand-accent">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
          </div>
          {children}
        </section>
        <p className="mt-6 max-w-md text-center text-xs leading-relaxed text-mist">
          {t(locale, "landing.sampleData")}
        </p>
      </div>
    </main>
  );
}
