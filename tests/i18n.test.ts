import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isLocale,
  localeOf,
  localeTag,
  LOCALES,
  t,
  textDirection,
} from "@/lib/i18n";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("supported locales", () => {
  it("exposes exactly ten world-recognized languages", () => {
    expect(LOCALES).toEqual([
      "en",
      "es",
      "fr",
      "de",
      "zh",
      "ja",
      "ar",
      "pt",
      "hi",
      "id",
    ]);
    expect(LOCALES).toHaveLength(10);
  });

  it("resolves stored preferences and validates locale codes", () => {
    expect(localeOf("fr")).toBe("fr");
    expect(localeOf("zh-CN")).toBe("zh");
    expect(localeOf("not-a-locale")).toBe("en");
    expect(localeOf(undefined)).toBe("en");
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("xx")).toBe(false);
  });

  it("maps locales to Intl tags and text direction", () => {
    expect(localeTag("zh")).toBe("zh-CN");
    expect(localeTag("pt")).toBe("pt-BR");
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("en")).toBe("ltr");
  });

  it("uses MonMag as the application name in every locale", () => {
    for (const locale of LOCALES) {
      expect(t(locale, "app.name")).toBe("MonMag");
    }
  });

  it("translates a known key in each locale", () => {
    expect(t("en", "nav.dashboard")).toBe("Dashboard");
    expect(t("id", "nav.dashboard")).toBe("Dasbor");
    expect(t("es", "nav.dashboard")).toBe("Panel");
    expect(t("fr", "nav.dashboard")).toBe("Tableau de bord");
    expect(t("de", "nav.dashboard")).toBe("Übersicht");
    expect(t("zh", "nav.dashboard")).toBe("仪表板");
    expect(t("ja", "nav.dashboard")).toBe("ダッシュボード");
    expect(t("ar", "nav.dashboard")).toBe("لوحة التحكم");
    expect(t("pt", "nav.dashboard")).toBe("Painel");
    expect(t("hi", "nav.dashboard")).toBe("डैशबोर्ड");
  });

  it("falls back to English for a missing translation and interpolates params", () => {
    expect(t("de", "common.retry")).toBe("Erneut versuchen");
    expect(t("de", "missing.key" as Parameters<typeof t>[1])).toBe("missing.key");
    expect(t("en", "dashboard.heading", { name: "Ada" })).toBe(
      "Good to see you, Ada",
    );
  });

  it("provides every preference-chrome and dashboard key in all ten locales", () => {
    const keys = [
      "app.category",
      "dashboard.netWorthHint",
      "common.net",
      "reports.month",
    ] as const;
    for (const key of keys) {
      for (const locale of LOCALES) {
        const value = t(locale, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
    expect(t("id", "app.category")).toBe("Keuangan pribadi");
    expect(t("en", "dashboard.netWorthHint")).toBe("Across all active accounts");
    expect(t("en", "common.net")).toBe("Net");
    expect(t("en", "reports.month")).toBe("Month");
  });

  it("localizes operational copy used in confirmations, tables and settings", () => {
    const keys = [
      "common.working",
      "confirm.deleted",
      "confirm.deleteCategory",
      "confirm.deleteAccount",
      "confirm.deleteBudget",
      "confirm.deleteGoal",
      "confirm.deleteDebt",
      "confirm.deleteRule",
      "confirm.detailTransaction",
      "confirm.detailCategory",
      "confirm.detailAccount",
      "confirm.detailGoal",
      "confirm.detailRule",
      "transactions.count",
      "transactions.emptyHint",
      "transactions.categories",
      "budgets.remainingLabel",
      "budgets.usedLabel",
      "settings.preferencesHint",
      "settings.security",
      "settings.securityHint",
      "settings.regional",
      "settings.dateFormat",
      "settings.weekStarts",
      "settings.sunday",
      "settings.monday",
      "settings.previewLocale",
    ] as const;
    for (const key of keys) {
      for (const locale of LOCALES) {
        const value = t(locale, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
    expect(t("id", "confirm.deleteGoal")).toBe("Hapus tabungan ini?");
    expect(t("en", "transactions.count", { shown: 5, total: 20 })).toBe(
      "Showing 5 of 20 transactions.",
    );
  });

  it("localizes view-level operational copy in all ten locales", () => {
    const keys = [
      "common.active",
      "common.paused",
      "common.of",
      "action.apply",
      "action.editItem",
      "action.pause",
      "action.activate",
      "action.exportCsv",
      "transactions.searchPlaceholder",
      "transactions.allTypes",
      "transactions.allAccounts",
      "transactions.allCategories",
      "transactions.fromPlaceholder",
      "transactions.toPlaceholder",
      "transactions.fromDate",
      "transactions.toDate",
      "transactions.editTitle",
      "transactions.newTitle",
      "transactions.modalHint",
      "accounts.totalBalance",
      "accounts.emptyHint",
      "accounts.editTitle",
      "budgets.allExpenses",
      "budgets.spentOf",
      "budgets.overAmount",
      "budgets.emptyHint",
      "budgets.usage",
      "budgets.editTitle",
      "goals.totalSaved",
      "goals.combinedTarget",
      "goals.activeGoals",
      "goals.completed",
      "goals.complete",
      "goals.recentContributions",
      "goals.emptyHint",
      "goals.contributionTitle",
      "goals.editTitle",
      "debts.across",
      "debts.paidOff",
      "debts.balanceOf",
      "debts.repaid",
      "debts.interestRate",
      "debts.monthlyPayment",
      "debts.estimatedInterest",
      "debts.complete",
      "debts.setPayment",
      "debts.due",
      "debts.recentPayments",
      "debts.emptyHint",
      "debts.editTitle",
      "debts.paymentTitle",
      "recurring.activeRules",
      "recurring.pausedRules",
      "recurring.every",
      "recurring.nextOn",
      "recurring.endsOn",
      "recurring.emptyTitle",
      "recurring.editTitle",
      "recurring.pause",
      "recurring.activate",
    ] as const;
    for (const key of keys) {
      for (const locale of LOCALES) {
        const value = t(locale, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
    expect(t("en", "budgets.spentOf", { spent: "$10", amount: "$20" })).toBe(
      "$10 of $20",
    );
    expect(t("id", "goals.complete", { percent: "50%" })).toBe("50% selesai");
    expect(t("en", "recurring.every", { interval: 2, frequency: "months" })).toBe(
      "every 2 months",
    );
  });

  it("localizes form fields, options, placeholders and submit labels", () => {
    const keys = [
      "form.accountPlaceholder",
      "form.bank",
      "form.cash",
      "form.eWallet",
      "form.savings",
      "form.creditCard",
      "form.other",
      "form.categoryPlaceholder",
      "form.transactionPlaceholder",
      "form.paymentMethodPlaceholder",
      "form.budgetPlaceholder",
      "form.goalPlaceholder",
      "form.debtPlaceholder",
      "form.recurringPlaceholder",
      "form.daily",
      "form.weekly",
      "form.monthly",
      "form.yearly",
      "form.custom",
      "form.description",
      "form.color",
      "form.icon",
      "form.currency",
      "form.creditLimit",
      "form.uncategorized",
      "form.datePattern",
      "form.optionalDatePattern",
      "form.todayIs",
      "form.note",
      "form.lender",
      "form.originalAmount",
      "form.outstandingBalance",
      "form.paymentDate",
      "form.dueDate",
      "form.alertAt",
      "form.everyNPeriods",
      "form.targetAmount",
      "form.targetDate",
      "form.startDate",
      "form.endDate",
      "form.fullName",
      "form.email",
      "form.defaultAccount",
      "form.none",
      "form.system",
      "form.light",
      "form.dark",
      "form.displayCurrencyHint",
      "form.timezoneHint",
      "form.addAccount",
      "form.updateAccount",
      "form.addCategory",
      "form.addTransaction",
      "form.updateTransaction",
      "form.recordTransfer",
      "form.createBudget",
      "form.updateBudget",
      "form.createGoal",
      "form.updateGoal",
      "form.addContribution",
      "form.addDebt",
      "form.updateDebt",
      "form.recordPayment",
      "form.createRule",
      "form.updateRule",
      "form.markAllReadAria",
      "form.saveSettings",
      "form.continue",
      "form.finishSetup",
      "form.creating",
      "form.back",
      "form.signOut",
    ] as const;
    for (const key of keys) {
      for (const locale of LOCALES) {
        const value = t(locale, key as Parameters<typeof t>[1]);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
    expect(t("en", "form.addAccount" as Parameters<typeof t>[1])).toBe(
      "Add account",
    );
    expect(t("id", "form.creditCard" as Parameters<typeof t>[1])).toBe(
      "Kartu kredit",
    );
    expect(t("en", "form.datePattern" as Parameters<typeof t>[1])).toBe(
      "DD/MM/YYYY",
    );
    expect(
      t("en", "form.optionalDatePattern" as Parameters<typeof t>[1]),
    ).toBe("Optional, DD/MM/YYYY");
  });

  it("localizes onboarding, navigation, dialog and empty-state copy", () => {
    const keys = [
      "aria.primaryNavigation",
      "aria.closeNavigation",
      "aria.openNavigation",
      "aria.closeDialog",
      "aria.loadingPage",
      "aria.stepOf",
      "onboarding.personalizeTitle",
      "onboarding.personalizeDescription",
      "onboarding.accountTitle",
      "onboarding.accountDescription",
      "onboarding.privacy",
      "onboarding.accountNameHint",
      "onboarding.timezoneHint",
      "error.notFoundTitle",
      "error.notFoundDescription",
      "error.goDashboard",
      "error.unexpectedTitle",
      "error.tryAgain",
      "error.sectionTitle",
      "dashboard.emptyCashflowTitle",
      "dashboard.emptyCashflowDescription",
      "dashboard.emptySpendingTitle",
      "dashboard.emptySpendingDescription",
      "dashboard.emptyBudgetsTitle",
      "dashboard.emptyBudgetsDescription",
      "dashboard.emptyGoalsTitle",
      "dashboard.emptyGoalsDescription",
      "dashboard.emptyAccountsTitle",
      "dashboard.emptyAccountsDescription",
      "reports.emptyCashflowTitle",
      "reports.emptyCashflowDescription",
      "reports.emptySpendingTitle",
      "reports.emptySpendingDescription",
      "reports.emptyCategoriesTitle",
      "reports.emptyCategoriesDescription",
      "reports.emptyMonthlyTitle",
      "reports.emptyMonthlyDescription",
    ] as const;
    for (const key of keys) {
      for (const locale of LOCALES) {
        const value = t(locale, key as Parameters<typeof t>[1]);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
    expect(t("en", "aria.primaryNavigation" as Parameters<typeof t>[1])).toBe(
      "Primary navigation",
    );
    expect(
      t("en", "dashboard.emptyCashflowTitle" as Parameters<typeof t>[1]),
    ).toBe("No cash flow yet");
    expect(
      t("en", "aria.stepOf" as Parameters<typeof t>[1], { step: 1, total: 2 }),
    ).toBe("Step 1 of 2");
  });
});

describe("localized source guards", () => {
  const guardedSources: Array<[string, RegExp[]]> = [
    [
      "src/components/forms/entity-forms.tsx",
      [
        /\b(?:label|placeholder|submitLabel|pendingLabel|hint)="[A-Z]/,
        />(?:Name|Type|Currency|Description|Archived|Active|Expense|Income|Uncategorized|All expenses|None|System|Light|Dark|Bank|Cash|Savings|Other)<\//,
      ],
    ],
    [
      "src/components/onboarding/onboarding-forms.tsx",
      [
        /\b(?:label|placeholder|submitLabel|pendingLabel|hint)="[A-Z]/,
        />(?:Continue|Back|Full name|Language|Timezone|Opening balance|Bank|Cash|Other)<\//,
      ],
    ],
    [
      "src/app/onboarding/page.tsx",
      [
        />Sign out</,
        /`Step \$\{step\} of 2`/,
        />Let's personalize your workspace</,
        />Add your first account</,
        />Choose the language and currency you use every day\.</,
        />You can add more accounts and change these details later\.</,
        />Your data belongs to your account and is never shared between users\.</,
      ],
    ],
    ["src/components/ui/page-skeleton.tsx", [/aria-label="Loading page"/]],
    ["src/components/ui/modal.tsx", [/aria-label="Close dialog"/]],
    [
      "src/components/layout/app-chrome.tsx",
      [
        /aria-label="Primary"/,
        /aria-label="Close navigation"/,
        /aria-label="Open navigation"/,
      ],
    ],
    [
      "src/components/forms/action-form.tsx",
      [
        /submitLabel = "Save"/,
        /pendingLabel = "Saving…"/,
        /cancelLabel = "Cancel"/,
      ],
    ],
    [
      "src/components/forms/submit-button.tsx",
      [/pendingLabel = "Saving…"/],
    ],
    ["src/app/(app)/dashboard/page.tsx", [/\b(?:title|description)="No /]],
    ["src/app/(app)/reports/page.tsx", [/\b(?:title|description)="No /]],
    [
      "src/app/error.tsx",
      [/ >Something went wrong</, />Try again</],
    ],
    ["src/app/not-found.tsx", [/ >Page not found</, />Go to dashboard</]],
    [
      "src/app/(app)/error.tsx",
      [/ >This section could not load</, />Try again</],
    ],
    [
      "src/app/page.tsx",
      [
        /aria-label="MonMag home"/,
        />Sign in to MonMag</,
        />Create your workspace</,
        /Private by design · One workspace for your money/,
        /One private space for/,
        /Amounts can be viewed in 27 currencies/,
        />Overview</,
        />Total balance</,
        />Income</,
        />Expenses</,
        />Monthly budget</,
        />Recurring: rent</,
        />Everything you need to stay on top of your money/,
        />Ready to see your money clearly\?/,
        /Record transactions and transfers/,
        /10 world languages/,
      ],
    ],
    ["src/lib/ui.ts", [/en: "Income"/, /id: "Pemasukan"/]],
    ["src/components/ui/form-status.tsx", [/Saved\./, /Saving…/]],
    ["src/app/sign-in/[[...sign-in]]/page.tsx", [/Loading MonMag…/]],
    ["src/app/sign-up/[[...sign-up]]/page.tsx", [/Loading MonMag…/]],
    ["src/components/forms/entity-forms.tsx", [/Interest rate \(%\)/]],
    [
      "src/lib/validation.ts",
      [
        /"Unsupported currency"/,
        /"Unknown timezone"/,
        /"Amount must not be zero"/,
        /"Credit limit cannot be negative"/,
        /"Source and destination accounts must differ"/,
      ],
    ],
    [
      "src/app/(app)/actions.ts",
      [/"Account deleted\."/, /"Transaction deleted\."/, /"Settings saved\."/],
    ],
    [
      "src/lib/action-result.ts",
      [
        /"Please check the highlighted fields\."/,
        /"Something went wrong\. Please try again\."/,
      ],
    ],
    [
      "src/lib/errors.ts",
      [
        /"You must be signed in\."/,
        /"You do not have access to this resource\."/,
      ],
    ],
    ["src/lib/services/transactions.ts", [/"Transfers require accounts with the same currency\."/]],
    ["src/lib/services/debts.ts", [/"Payment exceeds the outstanding balance\."/]],
    ["src/lib/services/goals.ts", [/"Withdrawal exceeds the saved balance\."/]],
    ["src/lib/services/categories.ts", [/"Default categories cannot be deleted\."/]],
    ["src/lib/services/accounts.ts", [/"Archive this account instead/]],
    [
      "src/lib/view-models/transaction-export.ts",
      [/"Amount \(decimal\)"/, /"Payment method"/],
    ],
  ];

  for (const [relativePath, patterns] of guardedSources) {
    it(`${relativePath} contains no hardcoded user-facing English`, () => {
      const content = source(relativePath);
      for (const pattern of patterns) {
        expect(content).not.toMatch(pattern);
      }
    });
  }
});
