"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { formObject, formValues, runAction, type ActionResult } from "@/lib/action-result";
import { isLocale, localeOf, type Locale, type TranslationKey } from "@/lib/i18n";
import * as accounts from "@/lib/services/accounts";
import * as budgets from "@/lib/services/budgets";
import * as categories from "@/lib/services/categories";
import * as debts from "@/lib/services/debts";
import * as goals from "@/lib/services/goals";
import * as notifications from "@/lib/services/notifications";
import * as recurring from "@/lib/services/recurring";
import * as transactions from "@/lib/services/transactions";
import * as userSettings from "@/lib/services/user";
import type {
  AccountInput,
  BudgetInput,
  CategoryInput,
  DebtInput,
  DebtPaymentInput,
  RecurringInput,
  SavingsContributionInput,
  SavingsGoalInput,
  SettingsInput,
  TransactionInput,
  TransferInput,
} from "@/lib/validation";

type AuthedUser = Awaited<ReturnType<typeof requireUser>>;

const refresh = (path: string) => revalidatePath(path);

/**
 * Authenticated action wrapper. The user's stored language is captured before
 * the operation runs so runAction can localize validation, business and
 * success messages even when the operation throws.
 */
function authedAction(
  operation: (user: AuthedUser) => Promise<ActionResult | void>,
  successMessage?: TranslationKey,
): Promise<ActionResult> {
  let locale: Locale = "en";
  return runAction(
    async () => {
      const user = await requireUser();
      locale = localeOf(user.preferredLanguage);
      return operation(user);
    },
    successMessage,
    () => locale,
  );
}

function requiredId(formData: FormData, key = "id"): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value) throw new Error(`Missing ${key}.`);
  return value;
}

export async function saveProfileStepAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw = formObject(formData);
    await userSettings.completeProfileStep(user.id, {
      fullName: typeof raw.fullName === "string" ? raw.fullName : undefined,
      preferredCurrency:
        typeof raw.preferredCurrency === "string" ? raw.preferredCurrency : undefined,
      preferredLanguage:
        typeof raw.preferredLanguage === "string" && isLocale(raw.preferredLanguage)
          ? raw.preferredLanguage
          : undefined,
      timezone: typeof raw.timezone === "string" ? raw.timezone : undefined,
    });
    refresh("/onboarding");
  });
}

export async function finishOnboardingAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw = formObject(formData);
    if (typeof raw.name === "string" && raw.name) {
      await accounts.createAccount(user.id, {
        name: raw.name,
        type: (typeof raw.type === "string" ? raw.type : "BANK") as AccountInput["type"],
        currency: typeof raw.currency === "string" ? raw.currency : "IDR",
        initialBalance: typeof raw.initialBalance === "string" ? raw.initialBalance : "0",
        color: typeof raw.color === "string" ? raw.color : "#2563EB",
        icon: "wallet",
        description: null,
        creditLimit: null,
        archived: false,
      });
    }
    await userSettings.completeOnboarding(user.id);
    refresh("/dashboard");
  });
}

export async function saveAccountAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw: AccountInput = {
      ...formValues<AccountInput>(formData),
      archived: formData.get("archived") === "on",
    };
    const id = formData.get("id");
    if (typeof id === "string" && id) {
      await accounts.updateAccount(user.id, id, raw);
    } else {
      await accounts.createAccount(user.id, raw);
    }
    refresh("/accounts");
    refresh("/dashboard");
  });
}

export async function deleteAccountAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await accounts.deleteAccount(user.id, requiredId(formData));
    refresh("/accounts");
  }, "accounts.deleted");
}

export async function saveCategoryAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await categories.createCategory(user.id, formValues<CategoryInput>(formData));
    refresh("/transactions");
    refresh("/budgets");
  });
}

export async function deleteCategoryAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await categories.deleteCategory(user.id, requiredId(formData));
    refresh("/transactions");
  });
}

export async function saveTransactionAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw = formValues<TransactionInput>(formData);
    const id = formData.get("id");
    if (typeof id === "string" && id) {
      await transactions.updateTransaction(user.id, id, raw);
    } else {
      await transactions.createTransaction(user.id, raw);
    }
    refresh("/transactions");
    refresh("/dashboard");
    refresh("/reports");
  });
}

