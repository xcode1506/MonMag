import { z } from "zod";
import { parseDateInput } from "./date";
import { LOCALES, t } from "./i18n";
import { isCurrencyCode, parseMoneyInput } from "./money";

const id = z.string().min(1, t("en", "validation.fieldRequired"));
export const entityIdSchema = id;
const optionalText = z.string().trim().max(500).optional().nullable();
const moneyValue = z.union([z.string(), z.number(), z.bigint()]);

export const currencyCodeSchema = z
  .string()
  .trim()
  .length(3)
  .refine(isCurrencyCode, { message: t("en", "validation.unsupportedCurrency") })
  .transform((value) => value.toUpperCase());

export const localeSchema = z.enum(LOCALES);

export const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, { message: t("en", "validation.unknownTimezone") });

/** Money schemas are currency-aware: BigInt stays in minor units. */
function moneyFor(currency: string) {
  return moneyValue.transform((value) => parseMoneyInput(value, currency));
}

function nonZeroMoneyFor(currency: string) {
  return moneyFor(currency).refine((value) => value !== 0n, {
    message: t("en", "validation.amountNonZero"),
  });
}

function positiveMoneyFor(currency: string) {
  return moneyFor(currency).refine((value) => value > 0n, {
    message: t("en", "validation.amountPositive"),
  });
}

/** Default IDR schemas retained for direct validation and tests. */
export const moneyMinor = nonZeroMoneyFor("IDR");
export const positiveMoneyMinor = positiveMoneyFor("IDR");

const dateString = z
  .string()
  .refine((value) => parseDateInput(value) !== null, {
    message: t("en", "validation.dateFormat"),
  })
  .transform((value) => parseDateInput(value)!);

function accountCurrency(raw: { currency?: string }): string {
  return raw.currency || "IDR";
}

const accountBaseSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["CASH", "BANK", "EWALLET", "SAVINGS", "CREDIT_CARD", "OTHER"]),
  currency: currencyCodeSchema.default("IDR"),
  initialBalance: moneyValue.default("0"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#2563EB"),
  icon: z.string().max(40).default("wallet"),
  description: optionalText,
  creditLimit: moneyValue.optional().nullable(),
  archived: z.boolean().default(false),
});

/**
 * Account amounts use the account's own currency because a user may hold
 * multiple currencies at once.
 */
export const accountSchema = accountBaseSchema
  .superRefine((raw, ctx) => {
    if (raw.creditLimit == null) return;
    if (parseMoneyInput(raw.creditLimit, accountCurrency(raw)) < 0n) {
      ctx.addIssue({
        code: "custom",
        path: ["creditLimit"],
        message: t("en", "validation.creditLimitNonNegative"),
      });
    }
  })
  .transform((raw) => {
    const currency = accountCurrency(raw);
    return {
      ...raw,
      initialBalance: parseMoneyInput(raw.initialBalance, currency),
      creditLimit:
        raw.creditLimit == null
          ? null
          : parseMoneyInput(raw.creditLimit, currency),
    };
  });

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#64748B"),
  icon: z.string().max(40).default("tag"),
});

export function transactionSchemaFor(currency: string) {
  return z.object({
    title: z.string().trim().min(1).max(120),
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: positiveMoneyFor(currency),
    accountId: id,
    categoryId: id.optional().nullable(),
    transactionDate: dateString,
    paymentMethod: optionalText,
    description: optionalText,
    idempotencyKey: z.string().max(120).optional().nullable(),
  });
}
export const transactionSchema = transactionSchemaFor("IDR");

export function transferSchemaFor(currency: string) {
  return z
    .object({
      sourceAccountId: id,
      destinationAccountId: id,
      amount: positiveMoneyFor(currency),
      transactionDate: dateString,
      description: optionalText,
      idempotencyKey: z.string().max(120).optional().nullable(),
    })
    .refine((value) => value.sourceAccountId !== value.destinationAccountId, {
      message: t("en", "validation.transferAccountsDiffer"),
      path: ["destinationAccountId"],
    });
}
export const transferSchema = transferSchemaFor("IDR");

