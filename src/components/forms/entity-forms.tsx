"use client";

import * as React from "react";
import {
  contributeGoalAction,
  markAllNotificationsReadAction,
  recordDebtPaymentAction,
  saveAccountAction,
  saveBudgetAction,
  saveCategoryAction,
  saveDebtAction,
  saveGoalAction,
  saveRecurringAction,
  saveSettingsAction,
  saveTransactionAction,
  saveTransferAction,
} from "@/app/(app)/actions";
import { ActionForm } from "@/components/forms/action-form";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useClientLocale } from "@/lib/client-locale";
import { COMMON_TIMEZONES } from "@/lib/date";
import {
  LOCALES,
  LOCALE_NAMES,
  t,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";
import { CURRENCIES, CURRENCY_NAMES } from "@/lib/money";
import { amountInput } from "@/lib/ui";
import {
  rescaleAmountText,
  resolveAccountCurrency,
} from "@/lib/view-models/form-currency";

export interface Option {
  value: string;
  label: string;
}

export type CurrencyOption = Option & { currency: string };

const accountTypes = ["CASH", "BANK", "EWALLET", "SAVINGS", "CREDIT_CARD", "OTHER"];
const frequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"];

const ACCOUNT_TYPE_KEYS: Record<string, TranslationKey> = {
  CASH: "form.cash",
  BANK: "form.bank",
  EWALLET: "form.eWallet",
  SAVINGS: "form.savings",
  CREDIT_CARD: "form.creditCard",
  OTHER: "form.other",
};

const FREQUENCY_KEYS: Record<string, TranslationKey> = {
  DAILY: "form.daily",
  WEEKLY: "form.weekly",
  MONTHLY: "form.monthly",
  YEARLY: "form.yearly",
  CUSTOM: "form.custom",
};

function accountTypeLabel(locale: Locale, type: string): string {
  const key = ACCOUNT_TYPE_KEYS[type];
  return key ? t(locale, key) : type.replaceAll("_", " ");
}

function frequencyLabel(locale: Locale, value: string): string {
  const key = FREQUENCY_KEYS[value];
  return key ? t(locale, key) : value;
}

function Options({ items }: { items: Option[] }) {
  return items.map((item) => (
    <option key={item.value} value={item.value}>
      {item.label}
    </option>
  ));
}

/**
 * Keep the amount label and the entered value in the selected account's
 * currency. Changing accounts rescales the text so the monetary value is
 * preserved instead of being silently reinterpreted.
 */
function useCurrencyAccountAmount(
  accounts: readonly CurrencyOption[],
  initialAccountId: string | undefined,
  fallbackCurrency: string,
  initialAmount?: bigint,
) {
  const [accountId, setAccountId] = React.useState(
    initialAccountId ?? accounts[0]?.value ?? "",
  );
  const currency = resolveAccountCurrency(accounts, accountId, fallbackCurrency);
  const previousCurrency = React.useRef(currency);
  const [amount, setAmount] = React.useState(() =>
    initialAmount === undefined ? "" : amountInput(initialAmount, currency),
  );

  const changeAccount = (nextAccountId: string) => {
    const nextCurrency = resolveAccountCurrency(
      accounts,
      nextAccountId,
      fallbackCurrency,
    );
    setAmount((current) =>
      rescaleAmountText(current, previousCurrency.current, nextCurrency),
    );
    previousCurrency.current = nextCurrency;
    setAccountId(nextAccountId);
  };

  return { accountId, changeAccount, currency, amount, setAmount };
}

interface WithId {
  id?: string;
}

export function AccountForm({
  locale,
  onSuccess,
  accounts,
  item,
}: {
  locale: Locale;
  onSuccess: () => void;
  accounts: Option[];
  item?: {
    id: string;
    name: string;
    type: string;
    currency: string;
    initialBalance: bigint;
    color: string;
    icon: string;
    description: string | null;
    creditLimit: bigint | null;
    archived: boolean;
  };
}) {
  return (
    <ActionForm
      action={saveAccountAction}
      onSuccess={onSuccess}
      submitLabel={t(locale, item ? "form.updateAccount" : "form.addAccount")}
    >
      {({ fieldErrors }) => (
        <>
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <FormField label={t(locale, "common.name")} name="name" error={fieldErrors.name}>
            <Input id="name" name="name" defaultValue={item?.name} placeholder={t(locale, "form.accountPlaceholder")} required />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "common.type")} name="type" error={fieldErrors.type}>
              <Select id="type" name="type" defaultValue={item?.type ?? "BANK"}>
                {accountTypes.map((type) => (
                  <option key={type} value={type}>{accountTypeLabel(locale, type)}</option>
                ))}
              </Select>
            </FormField>
            <FormField label={t(locale, "form.currency")} name="currency" error={fieldErrors.currency}>
              <Input id="currency" name="currency" defaultValue={item?.currency ?? "IDR"} maxLength={3} required />
            </FormField>
            <FormField label={t(locale, "accounts.initialBalance")} name="initialBalance" error={fieldErrors.initialBalance}>
              <Input id="initialBalance" name="initialBalance" inputMode="decimal" defaultValue={item ? amountInput(item.initialBalance, item.currency) : "0"} />
            </FormField>
            <FormField label={t(locale, "form.creditLimit")} name="creditLimit" error={fieldErrors.creditLimit} hint={t(locale, "form.creditLimitHint")}>
              <Input id="creditLimit" name="creditLimit" inputMode="decimal" defaultValue={item?.creditLimit ? amountInput(item.creditLimit, item.currency) : ""} />
            </FormField>
            <FormField label={t(locale, "form.color")} name="color" error={fieldErrors.color}>
              <Input id="color" name="color" type="color" defaultValue={item?.color ?? "#2563EB"} />
            </FormField>
            <FormField label={t(locale, "form.icon")} name="icon" error={fieldErrors.icon}>
              <Input id="icon" name="icon" defaultValue={item?.icon ?? "wallet"} />
            </FormField>
          </div>
          <FormField label={t(locale, "form.description")} name="description" error={fieldErrors.description}>
            <Textarea id="description" name="description" defaultValue={item?.description ?? ""} />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="archived" defaultChecked={item?.archived} className="size-4" />
            {t(locale, "common.archived")}
          </label>
          {item && accounts.some((account) => account.value === item.id) ? null : null}
        </>
      )}
    </ActionForm>
  );
}

