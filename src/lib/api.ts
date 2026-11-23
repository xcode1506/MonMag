import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError, toApiError } from "./errors";
import { localeOf, type Locale } from "./i18n";
import { localizeCatalogMessage, localizeMessage } from "./messages";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(error: unknown, locale: Locale = "en") {
  const apiError = error instanceof ZodError
    ? new ApiError(422, "validation_error", "Validation failed", {
        issues: error.issues.map((issue) => ({
          ...issue,
          message: localizeMessage(issue.message, locale) ?? issue.message,
        })),
      })
    : toApiError(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: apiError.code,
        message: localizeCatalogMessage(apiError, locale),
        ...(apiError.details ? { details: apiError.details } : {}),
      },
    },
    { status: apiError.status },
  );
}

/** Next.js uses these digests for prerender control flow, not application failures. */
function isFrameworkControlError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return digest === "NEXT_PRERENDER_INTERRUPTED" || digest === "HANGING_PROMISE_REJECTION";
}

function localeFromArgs(args: unknown[]): Locale {
  for (const arg of args) {
    const headers = (arg as Request | undefined)?.headers;
    if (headers && typeof headers.get === "function") {
      return localeOf(headers.get("accept-language"));
    }
  }
  return "en";
}

/** Wrap a Route Handler with a consistent, localized error envelope. */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (isFrameworkControlError(error)) throw error;
      return fail(error, localeFromArgs(args));
    }
  };
}
