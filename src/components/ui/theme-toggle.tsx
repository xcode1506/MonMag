"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useClientLocale } from "@/lib/client-locale";
import { t, type Locale } from "@/lib/i18n";
import { themeActionKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** Supplied inside the authenticated shell, where the stored preference is authoritative. */
  locale?: Locale;
  className?: string;
}

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Hydration-safe mount flag without a setState-in-effect render cascade. */
function useMounted(): boolean {
  return React.useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

/**
 * Day/night switch built on next-themes.
 *
 * The first paint uses a generic label because the resolved theme is only
 * known on the client. Mounting flips the label and knob to the real state,
 * which keeps server and client markup identical during hydration.
 */
export function ThemeToggle({ locale, className }: ThemeToggleProps) {
  const browserLocale = useClientLocale();
  const activeLocale = locale ?? browserLocale;
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = mounted && resolvedTheme === "dark";
  const label = t(
    activeLocale,
    mounted ? themeActionKey(resolvedTheme) : "theme.toggleAria",
  );

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={mounted ? isDark : undefined}
      title={label}
      data-state={isDark ? "dark" : "light"}
      onClick={() => {
        if (mounted) setTheme(isDark ? "light" : "dark");
      }}
      className={cn(
        "relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border border-border bg-muted px-1 text-muted-foreground transition-colors hover:border-brand/60 hover:text-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1 top-1 size-7 rounded-full bg-brand inset-control transition-transform duration-300 ease-out",
          isDark ? "translate-x-7" : "translate-x-0",
        )}
      />
      <Sun
        aria-hidden="true"
        className={cn(
          "relative z-10 size-3.5 transition-colors",
          !mounted || !isDark ? "text-brand-foreground" : "text-muted-foreground",
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          "relative z-10 ml-auto size-3.5 transition-colors",
          isDark ? "text-brand-foreground" : "text-muted-foreground",
        )}
      />
    </button>
  );
}