export function CategoryForm({
  locale,
  onSuccess,
}: {
  locale: Locale;
  onSuccess: () => void;
}) {
  return (
    <ActionForm action={saveCategoryAction} onSuccess={onSuccess} submitLabel={t(locale, "form.addCategory")}>
      {({ fieldErrors }) => (
        <>
          <FormField label={t(locale, "common.name")} name="name" error={fieldErrors.name}>
            <Input id="name" name="name" placeholder={t(locale, "form.categoryPlaceholder")} required />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "common.type")} name="type" error={fieldErrors.type}>
              <Select id="type" name="type" defaultValue="EXPENSE">
                <option value="EXPENSE">{t(locale, "transactions.expense")}</option>
                <option value="INCOME">{t(locale, "transactions.income")}</option>
              </Select>
            </FormField>
            <FormField label={t(locale, "form.color")} name="color" error={fieldErrors.color}>
              <Input id="color" name="color" type="color" defaultValue="#64748B" />
            </FormField>
          </div>
          <FormField label={t(locale, "form.icon")} name="icon" error={fieldErrors.icon}>
            <Input id="icon" name="icon" defaultValue="tag" />
          </FormField>
        </>
      )}
    </ActionForm>
  );
}

export function TransactionForm({
  locale,
  onSuccess,
  accounts,
  categories,
  currency,
  today,
  item,
}: {
  locale: Locale;
  onSuccess: () => void;
  accounts: CurrencyOption[];
  categories: Option[];
  currency: string;
  today: string;
  item?: {
    id: string;
    title: string;
    type: string;
    amount: bigint;
    accountId: string;
    categoryId: string | null;
    transactionDate: string;
    paymentMethod: string | null;
    description: string | null;
  };
}) {
  const [type, setType] = React.useState(item?.type ?? "EXPENSE");
  const {
    accountId,
    changeAccount,
    currency: amountCurrency,
    amount,
    setAmount,
  } = useCurrencyAccountAmount(accounts, item?.accountId, currency, item?.amount);
  const filteredCategories = categories.filter((category) =>
    type === "INCOME" ? category.label.startsWith("+") : !category.label.startsWith("+"),
  );
  return (
    <ActionForm
      action={saveTransactionAction}
      onSuccess={onSuccess}
      submitLabel={t(locale, item ? "form.updateTransaction" : "form.addTransaction")}
    >
      {({ fieldErrors }) => (
        <>
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <FormField label={t(locale, "common.title")} name="title" error={fieldErrors.title}>
            <Input id="title" name="title" defaultValue={item?.title} placeholder={t(locale, "form.transactionPlaceholder")} required />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "common.type")} name="type" error={fieldErrors.type}>
              <Select id="type" name="type" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="EXPENSE">{t(locale, "transactions.expense")}</option>
                <option value="INCOME">{t(locale, "transactions.income")}</option>
              </Select>
            </FormField>
            <FormField label={t(locale, "form.amountWithCurrency", { currency: amountCurrency })} name="amount" error={fieldErrors.amount}>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                required
              />
            </FormField>
            <FormField label={t(locale, "common.account")} name="accountId" error={fieldErrors.accountId}>
              <Select
                id="accountId"
                name="accountId"
                value={accountId}
                onChange={(event) => changeAccount(event.target.value)}
                required
              >
                <Options items={accounts} />
              </Select>
            </FormField>
            <FormField label={t(locale, "common.category")} name="categoryId" error={fieldErrors.categoryId}>
              <Select id="categoryId" name="categoryId" defaultValue={item?.categoryId ?? ""}>
                <option value="">{t(locale, "form.uncategorized")}</option>
                <Options items={filteredCategories} />
              </Select>
            </FormField>
            <FormField label={t(locale, "common.date")} name="transactionDate" error={fieldErrors.transactionDate} hint={t(locale, "form.datePattern")}>
              <Input id="transactionDate" name="transactionDate" defaultValue={item?.transactionDate ?? today} placeholder={t(locale, "form.datePattern")} required />
            </FormField>
            <FormField label={t(locale, "form.paymentMethod")} name="paymentMethod" error={fieldErrors.paymentMethod}>
              <Input id="paymentMethod" name="paymentMethod" defaultValue={item?.paymentMethod ?? ""} placeholder={t(locale, "form.paymentMethodPlaceholder")} />
            </FormField>
          </div>
          <FormField label={t(locale, "form.description")} name="description" error={fieldErrors.description}>
            <Textarea id="description" name="description" defaultValue={item?.description ?? ""} />
          </FormField>
        </>
      )}
    </ActionForm>
  );
}