export function budgetSchemaFor(currency: string) {
  return z.object({
    name: z.string().trim().min(1).max(80),
    categoryId: id.optional().nullable(),
    amount: positiveMoneyFor(currency),
    period: z.enum(["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).default("MONTHLY"),
    startDate: dateString,
    endDate: dateString.optional().nullable(),
    alertThreshold: z.number().int().min(1).max(100).default(80),
  });
}
export const budgetSchema = budgetSchemaFor("IDR");

export function savingsGoalSchemaFor(currency: string) {
  return z.object({
    name: z.string().trim().min(1).max(80),
    targetAmount: positiveMoneyFor(currency),
    targetDate: dateString.optional().nullable(),
    description: optionalText,
    icon: z.string().max(40).default("target"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#2563EB"),
  });
}
export const savingsGoalSchema = savingsGoalSchemaFor("IDR");

export function savingsContributionSchemaFor(currency: string) {
  return z.object({
    goalId: id,
    amount: nonZeroMoneyFor(currency),
    note: optionalText,
  });
}
export const savingsContributionSchema = savingsContributionSchemaFor("IDR");

export function debtSchemaFor(currency: string) {
  return z.object({
    name: z.string().trim().min(1).max(80),
    lender: optionalText,
    originalAmount: positiveMoneyFor(currency),
    outstandingBalance: moneyFor(currency).refine(
      (value) => value >= 0n,
      { message: t("en", "validation.balanceNonNegative") },
    ),
    interestRate: z.number().min(0).max(100).optional().nullable(),
    monthlyPayment: moneyFor(currency).optional().nullable(),
    dueDate: dateString.optional().nullable(),
    startDate: dateString,
  });
}
export const debtSchema = debtSchemaFor("IDR");

export function debtPaymentSchemaFor(currency: string) {
  return z.object({
    debtId: id,
    amount: positiveMoneyFor(currency),
    paymentDate: dateString,
    note: optionalText,
  });
}
export const debtPaymentSchema = debtPaymentSchemaFor("IDR");

export function recurringSchemaFor(currency: string) {
  return z.object({
    title: z.string().trim().min(1).max(120),
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: positiveMoneyFor(currency),
    accountId: id,
    categoryId: id.optional().nullable(),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).default("MONTHLY"),
    interval: z.number().int().min(1).max(365).default(1),
    startDate: dateString,
    endDate: dateString.optional().nullable(),
    active: z.boolean().default(true),
  });
}
export const recurringSchema = recurringSchemaFor("IDR");

export const settingsSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  preferredCurrency: currencyCodeSchema.default("IDR"),
  preferredLanguage: localeSchema.default("en"),
  timezone: timezoneSchema.default("Asia/Jakarta"),
  dateFormat: z.literal("DD/MM/YYYY").default("DD/MM/YYYY"),
  firstDayOfWeek: z.number().int().min(0).max(6).default(1),
  defaultAccountId: id.optional().nullable(),
  theme: z.enum(["system", "light", "dark"]).default("system"),
});

export const onboardingSchema = z.object({
  step: z.number().int().min(0).max(3),
  fullName: z.string().trim().min(1).max(100).optional(),
  preferredCurrency: currencyCodeSchema.optional(),
  preferredLanguage: localeSchema.optional(),
  timezone: timezoneSchema.optional(),
  account: accountSchema.optional(),
  completed: z.boolean().default(false),
});

export type AccountInput = z.input<typeof accountSchema>;
export type CategoryInput = z.input<typeof categorySchema>;
export type TransactionInput = z.input<typeof transactionSchema>;
export type TransferInput = z.input<typeof transferSchema>;
export type BudgetInput = z.input<typeof budgetSchema>;
export type SavingsGoalInput = z.input<typeof savingsGoalSchema>;
export type SavingsContributionInput = z.input<typeof savingsContributionSchema>;
export type DebtInput = z.input<typeof debtSchema>;
export type DebtPaymentInput = z.input<typeof debtPaymentSchema>;
export type RecurringInput = z.input<typeof recurringSchema>;
export type SettingsInput = z.input<typeof settingsSchema>;
