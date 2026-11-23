import type { TranslationKey } from "@/lib/i18n";

/** Maps the currently resolved appearance to the label for the next toggle action. */
export function themeActionKey(resolvedTheme: string | undefined): TranslationKey {
  return resolvedTheme === "dark" ? "theme.switchToDay" : "theme.switchToNight";
}