export function TransferForm({
  locale,
  onSuccess,
  accounts,
  currency,
  today,
}: {
  locale: Locale;
  onSuccess: () => void;
  accounts: CurrencyOption[];
  currency: string;
  today: string;
}) {
  const {
    accountId: sourceAccountId,
    changeAccount: changeSourceAmount,
    currency: amountCurrency,
    amount,
    setAmount,
  } = useCurrencyAccountAmount(accounts, accounts[0]?.value, currency);
  const destinations = accounts.filter(
    (account) => account.currency === amountCurrency && account.value !== sourceAccountId,
  );
  const [destinationAccountId, setDestinationAccountId] = React.useState(
    destinations[0]?.value ?? "",
  );

  const changeSource = (nextSourceId: string) => {
    changeSourceAmount(nextSourceId);
    const nextCurrency = resolveAccountCurrency(accounts, nextSourceId, currency);
    const nextDestinations = accounts.filter(
      (account) => account.currency === nextCurrency && account.value !== nextSourceId,
    );
    setDestinationAccountId((current) =>
      nextDestinations.some((account) => account.value === current)
        ? current
        : nextDestinations[0]?.value ?? "",
    );
  };

  return (
    <ActionForm action={saveTransferAction} onSuccess={onSuccess} submitLabel={t(locale, "form.recordTransfer")}>
      {({ fieldErrors }) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "form.from")} name="sourceAccountId" error={fieldErrors.sourceAccountId}>
              <Select
                id="sourceAccountId"
                name="sourceAccountId"
                value={sourceAccountId}
                onChange={(event) => changeSource(event.target.value)}
                required
              >
                <Options items={accounts} />
              </Select>
            </FormField>
            <FormField label={t(locale, "form.to")} name="destinationAccountId" error={fieldErrors.destinationAccountId}>
              <Select
                id="destinationAccountId"
                name="destinationAccountId"
                value={destinationAccountId}
                onChange={(event) => setDestinationAccountId(event.target.value)}
                required
              >
                <Options items={destinations} />
              </Select>
            </FormField>
            <FormField label={t(locale, "form.amountWithCurrency", { currency: amountCurrency })} name="amount" error={fieldErrors.amount}>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                required
              />
            </FormField>
            <FormField label={t(locale, "common.date")} name="transactionDate" error={fieldErrors.transactionDate} hint={t(locale, "form.datePattern")}>
              <Input id="transactionDate" name="transactionDate" defaultValue={today} required />
            </FormField>
          </div>
          <FormField label={t(locale, "form.description")} name="description" error={fieldErrors.description}>
            <Textarea id="description" name="description" />
          </FormField>
        </>
      )}
    </ActionForm>
  );
}

