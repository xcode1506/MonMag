import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  accountSchema,
  budgetSchema,
  categorySchema,
  debtPaymentSchema,
  debtSchema,
  moneyMinor,
  onboardingSchema,
  positiveMoneyMinor,
  recurringSchema,
  savingsContributionSchema,
  savingsGoalSchema,
  settingsSchema,
  transactionSchema,
  transferSchema,
} from "@/lib/validation";

type AnySafeParseResult = { success: boolean; error?: z.ZodError };

const failureOf = (result: AnySafeParseResult): z.ZodError => {
  if (result.success || !result.error) {
    throw new Error("Expected validation to fail");
  }
  return result.error;
};

const pathsOf = (error: z.ZodError) =>
  error.issues.map((issue) => issue.path.join("."));

const messagesOf = (error: z.ZodError) => error.issues.map((issue) => issue.message);

describe("money schemas", () => {
  it("converts localized amounts to minor units", () => {
    expect(moneyMinor.parse("1.234")).toBe(1234n);
    expect(moneyMinor.parse("-5")).toBe(-5n);
    expect(positiveMoneyMinor.parse("250.50")).toBe(251n);
  });

  it("rejects zero and negative positive amounts with field messages", () => {
    const zero = failureOf(moneyMinor.safeParse("0"));
    expect(messagesOf(zero)).toContain("Amount must not be zero");

    const negative = failureOf(positiveMoneyMinor.safeParse("-1"));
    expect(messagesOf(negative)).toContain("Amount must be greater than zero");
  });

  it("rejects non-money input types", () => {
    expect(failureOf(moneyMinor.safeParse(true)).issues.length).toBeGreaterThan(0);
  });
});

describe("accountSchema", () => {
  it("applies defaults and trims text", () => {
    const account = accountSchema.parse({ name: "  Cash  ", type: "CASH" });

    expect(account).toMatchObject({
      name: "Cash",
      type: "CASH",
      currency: "IDR",
      initialBalance: 0n,
      color: "#2563EB",
      icon: "wallet",
      archived: false,
    });
  });

  it("transforms localized balances and accepts explicit optional fields", () => {
    const account = accountSchema.parse({
      name: "Bank",
      type: "BANK",
      currency: "USD",
      initialBalance: "1,234.50",
      creditLimit: "2,000",
      description: "  primary  ",
      color: "#abcdef",
      icon: "bank",
      archived: true,
    });

    expect(account.initialBalance).toBe(123450n);
    expect(account.creditLimit).toBe(200000n);
    expect(account.description).toBe("primary");
  });

  it("reports each invalid field with its own path", () => {
    const error = failureOf(
      accountSchema.safeParse({
        name: " ",
        type: "CRYPTO",
        currency: "US",
        color: "blue",
        icon: "x".repeat(41),
        description: "x".repeat(501),
      }),
    );

    expect(pathsOf(error)).toEqual(
      expect.arrayContaining(["name", "type", "currency", "color", "icon", "description"]),
    );
  });
});

describe("categorySchema", () => {
  it("applies defaults", () => {
    expect(categorySchema.parse({ name: "Food", type: "EXPENSE" })).toMatchObject({
      color: "#64748B",
      icon: "tag",
    });
  });

  it("rejects unsupported category types", () => {
    const error = failureOf(categorySchema.safeParse({ name: "Food", type: "TRANSFER" }));
    expect(pathsOf(error)).toContain("type");
  });
});

describe("transactionSchema", () => {
  const valid = {
    title: "Groceries",
    type: "EXPENSE" as const,
    amount: "1.234",
    accountId: "account-1",
    transactionDate: "31/12/2024",
    categoryId: null,
  };

  it("parses money and DD/MM/YYYY dates", () => {
    const transaction = transactionSchema.parse(valid);
    expect(transaction.amount).toBe(1234n);
    expect(transaction.transactionDate.toISOString()).toBe("2024-12-31T00:00:00.000Z");
  });

  it("rejects zero amounts, missing owners and invalid dates", () => {
    const error = failureOf(
      transactionSchema.safeParse({
        ...valid,
        amount: "0",
        accountId: "",
        transactionDate: "12-31-2024",
      }),
    );

    expect(pathsOf(error)).toEqual(
      expect.arrayContaining(["amount", "accountId", "transactionDate"]),
    );
    expect(messagesOf(error)).toContain("Use DD/MM/YYYY format");
  });

  it("rejects overly long titles", () => {
    expect(
      pathsOf(failureOf(transactionSchema.safeParse({ ...valid, title: "x".repeat(121) }))),
    ).toContain("title");
  });
});

