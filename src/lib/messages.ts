import { isTranslationKey, t, translations, type Locale, type TranslationKey } from "./i18n";

/**
 * Server-side messages are authored once in English at the validation/service
 * boundary, then resolved to the requesting user's language here. This keeps
 * the shared domain layer locale-agnostic while every user-visible string is
 * still translated through the same ten-locale catalog as the UI.
 */
const englishToKey = new Map<string, TranslationKey>();

for (const key of Object.keys(translations) as TranslationKey[]) {
  const english = t("en", key);
  if (!englishToKey.has(english)) englishToKey.set(english, key);
}

/** Translate a known catalog message; pass unknown messages through unchanged. */
export function localizeMessage(message: string | undefined, locale: Locale): string | undefined {
  if (!message) return message;
  const key = englishToKey.get(message);
  return key ? t(locale, key) : message;
}

interface CatalogMessageSource {
  message: string;
  messageKey?: TranslationKey;
  messageParams?: Record<string, string>;
}

/** Resolve an ApiError that may carry an explicit catalog key and parameters. */
export function localizeCatalogMessage(source: CatalogMessageSource, locale: Locale): string {
  if (!source.messageKey) {
    return localizeMessage(source.message, locale) ?? source.message;
  }
  const params = { ...source.messageParams };
  const resourceKey = params.resourceKey;
  if (resourceKey && isTranslationKey(resourceKey)) {
    params.resource = t(locale, resourceKey);
    delete params.resourceKey;
  }
  return t(locale, source.messageKey, params);
}