export function BudgetForm({
  locale,
  onSuccess,
  categories,
  currency,
  today,
  item,
}: {
  locale: Locale;
  onSuccess: () => void;
  categories: Option[];
  currency: string;
  today: string;
  item?: WithId & {
    name: string;
    categoryId: string | null;
    amount: bigint;
    period: string;
    startDate: string;
    endDate: string | null;
    alertThreshold: number;
  };
}) {
  return (
    <ActionForm
      action={saveBudgetAction}
      onSuccess={onSuccess}
      submitLabel={t(locale, item ? "form.updateBudget" : "form.createBudget")}
    >
      {({ fieldErrors }) => (
        <>
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <FormField label={t(locale, "common.name")} name="name" error={fieldErrors.name}>
            <Input id="name" name="name" defaultValue={item?.name} placeholder={t(locale, "form.budgetPlaceholder")} required />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "common.category")} name="categoryId" error={fieldErrors.categoryId}>
              <Select id="categoryId" name="categoryId" defaultValue={item?.categoryId ?? ""}>
                <option value="">{t(locale, "budgets.allExpenses")}</option>
                <Options items={categories} />
              </Select>
            </FormField>
            <FormField label={t(locale, "form.limitWithCurrency", { currency })} name="amount" error={fieldErrors.amount}>
              <Input id="amount" name="amount" inputMode="decimal" defaultValue={item ? amountInput(item.amount, currency) : ""} required />
            </FormField>
            <FormField label={t(locale, "form.period")} name="period" error={fieldErrors.period}>
              <Select id="period" name="period" defaultValue={item?.period ?? "MONTHLY"}>
                {["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"].map((value) => (
                  <option key={value} value={value}>{frequencyLabel(locale, value)}</option>
                ))}
              </Select>
            </FormField>
            <FormField label={t(locale, "form.alertAt")} name="alertThreshold" error={fieldErrors.alertThreshold}>
              <Input id="alertThreshold" name="alertThreshold" type="number" min={1} max={100} defaultValue={item?.alertThreshold ?? 80} />
            </FormField>
            <FormField label={t(locale, "form.startDate")} name="startDate" error={fieldErrors.startDate} hint={t(locale, "form.datePattern")}>
              <Input id="startDate" name="startDate" defaultValue={item?.startDate ?? today} required />
            </FormField>
            <FormField label={t(locale, "form.endDate")} name="endDate" error={fieldErrors.endDate} hint={t(locale, "form.optionalDatePattern")}>
              <Input id="endDate" name="endDate" defaultValue={item?.endDate ?? ""} />
            </FormField>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function GoalForm({
  locale,
  onSuccess,
  currency,
  today,
  item,
}: {
  locale: Locale;
  onSuccess: () => void;
  currency: string;
  today: string;
  item?: WithId & {
    name: string;
    targetAmount: bigint;
    targetDate: Date | null;
    description: string | null;
    color: string;
  };
}) {
  return (
    <ActionForm
      action={saveGoalAction}
      onSuccess={onSuccess}
      submitLabel={t(locale, item ? "form.updateGoal" : "form.createGoal")}
    >
      {({ fieldErrors }) => (
        <>
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <FormField label={t(locale, "common.name")} name="name" error={fieldErrors.name}>
            <Input id="name" name="name" defaultValue={item?.name} placeholder={t(locale, "form.goalPlaceholder")} required />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "form.targetWithCurrency", { currency })} name="targetAmount" error={fieldErrors.targetAmount}>
              <Input id="targetAmount" name="targetAmount" inputMode="decimal" defaultValue={item ? amountInput(item.targetAmount, currency) : ""} required />
            </FormField>
            <FormField label={t(locale, "form.targetDate")} name="targetDate" error={fieldErrors.targetDate} hint={t(locale, "form.optionalDatePattern")}>
              <Input id="targetDate" name="targetDate" defaultValue={item?.targetDate ? item.targetDate.toISOString().slice(0, 10).split("-").reverse().join("/") : ""} />
            </FormField>
            <FormField label={t(locale, "form.color")} name="color" error={fieldErrors.color}>
              <Input id="color" name="color" type="color" defaultValue={item?.color ?? "#2563EB"} />
            </FormField>
            <FormField label={t(locale, "form.icon")} name="icon" error={fieldErrors.icon}>
              <Input id="icon" name="icon" defaultValue="target" />
            </FormField>
          </div>
          <FormField label={t(locale, "form.description")} name="description" error={fieldErrors.description}>
            <Textarea id="description" name="description" defaultValue={item?.description ?? ""} />
          </FormField>
          <p className="text-xs text-muted-foreground">{t(locale, "form.todayIs", { date: today })}</p>
        </>
      )}
    </ActionForm>
  );
}