describe("transferSchema", () => {
  const valid = {
    sourceAccountId: "account-1",
    destinationAccountId: "account-2",
    amount: "100",
    transactionDate: "01/01/2024",
  };

  it("accepts transfers between distinct accounts", () => {
    expect(transferSchema.parse(valid).amount).toBe(100n);
  });

  it("rejects self-transfers on the destination field", () => {
    const error = failureOf(
      transferSchema.safeParse({ ...valid, destinationAccountId: "account-1" }),
    );
    expect(pathsOf(error)).toContain("destinationAccountId");
    expect(messagesOf(error)).toContain("Source and destination accounts must differ");
  });
});

describe("budgetSchema", () => {
  it("applies period and threshold defaults", () => {
    const budget = budgetSchema.parse({
      name: "Food",
      amount: "500.000",
      startDate: "01/01/2024",
    });
    expect(budget).toMatchObject({ period: "MONTHLY", alertThreshold: 80 });
    expect(budget.amount).toBe(500000n);
  });

  it("rejects invalid thresholds and dates", () => {
    const error = failureOf(
      budgetSchema.safeParse({
        name: "Food",
        amount: "10",
        period: "DAILY",
        startDate: "not-a-date",
        endDate: "also-bad",
        alertThreshold: 101,
      }),
    );
    expect(pathsOf(error)).toEqual(
      expect.arrayContaining(["period", "startDate", "endDate", "alertThreshold"]),
    );
  });
});

describe("savings schemas", () => {
  it("applies goal defaults and parses an optional target date", () => {
    const goal = savingsGoalSchema.parse({
      name: "Laptop",
      targetAmount: "1.000",
      targetDate: "31/12/2024",
    });
    expect(goal).toMatchObject({ icon: "target", color: "#2563EB" });
    expect(goal.targetAmount).toBe(1000n);
  });

  it("rejects a zero goal target", () => {
    expect(
      pathsOf(
        failureOf(savingsGoalSchema.safeParse({ name: "Laptop", targetAmount: "0" })),
      ),
    ).toContain("targetAmount");
  });

  it("accepts negative withdrawals but not zero contributions", () => {
    const contribution = savingsContributionSchema.parse({
      goalId: "goal-1",
      amount: "-25",
    });
    expect(contribution.amount).toBe(-25n);
    expect(
      pathsOf(
        failureOf(savingsContributionSchema.safeParse({ goalId: "goal-1", amount: "0" })),
      ),
    ).toContain("amount");
  });
});

describe("debt schemas", () => {
  it("accepts a zero outstanding balance and nullable fields", () => {
    const debt = debtSchema.parse({
      name: "Mortgage",
      originalAmount: "1.000.000",
      outstandingBalance: "0",
      interestRate: null,
      monthlyPayment: "500.000",
      dueDate: null,
      startDate: "01/01/2024",
    });
    expect(debt.originalAmount).toBe(1000000n);
    expect(debt.outstandingBalance).toBe(0n);
    expect(debt.monthlyPayment).toBe(500000n);
  });

  it("rejects negative outstanding balances, zero principals and invalid rates", () => {
    const error = failureOf(
      debtSchema.safeParse({
        name: "Mortgage",
        originalAmount: "0",
        outstandingBalance: "-1",
        interestRate: 101,
        startDate: "bad",
      }),
    );
    expect(pathsOf(error)).toEqual(
      expect.arrayContaining(["originalAmount", "outstandingBalance", "interestRate", "startDate"]),
    );
    expect(messagesOf(error)).toContain("Balance cannot be negative");
  });

  it("validates debt payments", () => {
    const payment = debtPaymentSchema.parse({
      debtId: "debt-1",
      amount: "100",
      paymentDate: "02/01/2024",
    });
    expect(payment.amount).toBe(100n);

    const error = failureOf(
      debtPaymentSchema.safeParse({ debtId: "", amount: "0", paymentDate: "bad" }),
    );
    expect(pathsOf(error)).toEqual(
      expect.arrayContaining(["debtId", "amount", "paymentDate"]),
    );
  });
});