export async function deleteTransactionAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await transactions.deleteTransaction(user.id, requiredId(formData));
    refresh("/transactions");
    refresh("/dashboard");
  }, "transactions.deleted");
}

export async function saveTransferAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await transactions.createTransfer(user.id, formValues<TransferInput>(formData));
    refresh("/transactions");
    refresh("/accounts");
    refresh("/dashboard");
  }, "transactions.transferRecorded");
}

export async function saveBudgetAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw: BudgetInput = {
      ...formValues<BudgetInput>(formData),
      alertThreshold: Number(formData.get("alertThreshold") ?? 80),
    };
    const id = formData.get("id");
    if (typeof id === "string" && id) {
      await budgets.updateBudget(user.id, id, raw, user.preferredCurrency);
    } else {
      await budgets.createBudget(user.id, raw, user.preferredCurrency);
    }
    refresh("/budgets");
    refresh("/dashboard");
  });
}

export async function deleteBudgetAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await budgets.deleteBudget(user.id, requiredId(formData));
    refresh("/budgets");
  });
}

export async function saveGoalAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw = formValues<SavingsGoalInput>(formData);
    const id = formData.get("id");
    if (typeof id === "string" && id) {
      await goals.updateGoal(user.id, id, raw, user.preferredCurrency);
    } else {
      await goals.createGoal(user.id, raw, user.preferredCurrency);
    }
    refresh("/goals");
    refresh("/dashboard");
  });
}

export async function contributeGoalAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw: SavingsContributionInput = {
      ...formValues<SavingsContributionInput>(formData),
      goalId: requiredId(formData, "goalId"),
    };
    await goals.contributeToGoal(user.id, raw, user.preferredCurrency);
    refresh("/goals");
    refresh("/dashboard");
  });
}

export async function deleteGoalAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await goals.deleteGoal(user.id, requiredId(formData));
    refresh("/goals");
  });
}

export async function saveDebtAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw: DebtInput = {
      ...formValues<DebtInput>(formData),
      interestRate: formData.get("interestRate")
        ? Number(formData.get("interestRate"))
        : null,
    };
    const id = formData.get("id");
    if (typeof id === "string" && id) {
      await debts.updateDebt(user.id, id, raw, user.preferredCurrency);
    } else {
      await debts.createDebt(user.id, raw, user.preferredCurrency);
    }
    refresh("/debts");
    refresh("/dashboard");
  });
}

export async function recordDebtPaymentAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await debts.recordDebtPayment(
      user.id,
      formValues<DebtPaymentInput>(formData),
      user.preferredCurrency,
    );
    refresh("/debts");
    refresh("/dashboard");
  });
}

export async function deleteDebtAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await debts.deleteDebt(user.id, requiredId(formData));
    refresh("/debts");
  });
}

export async function saveRecurringAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw: RecurringInput = {
      ...formValues<RecurringInput>(formData),
      interval: Number(formData.get("interval") ?? 1),
      active: formData.get("active") === "on",
    };
    const id = formData.get("id");
    if (typeof id === "string" && id) {
      await recurring.updateRecurring(user.id, id, raw);
    } else {
      await recurring.createRecurring(user.id, raw);
    }
    refresh("/recurring");
  });
}

export async function toggleRecurringAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await recurring.toggleRecurring(
      user.id,
      requiredId(formData),
      formData.get("active") === "on",
    );
    refresh("/recurring");
  });
}

export async function deleteRecurringAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await recurring.deleteRecurring(user.id, requiredId(formData));
    refresh("/recurring");
  });
}

export async function markNotificationReadAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    await notifications.markNotificationRead(user.id, requiredId(formData));
    refresh("/notifications");
  });
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  return authedAction(async (user) => {
    await notifications.markAllNotificationsRead(user.id);
    refresh("/notifications");
  });
}

export async function saveSettingsAction(formData: FormData): Promise<ActionResult> {
  return authedAction(async (user) => {
    const raw: SettingsInput = {
      ...formValues<SettingsInput>(formData),
      firstDayOfWeek: Number(formData.get("firstDayOfWeek") ?? 1),
    };
    await userSettings.updateSettings(user.id, raw);
    refresh("/settings");
    refresh("/dashboard");
  }, "settings.saved");
}