export function ContributionForm({
  locale,
  onSuccess,
  goalId,
  currency,
}: {
  locale: Locale;
  onSuccess: () => void;
  goalId: string;
  currency: string;
}) {
  return (
    <ActionForm action={contributeGoalAction} onSuccess={onSuccess} submitLabel={t(locale, "form.addContribution")}>
      {({ fieldErrors }) => (
        <>
          <input type="hidden" name="goalId" value={goalId} />
          <FormField label={t(locale, "form.contributionAmount", { currency })} name="amount" error={fieldErrors.amount}>
            <Input id="amount" name="amount" inputMode="decimal" required />
          </FormField>
          <FormField label={t(locale, "form.note")} name="note" error={fieldErrors.note}>
            <Input id="note" name="note" />
          </FormField>
        </>
      )}
    </ActionForm>
  );
}

export function DebtForm({
  locale,
  onSuccess,
  currency,
  today,
  item,
}: {
  locale: Locale;
  onSuccess: () => void;
  currency: string;
  today: string;
  item?: WithId & {
    name: string;
    lender: string | null;
    originalAmount: bigint;
    outstandingBalance: bigint;
    interestRate: number | string | null;
    monthlyPayment: bigint | null;
    dueDate: Date | null;
    startDate: Date;
  };
}) {
  const toInput = (date: Date | null) => (date ? new Date(date).toISOString().slice(0, 10).split("-").reverse().join("/") : "");
  return (
    <ActionForm action={saveDebtAction} onSuccess={onSuccess} submitLabel={t(locale, item ? "form.updateDebt" : "form.addDebt")}>
      {({ fieldErrors }) => (
        <>
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <FormField label={t(locale, "common.name")} name="name" error={fieldErrors.name}>
            <Input id="name" name="name" defaultValue={item?.name} placeholder={t(locale, "form.debtPlaceholder")} required />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "form.lender")} name="lender" error={fieldErrors.lender}>
              <Input id="lender" name="lender" defaultValue={item?.lender ?? ""} />
            </FormField>
            <FormField label={t(locale, "form.originalAmountWithCurrency", { currency })} name="originalAmount" error={fieldErrors.originalAmount}>
              <Input id="originalAmount" name="originalAmount" inputMode="decimal" defaultValue={item ? amountInput(item.originalAmount, currency) : ""} required />
            </FormField>
            <FormField label={t(locale, "form.outstandingBalance")} name="outstandingBalance" error={fieldErrors.outstandingBalance}>
              <Input id="outstandingBalance" name="outstandingBalance" inputMode="decimal" defaultValue={item ? amountInput(item.outstandingBalance, currency) : ""} required />
            </FormField>
            <FormField label={`${t(locale, "debts.interestRate")} (%)`} name="interestRate" error={fieldErrors.interestRate}>
              <Input id="interestRate" name="interestRate" type="number" min={0} max={100} step="0.01" defaultValue={item?.interestRate ? String(item.interestRate) : ""} />
            </FormField>
            <FormField label={t(locale, "debts.monthlyPayment")} name="monthlyPayment" error={fieldErrors.monthlyPayment}>
              <Input id="monthlyPayment" name="monthlyPayment" inputMode="decimal" defaultValue={item?.monthlyPayment ? amountInput(item.monthlyPayment, currency) : ""} />
            </FormField>
            <FormField label={t(locale, "form.startDate")} name="startDate" error={fieldErrors.startDate} hint={t(locale, "form.datePattern")}>
              <Input id="startDate" name="startDate" defaultValue={item ? toInput(item.startDate) : today} required />
            </FormField>
            <FormField label={t(locale, "form.dueDate")} name="dueDate" error={fieldErrors.dueDate} hint={t(locale, "form.optionalDatePattern")}>
              <Input id="dueDate" name="dueDate" defaultValue={item ? toInput(item.dueDate) : ""} />
            </FormField>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function DebtPaymentForm({
  locale,
  onSuccess,
  debtId,
  currency,
  today,
}: {
  locale: Locale;
  onSuccess: () => void;
  debtId: string;
  currency: string;
  today: string;
}) {
  return (
    <ActionForm action={recordDebtPaymentAction} onSuccess={onSuccess} submitLabel={t(locale, "form.recordPayment")}>
      {({ fieldErrors }) => (
        <>
          <input type="hidden" name="debtId" value={debtId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "form.amountWithCurrency", { currency })} name="amount" error={fieldErrors.amount}>
              <Input id="amount" name="amount" inputMode="decimal" required />
            </FormField>
            <FormField label={t(locale, "form.paymentDate")} name="paymentDate" error={fieldErrors.paymentDate} hint={t(locale, "form.datePattern")}>
              <Input id="paymentDate" name="paymentDate" defaultValue={today} required />
            </FormField>
          </div>
          <FormField label={t(locale, "form.note")} name="note" error={fieldErrors.note}>
            <Input id="note" name="note" />
          </FormField>
        </>
      )}
    </ActionForm>
  );
}

export function RecurringForm({
  locale,
  onSuccess,
  accounts,
  categories,
  currency,
  today,
  item,
}: {
  locale: Locale;
  onSuccess: () => void;
  accounts: CurrencyOption[];
  categories: Option[];
  currency: string;
  today: string;
  item?: WithId & {
    title: string;
    type: string;
    amount: bigint;
    accountId: string;
    categoryId: string | null;
    frequency: string;
    interval: number;
    startDate: Date;
    endDate: Date | null;
    active: boolean;
  };
}) {
  const {
    accountId,
    changeAccount,
    currency: amountCurrency,
    amount,
    setAmount,
  } = useCurrencyAccountAmount(accounts, item?.accountId, currency, item?.amount);
  const toInput = (date: Date | null) => (date ? new Date(date).toISOString().slice(0, 10).split("-").reverse().join("/") : "");
  return (
    <ActionForm action={saveRecurringAction} onSuccess={onSuccess} submitLabel={t(locale, item ? "form.updateRule" : "form.createRule")}>
      {({ fieldErrors }) => (
        <>
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <FormField label={t(locale, "common.title")} name="title" error={fieldErrors.title}>
            <Input id="title" name="title" defaultValue={item?.title} placeholder={t(locale, "form.recurringPlaceholder")} required />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "common.type")} name="type" error={fieldErrors.type}>
              <Select id="type" name="type" defaultValue={item?.type ?? "EXPENSE"}>
                <option value="EXPENSE">{t(locale, "transactions.expense")}</option>
                <option value="INCOME">{t(locale, "transactions.income")}</option>
              </Select>
            </FormField>
            <FormField label={t(locale, "form.amountWithCurrency", { currency: amountCurrency })} name="amount" error={fieldErrors.amount}>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </FormField>
            <FormField label={t(locale, "common.account")} name="accountId" error={fieldErrors.accountId}>
              <Select
                id="accountId"
                name="accountId"
                value={accountId}
                onChange={(event) => changeAccount(event.target.value)}
                required
              >
                <Options items={accounts} />
              </Select>
            </FormField>
            <FormField label={t(locale, "common.category")} name="categoryId" error={fieldErrors.categoryId}>
              <Select id="categoryId" name="categoryId" defaultValue={item?.categoryId ?? ""}>
                <option value="">{t(locale, "form.uncategorized")}</option>
                <Options items={categories} />
              </Select>
            </FormField>
            <FormField label={t(locale, "recurring.frequency")} name="frequency" error={fieldErrors.frequency}>
              <Select id="frequency" name="frequency" defaultValue={item?.frequency ?? "MONTHLY"}>
                {frequencies.map((value) => <option key={value} value={value}>{frequencyLabel(locale, value)}</option>)}
              </Select>
            </FormField>
            <FormField label={t(locale, "form.everyNPeriods")} name="interval" error={fieldErrors.interval}>
              <Input id="interval" name="interval" type="number" min={1} max={365} defaultValue={item?.interval ?? 1} />
            </FormField>
            <FormField label={t(locale, "form.startDate")} name="startDate" error={fieldErrors.startDate} hint={t(locale, "form.datePattern")}>
              <Input id="startDate" name="startDate" defaultValue={item ? toInput(item.startDate) : today} required />
            </FormField>
            <FormField label={t(locale, "form.endDate")} name="endDate" error={fieldErrors.endDate} hint={t(locale, "form.optionalDatePattern")}>
              <Input id="endDate" name="endDate" defaultValue={item ? toInput(item.endDate) : ""} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="size-4" />
            {t(locale, "common.active")}
          </label>
        </>
      )}
    </ActionForm>
  );
}