describe("recurringSchema", () => {
  it("applies schedule defaults", () => {
    const recurring = recurringSchema.parse({
      title: "Rent",
      type: "EXPENSE",
      amount: "100",
      accountId: "account-1",
      startDate: "01/01/2024",
    });
    expect(recurring).toMatchObject({ frequency: "MONTHLY", interval: 1, active: true });
  });

  it("rejects invalid frequencies, intervals and dates", () => {
    const error = failureOf(
      recurringSchema.safeParse({
        title: "Rent",
        type: "EXPENSE",
        amount: "100",
        accountId: "account-1",
        frequency: "HOURLY",
        interval: 0,
        startDate: "bad",
      }),
    );
    expect(pathsOf(error)).toEqual(
      expect.arrayContaining(["frequency", "interval", "startDate"]),
    );
  });
});

describe("settingsSchema", () => {
  const valid = { fullName: "Jane Doe", email: "jane@example.com" };

  it("applies app-wide defaults", () => {
    expect(settingsSchema.parse(valid)).toMatchObject({
      preferredCurrency: "IDR",
      preferredLanguage: "en",
      timezone: "Asia/Jakarta",
      dateFormat: "DD/MM/YYYY",
      firstDayOfWeek: 1,
      theme: "system",
    });
  });

  it("accepts all ten world languages", () => {
    for (const language of ["en", "es", "fr", "de", "zh", "ja", "ar", "pt", "hi", "id"]) {
      expect(settingsSchema.parse({ ...valid, preferredLanguage: language }).preferredLanguage).toBe(language);
    }
  });

  it("accepts supported currencies and real IANA timezones", () => {
    expect(settingsSchema.parse({ ...valid, preferredCurrency: "JPY", timezone: "America/New_York" })).toMatchObject({
      preferredCurrency: "JPY",
      timezone: "America/New_York",
    });
  });

  it("rejects invalid email, language, currency, timezone, weekday and date format", () => {
    const error = failureOf(
      settingsSchema.safeParse({
        ...valid,
        email: "not-an-email",
        preferredLanguage: "xx",
        preferredCurrency: "XYZ",
        timezone: "Mars/Olympus",
        dateFormat: "YYYY-MM-DD",
        firstDayOfWeek: 7,
      }),
    );
    expect(pathsOf(error)).toEqual(
      expect.arrayContaining([
        "email",
        "preferredLanguage",
        "preferredCurrency",
        "timezone",
        "dateFormat",
        "firstDayOfWeek",
      ]),
    );
  });
});

describe("onboardingSchema", () => {
  it("validates nested account details and defaults completion", () => {
    const onboarding = onboardingSchema.parse({
      step: 1,
      fullName: "Jane",
      account: { name: "Cash", type: "CASH" },
    });
    expect(onboarding.completed).toBe(false);
    expect(onboarding.account?.currency).toBe("IDR");
  });

  it("accepts every supported onboarding language", () => {
    for (const language of ["en", "es", "fr", "de", "zh", "ja", "ar", "pt", "hi", "id"]) {
      expect(
        onboardingSchema.parse({ step: 0, preferredLanguage: language }).preferredLanguage,
      ).toBe(language);
    }
  });

  it("reports nested account field errors", () => {
    const error = failureOf(
      onboardingSchema.safeParse({
        step: 4,
        account: { name: "", type: "CASH", color: "red" },
      }),
    );
    expect(pathsOf(error)).toEqual(
      expect.arrayContaining(["step", "account.name", "account.color"]),
    );
  });
});
