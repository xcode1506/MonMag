"use client";

import type { ActionResult } from "@/lib/action-result";
import { useClientLocale } from "@/lib/client-locale";
import { t, type Locale } from "@/lib/i18n";
import { localizeMessage } from "@/lib/messages";

export function FormStatus({
  state,
  pending,
  successMessage,
  locale: localeProp,
}: {
  state: ActionResult | null;
  pending: boolean;
  successMessage?: string;
  locale?: Locale;
}) {
  const browserLocale = useClientLocale();
  const locale = localeProp ?? browserLocale;

  if (pending) {
    return (
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        {t(locale, "common.saving")}
      </p>
    );
  }
  if (state && !state.ok) {
    return (
      <p className="text-sm text-negative" role="alert" aria-live="assertive">
        {state.error}
      </p>
    );
  }
  if (state?.ok) {
    const message = state.message
      ? localizeMessage(state.message, locale) ?? state.message
      : successMessage
        ? localizeMessage(successMessage, locale) ?? successMessage
        : t(locale, "common.saved");
    return (
      <p className="text-sm text-positive" role="status" aria-live="polite">
        {message}
      </p>
    );
  }
  return null;
}