export function MarkAllReadForm({ onSuccess }: { onSuccess: () => void }) {
  const locale = useClientLocale();
  const action = React.useCallback(
    (_formData: FormData) => markAllNotificationsReadAction(),
    [],
  );
  return (
    <ActionForm action={action} onSuccess={onSuccess} submitLabel={t(locale, "action.markAllRead")}>
      <span className="sr-only">{t(locale, "form.markAllReadAria")}</span>
    </ActionForm>
  );
}

export function SettingsForm({
  locale,
  user,
  accounts,
}: {
  locale: Locale;
  user: {
    fullName: string;
    email: string;
    preferredCurrency: string;
    preferredLanguage: string;
    timezone: string;
    dateFormat: string;
    firstDayOfWeek: number;
    defaultAccountId: string | null;
    theme: string;
  };
  accounts: Option[];
}) {
  return (
    <ActionForm action={saveSettingsAction} submitLabel={t(locale, "form.saveSettings")}>
      {({ fieldErrors }) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "form.fullName")} name="fullName" error={fieldErrors.fullName}>
              <Input id="fullName" name="fullName" defaultValue={user.fullName} required />
            </FormField>
            <FormField label={t(locale, "form.email")} name="email" error={fieldErrors.email}>
              <Input id="email" name="email" type="email" defaultValue={user.email} required />
            </FormField>
            <FormField label={t(locale, "settings.currency")} name="preferredCurrency" error={fieldErrors.preferredCurrency} hint={t(locale, "form.displayCurrencyHint")}>
              <Select id="preferredCurrency" name="preferredCurrency" defaultValue={user.preferredCurrency}>
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>{CURRENCY_NAMES[code]}</option>
                ))}
              </Select>
            </FormField>
            <FormField label={t(locale, "settings.language")} name="preferredLanguage" error={fieldErrors.preferredLanguage}>
              <Select id="preferredLanguage" name="preferredLanguage" defaultValue={user.preferredLanguage}>
                {LOCALES.map((code) => (
                  <option key={code} value={code}>{LOCALE_NAMES[code]}</option>
                ))}
              </Select>
            </FormField>
            <FormField label={t(locale, "settings.timezone")} name="timezone" error={fieldErrors.timezone} hint={t(locale, "form.timezoneHint")}>
              <Select id="timezone" name="timezone" defaultValue={user.timezone}>
                {!COMMON_TIMEZONES.includes(user.timezone as (typeof COMMON_TIMEZONES)[number]) && (
                  <option value={user.timezone}>{user.timezone}</option>
                )}
                {COMMON_TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>
                ))}
              </Select>
            </FormField>
            <FormField label={t(locale, "settings.dateFormat")} name="dateFormat" error={fieldErrors.dateFormat}>
              <Select id="dateFormat" name="dateFormat" defaultValue={user.dateFormat}>
                <option value="DD/MM/YYYY">{t(locale, "form.datePattern")}</option>
              </Select>
            </FormField>
            <FormField label={t(locale, "settings.weekStarts")} name="firstDayOfWeek" error={fieldErrors.firstDayOfWeek}>
              <Select id="firstDayOfWeek" name="firstDayOfWeek" defaultValue={String(user.firstDayOfWeek)}>
                <option value="0">{t(locale, "settings.sunday")}</option>
                <option value="1">{t(locale, "settings.monday")}</option>
              </Select>
            </FormField>
            <FormField label={t(locale, "form.defaultAccount")} name="defaultAccountId" error={fieldErrors.defaultAccountId}>
              <Select id="defaultAccountId" name="defaultAccountId" defaultValue={user.defaultAccountId ?? ""}>
                <option value="">{t(locale, "form.none")}</option>
                <Options items={accounts} />
              </Select>
            </FormField>
            <FormField label={t(locale, "settings.theme")} name="theme" error={fieldErrors.theme}>
              <Select id="theme" name="theme" defaultValue={user.theme}>
                <option value="system">{t(locale, "form.system")}</option>
                <option value="light">{t(locale, "form.light")}</option>
                <option value="dark">{t(locale, "form.dark")}</option>
              </Select>
            </FormField>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function RefreshButton({ onClick }: { onClick: () => void }) {
  const locale = useClientLocale();
  return <Button variant="outline" size="sm" onClick={onClick}>{t(locale, "form.refresh")}</Button>;
}
