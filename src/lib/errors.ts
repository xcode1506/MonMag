import { t, type TranslationKey } from "./i18n";

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "conflict"
  | "rate_limited"
  | "internal_error";

/** Catalog keys for the resource names used in ownership/not-found errors. */
const RESOURCE_KEYS: Record<string, TranslationKey> = {
  Account: "common.account",
  "Default account": "common.account",
  Category: "common.category",
  Budget: "resource.budget",
  Debt: "resource.debt",
  "Savings goal": "resource.savingsGoal",
  Notification: "resource.notification",
  "Recurring transaction": "resource.recurringTransaction",
  Transaction: "resource.transaction",
  Transfer: "resource.transfer",
  Resource: "resource.resource",
};

export function resourceKey(resource: string): TranslationKey {
  return RESOURCE_KEYS[resource] ?? "resource.resource";
}

/** Application error with an explicit HTTP-safe code and message. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  /** Catalog key and params let the presentation layer localize safely. */
  readonly messageKey?: TranslationKey;
  readonly messageParams?: Record<string, string>;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    messageKey?: TranslationKey,
    messageParams?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.messageKey = messageKey;
    this.messageParams = messageParams;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/** Build an ApiError whose message comes from the ten-locale catalog. */
export function localizedError(
  status: number,
  code: ErrorCode,
  key: TranslationKey,
  params: Record<string, string> = {},
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError(status, code, t("en", key, params), details, key, params);
}

export const unauthorizedError = () =>
  localizedError(401, "unauthorized", "error.unauthorized");

export const forbiddenError = () =>
  localizedError(403, "forbidden", "error.forbidden");

export const notFoundError = (resource = "Resource") => {
  const key = resourceKey(resource);
  return localizedError(404, "not_found", "error.notFound", {
    resource: t("en", key),
    resourceKey: key,
  });
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  console.error("[monmag] unexpected error", error);
  return localizedError(500, "internal_error", "error.unexpected");
}
