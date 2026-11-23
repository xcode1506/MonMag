"use client";

import * as React from "react";
import { localeOf, type Locale } from "@/lib/i18n";

const SERVER_LOCALE: Locale = "en";

/** Browser language is stable for a page session, so there is nothing to subscribe to. */
function subscribe(_onStoreChange: () => void): () => void {
  return () => {};
}

function getSnapshot(): Locale {
  if (typeof navigator === "undefined") return SERVER_LOCALE;
  return localeOf(navigator.language);
}

function getServerSnapshot(): Locale {
  return SERVER_LOCALE;
}

/**
 * Best-effort locale for surfaces that render outside the authenticated shell
 * (error boundaries, not-found, Suspense fallbacks, shared dialogs).
 *
 * Uses the English default on the server and during hydration, then the
 * browser locale once the client store is read. Inside the authenticated app
 * the user's stored preference is passed as a prop and remains the source of
 * truth.
 */
export function useClientLocale(): Locale {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
