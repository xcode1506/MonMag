import { ZodError } from "zod";
import { isTranslationKey, t, type Locale, type TranslationKey } from "./i18n";
import { localizeCatalogMessage, localizeMessage } from "./messages";
import { ApiError } from "./errors";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function formObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    result[key] = trimmed === "" ? null : trimmed;
  }
  return result;
}

/** Cast parsed form data to a validation input type; Zod still validates at runtime. */
export function formValues<T>(formData: FormData): T {
  return formObject(formData) as T;
}

/** Next.js uses a digest prefix for redirect control flow; do not convert it to an error result. */
function isNextRedirect(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

type LocaleSource = Locale | (() => Locale | Promise<Locale>);

async function resolveLocale(source: LocaleSource): Promise<Locale> {
  return typeof source === "function" ? await source() : source;
}

function resolveSuccessMessage(
  message: TranslationKey | string | undefined,
  locale: Locale,
): string | undefined {
  if (isTranslationKey(message)) return t(locale, message);
  return localizeMessage(message, locale);
}

export async function runAction(
  operation: () => Promise<ActionResult | void>,
  successMessage?: TranslationKey | string,
  locale: LocaleSource = "en",
): Promise<ActionResult> {
  try {
    const result = await operation();
    const activeLocale = await resolveLocale(locale);
    return result ?? { ok: true, message: resolveSuccessMessage(successMessage, activeLocale) };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const activeLocale = await resolveLocale(locale);
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "form";
        fieldErrors[key] = [
          ...(fieldErrors[key] ?? []),
          localizeMessage(issue.message, activeLocale) ?? issue.message,
        ];
      }
      return {
        ok: false,
        error: t(activeLocale, "validation.checkHighlighted"),
        fieldErrors,
      };
    }
    // ApiError messages are explicit, client-safe messages for expected
    // business/authorization failures. Everything else may contain Prisma or
    // driver details, so log it server-side and return a fixed generic string.
    if (error instanceof ApiError && error.status < 500) {
      return { ok: false, error: localizeCatalogMessage(error, activeLocale) };
    }
    console.error("[monmag] action failed", error);
    return {
      ok: false,
      error: t(activeLocale, "error.actionFailed"),
    };
  }
}
