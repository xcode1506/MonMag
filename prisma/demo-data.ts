/**
 * Deterministic demo data for the MonMag seed script.
 *
 * Rules for this file:
 * - No secrets, credentials, or real personal data.
 * - All money is a BigInt integer number of minor units (IDR: 1 unit = 1 rupiah).
 * - Fixed UTC dates keep repeated seeds byte-for-byte predictable.
 * - Logical keys are converted to owner-scoped ids by `buildDemoData`, so demo
 *   rows can never collide with another user's rows or idempotency keys.
 */
import type {
  AccountType,
  BudgetPeriod,
  CategoryType,
  Frequency,
  GoalStatus,
  NotificationType,
  TxType,
} from "../src/generated/prisma/client";

/** Currency and locale assumptions used by the app (see src/lib/date.ts and money.ts). */
export const DEMO_CURRENCY = "IDR" as const;
export const DEMO_TIMEZONE = "Asia/Jakarta" as const;
export const DEMO_DATE_FORMAT = "DD/MM/YYYY" as const;

/** Fixed creation timestamp for every seeded row. */
export const DEMO_CREATED_AT = new Date("2025-12-01T00:00:00.000Z");

/** Non-personal placeholder profile used only when the local user row is absent. */
export const DEMO_PROFILE = {
  fullName: "MonMag Demo User",
  email: "demo.user@example.invalid",
  preferredCurrency: DEMO_CURRENCY,
  preferredLanguage: "en",
  timezone: DEMO_TIMEZONE,
  dateFormat: DEMO_DATE_FORMAT,
  firstDayOfWeek: 1,
  theme: "system",
  onboardingStep: 3,
  onboardingCompleted: true,
} as const;

/** Row shapes returned to the seed script. Every row carries `id` and `userId`. */
export interface DemoUserProfile {
  clerkUserId: string;
  fullName: string;
  email: string;
  preferredCurrency: string;
  preferredLanguage: string;
  timezone: string;
  dateFormat: string;
  firstDayOfWeek: number;
  theme: string;
  onboardingStep: number;
  onboardingCompleted: boolean;
}

export interface DemoAccount {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: bigint;
  archived: boolean;
  color: string;
  icon: string;
  description: string | null;
  creditLimit: bigint | null;
  reconciledBalance: bigint | null;
  reconciledAt: Date | null;
  createdAt: Date;
}

export interface DemoCategory {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface DemoTransaction {
  id: string;
  userId: string;
  accountId: string;
  title: string;
  type: TxType;
  amount: bigint;
  categoryId: string | null;
  transactionDate: Date;
  paymentMethod: string | null;
  description: string | null;
  recurringId: string | null;
  transferId: string | null;
  idempotencyKey: string;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface DemoTransfer {
  id: string;
  userId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: bigint;
  transactionDate: Date;
  description: string | null;
  idempotencyKey: string;
  createdAt: Date;
}

export interface DemoBudget {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  amount: bigint;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date | null;
  alertThreshold: number;
  createdAt: Date;
}

export interface DemoGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: bigint;
  currentAmount: bigint;
  targetDate: Date | null;
  description: string | null;
  icon: string;
  color: string;
  status: GoalStatus;
  completedAt: Date | null;
  createdAt: Date;
}

export interface DemoContribution {
  id: string;
  userId: string;
  goalId: string;
  amount: bigint;
  note: string | null;
  transactionId: string | null;
  createdAt: Date;
}

export interface DemoDebt {
  id: string;
  userId: string;
  name: string;
  lender: string | null;
  originalAmount: bigint;
  outstandingBalance: bigint;
  /** Annual percentage rate as a decimal string; this is a rate, not money. */
  interestRate: string | null;
  monthlyPayment: bigint | null;
  dueDate: Date | null;
  startDate: Date;
  createdAt: Date;
}

export interface DemoDebtPayment {
  id: string;
  userId: string;
  debtId: string;
  amount: bigint;
  paymentDate: Date;
  note: string | null;
  createdAt: Date;
}

export interface DemoRecurring {
  id: string;
  userId: string;
  accountId: string;
  title: string;
  type: TxType;
  amount: bigint;
  categoryId: string | null;
  frequency: Frequency;
  interval: number;
  startDate: Date;
  endDate: Date | null;
  nextRun: Date;
  lastProcessedRun: Date | null;
  active: boolean;
  createdAt: Date;
}

export interface DemoNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
}

export interface DemoDataSet {
  profile: DemoUserProfile;
  accounts: DemoAccount[];
  categories: DemoCategory[];
  transactions: DemoTransaction[];
  transfers: DemoTransfer[];
  budgets: DemoBudget[];
  savingsGoals: DemoGoal[];
  savingsContributions: DemoContribution[];
  debts: DemoDebt[];
  debtPayments: DemoDebtPayment[];
  recurringTransactions: DemoRecurring[];
  notifications: DemoNotification[];
}

/* -------------------------------------------------------------------------- */
/* Definitions: change data here, never in the generated row builders.         */
/* -------------------------------------------------------------------------- */

interface AccountDef {
  key: string;
  name: string;
  type: AccountType;
  initialBalance: bigint;
  color: string;
  icon: string;
  description: string | null;
}

const ACCOUNT_DEFS = [
  {
    key: "account-cash",
    name: "Demo Cash Wallet",
    type: "CASH",
    initialBalance: 250_000n,
    color: "#0F766E",
    icon: "wallet",
    description: "Fictional cash wallet used by the demo seed.",
  },
  {
    key: "account-bank",
    name: "Demo Bank Account",
    type: "BANK",
    initialBalance: 5_000_000n,
    color: "#2563EB",
    icon: "landmark",
    description: "Fictional bank account used by the demo seed.",
  },
  {
    key: "account-ewallet",
    name: "Demo E-Wallet",
    type: "EWALLET",
    initialBalance: 750_000n,
    color: "#7C3AED",
    icon: "smartphone",
    description: "Fictional e-wallet used by the demo seed.",
  },
] as const satisfies readonly AccountDef[];

interface CategoryDef {
  key: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

const CATEGORY_DEFS = [
  { key: "cat-salary", name: "Salary", type: "INCOME", icon: "briefcase", color: "#15803D" },
  { key: "cat-freelance", name: "Freelance", type: "INCOME", icon: "laptop", color: "#0D9488" },
  { key: "cat-groceries", name: "Groceries", type: "EXPENSE", icon: "shopping-cart", color: "#B45309" },
  { key: "cat-housing", name: "Housing", type: "EXPENSE", icon: "house", color: "#4338CA" },
  { key: "cat-transport", name: "Transport", type: "EXPENSE", icon: "bus", color: "#0369A1" },
  { key: "cat-utilities", name: "Utilities", type: "EXPENSE", icon: "zap", color: "#BE123C" },
] as const satisfies readonly CategoryDef[];

interface TransactionDef {
  key: string;
  accountKey: string;
  categoryKey: string | null;
  title: string;
  type: "INCOME" | "EXPENSE";
  amount: bigint;
  date: string;
  paymentMethod: string | null;
  description: string | null;
}

const TRANSACTION_DEFS = [
  {
    key: "tx-salary-jan",
    accountKey: "account-bank",
    categoryKey: "cat-salary",
    title: "Demo salary - January",
    type: "INCOME",
    amount: 4_500_000n,
    date: "2026-01-01T00:00:00.000Z",
    paymentMethod: "bank_transfer",
    description: "Fictional January salary.",
  },
  {
    key: "tx-rent-jan",
    accountKey: "account-bank",
    categoryKey: "cat-housing",
    title: "Demo rent - January",
    type: "EXPENSE",
    amount: 2_000_000n,
    date: "2026-01-02T00:00:00.000Z",
    paymentMethod: "bank_transfer",
    description: "Fictional rent payment.",
  },
  {
    key: "tx-groceries-jan",
    accountKey: "account-cash",
    categoryKey: "cat-groceries",
    title: "Demo groceries",
    type: "EXPENSE",
    amount: 375_000n,
    date: "2026-01-06T00:00:00.000Z",
    paymentMethod: "cash",
    description: "Fictional grocery purchase.",
  },
  {
    key: "tx-transport-jan",
    accountKey: "account-ewallet",
    categoryKey: "cat-transport",
    title: "Demo transit top-up",
    type: "EXPENSE",
    amount: 120_000n,
    date: "2026-01-11T00:00:00.000Z",
    paymentMethod: "ewallet",
    description: "Fictional transport expense.",
  },
  {
    key: "tx-freelance-jan",
    accountKey: "account-ewallet",
    categoryKey: "cat-freelance",
    title: "Demo freelance invoice",
    type: "INCOME",
    amount: 1_250_000n,
    date: "2026-01-18T00:00:00.000Z",
    paymentMethod: "ewallet",
    description: "Fictional freelance income.",
  },
  {
    key: "tx-utilities-jan",
    accountKey: "account-bank",
    categoryKey: "cat-utilities",
    title: "Demo utilities - January",
    type: "EXPENSE",
    amount: 440_000n,
    date: "2026-01-21T00:00:00.000Z",
    paymentMethod: "autodebit",
    description: "Fictional utility bill.",
  },
  {
    key: "tx-salary-feb",
    accountKey: "account-bank",
    categoryKey: "cat-salary",
    title: "Demo salary - February",
    type: "INCOME",
    amount: 4_500_000n,
    date: "2026-02-01T00:00:00.000Z",
    paymentMethod: "bank_transfer",
    description: "Fictional February salary.",
  },
  {
    key: "tx-rent-feb",
    accountKey: "account-bank",
    categoryKey: "cat-housing",
    title: "Demo rent - February",
    type: "EXPENSE",
    amount: 2_000_000n,
    date: "2026-02-02T00:00:00.000Z",
    paymentMethod: "bank_transfer",
    description: "Fictional rent payment.",
  },
  {
    key: "tx-groceries-feb",
    accountKey: "account-ewallet",
    categoryKey: "cat-groceries",
    title: "Demo groceries - February",
    type: "EXPENSE",
    amount: 510_000n,
    date: "2026-02-09T00:00:00.000Z",
    paymentMethod: "ewallet",
    description: "Fictional grocery purchase.",
  },
  {
    key: "tx-salary-mar",
    accountKey: "account-bank",
    categoryKey: "cat-salary",
    title: "Demo salary - March",
    type: "INCOME",
    amount: 4_500_000n,
    date: "2026-03-01T00:00:00.000Z",
    paymentMethod: "bank_transfer",
    description: "Fictional March salary.",
  },
  {
    key: "tx-rent-mar",
    accountKey: "account-bank",
    categoryKey: "cat-housing",
    title: "Demo rent - March",
    type: "EXPENSE",
    amount: 2_000_000n,
    date: "2026-03-02T00:00:00.000Z",
    paymentMethod: "bank_transfer",
    description: "Fictional rent payment.",
  },
  {
    key: "tx-transport-mar",
    accountKey: "account-cash",
    categoryKey: "cat-transport",
    title: "Demo fuel",
    type: "EXPENSE",
    amount: 200_000n,
    date: "2026-03-12T00:00:00.000Z",
    paymentMethod: "cash",
    description: "Fictional transport expense.",
  },
] as const satisfies readonly TransactionDef[];

interface TransferDef {
  key: string;
  sourceKey: string;
  destinationKey: string;
  amount: bigint;
  date: string;
  description: string | null;
}

const TRANSFER_DEFS = [
  {
    key: "transfer-jan",
    sourceKey: "account-bank",
    destinationKey: "account-ewallet",
    amount: 500_000n,
    date: "2026-01-15T00:00:00.000Z",
    description: "Demo top-up from bank to e-wallet.",
  },
  {
    key: "transfer-feb",
    sourceKey: "account-bank",
    destinationKey: "account-cash",
    amount: 250_000n,
    date: "2026-02-20T00:00:00.000Z",
    description: "Demo cash withdrawal from bank.",
  },
] as const satisfies readonly TransferDef[];

interface BudgetDef {
  key: string;
  name: string;
  categoryKey: string | null;
  amount: bigint;
  period: BudgetPeriod;
  startDate: string;
  alertThreshold: number;
}

const BUDGET_DEFS = [
  {
    key: "budget-groceries",
    name: "Demo groceries monthly",
    categoryKey: "cat-groceries",
    amount: 1_500_000n,
    period: "MONTHLY",
    startDate: "2026-01-01T00:00:00.000Z",
    alertThreshold: 80,
  },
  {
    key: "budget-all-expenses",
    name: "Demo total expenses monthly",
    categoryKey: null,
    amount: 6_000_000n,
    period: "MONTHLY",
    startDate: "2026-01-01T00:00:00.000Z",
    alertThreshold: 90,
  },
] as const satisfies readonly BudgetDef[];

interface GoalDef {
  key: string;
  name: string;
  targetAmount: bigint;
  currentAmount: bigint;
  targetDate: string;
  description: string | null;
  icon: string;
  color: string;
}

const GOAL_DEFS = [
  {
    key: "goal-emergency",
    name: "Demo emergency fund",
    targetAmount: 20_000_000n,
    currentAmount: 4_500_000n,
    targetDate: "2026-12-31T00:00:00.000Z",
    description: "Fictional emergency fund goal.",
    icon: "shield",
    color: "#15803D",
  },
  {
    key: "goal-laptop",
    name: "Demo laptop replacement",
    targetAmount: 12_000_000n,
    currentAmount: 3_000_000n,
    targetDate: "2027-06-30T00:00:00.000Z",
    description: "Fictional hardware savings goal.",
    icon: "laptop",
    color: "#7C3AED",
  },
] as const satisfies readonly GoalDef[];

interface ContributionDef {
  key: string;
  goalKey: string;
  amount: bigint;
  note: string | null;
  date: string;
}

const CONTRIBUTION_DEFS = [
  {
    key: "contribution-emergency-1",
    goalKey: "goal-emergency",
    amount: 3_000_000n,
    note: "Demo opening deposit.",
    date: "2026-01-05T00:00:00.000Z",
  },
  {
    key: "contribution-emergency-2",
    goalKey: "goal-emergency",
    amount: 1_500_000n,
    note: "Demo follow-up deposit.",
    date: "2026-02-05T00:00:00.000Z",
  },
  {
    key: "contribution-laptop-1",
    goalKey: "goal-laptop",
    amount: 2_000_000n,
    note: "Demo opening deposit.",
    date: "2026-01-08T00:00:00.000Z",
  },
  {
    key: "contribution-laptop-2",
    goalKey: "goal-laptop",
    amount: 1_000_000n,
    note: "Demo follow-up deposit.",
    date: "2026-02-08T00:00:00.000Z",
  },
] as const satisfies readonly ContributionDef[];

interface DebtDef {
  key: string;
  name: string;
  lender: string | null;
  originalAmount: bigint;
  outstandingBalance: bigint;
  interestRate: string | null;
  monthlyPayment: bigint | null;
  dueDate: string;
  startDate: string;
}

const DEBT_DEFS = [
  {
    key: "debt-study",
    name: "Demo study loan",
    lender: "Demo Lender (fictional)",
    originalAmount: 15_000_000n,
    outstandingBalance: 12_000_000n,
    interestRate: "5.000",
    monthlyPayment: 1_000_000n,
    dueDate: "2026-12-15T00:00:00.000Z",
    startDate: "2025-01-10T00:00:00.000Z",
  },
] as const satisfies readonly DebtDef[];

interface DebtPaymentDef {
  key: string;
  debtKey: string;
  amount: bigint;
  date: string;
  note: string | null;
}

const DEBT_PAYMENT_DEFS = [
  {
    key: "debt-payment-jan",
    debtKey: "debt-study",
    amount: 1_000_000n,
    date: "2026-01-10T00:00:00.000Z",
    note: "Demo installment.",
  },
  {
    key: "debt-payment-feb",
    debtKey: "debt-study",
    amount: 1_000_000n,
    date: "2026-02-10T00:00:00.000Z",
    note: "Demo installment.",
  },
  {
    key: "debt-payment-mar",
    debtKey: "debt-study",
    amount: 1_000_000n,
    date: "2026-03-10T00:00:00.000Z",
    note: "Demo installment.",
  },
] as const satisfies readonly DebtPaymentDef[];

interface RecurringDef {
  key: string;
  title: string;
  type: "INCOME" | "EXPENSE";
  amount: bigint;
  accountKey: string;
  categoryKey: string | null;
  frequency: Frequency;
  interval: number;
  startDate: string;
  nextRun: string;
  active: boolean;
}

const RECURRING_DEFS = [
  {
    key: "recurring-salary",
    title: "Demo monthly salary",
    type: "INCOME",
    amount: 4_500_000n,
    accountKey: "account-bank",
    categoryKey: "cat-salary",
    frequency: "MONTHLY",
    interval: 1,
    startDate: "2026-01-01T00:00:00.000Z",
    nextRun: "2026-12-01T00:00:00.000Z",
    active: true,
  },
  {
    key: "recurring-rent",
    title: "Demo monthly rent",
    type: "EXPENSE",
    amount: 2_000_000n,
    accountKey: "account-bank",
    categoryKey: "cat-housing",
    frequency: "MONTHLY",
    interval: 1,
    startDate: "2026-01-02T00:00:00.000Z",
    nextRun: "2026-12-02T00:00:00.000Z",
    active: true,
  },
] as const satisfies readonly RecurringDef[];

interface NotificationDef {
  key: string;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
}

const NOTIFICATION_DEFS = [
  {
    key: "notification-budget",
    title: "Demo budget reminder",
    message: "This is a sample budget warning notification from the demo seed.",
    type: "BUDGET_WARNING",
    date: "2026-03-15T00:00:00.000Z",
  },
  {
    key: "notification-recurring",
    title: "Demo recurring reminder",
    message: "This is a sample recurring reminder notification from the demo seed.",
    type: "RECURRING_UPCOMING",
    date: "2026-03-16T00:00:00.000Z",
  },
  {
    key: "notification-goal",
    title: "Demo savings milestone",
    message: "This is a sample savings milestone notification from the demo seed.",
    type: "SAVINGS_MILESTONE",
    date: "2026-03-17T00:00:00.000Z",
  },
] as const satisfies readonly NotificationDef[];

/* -------------------------------------------------------------------------- */
/* Builders: logical keys become owner-scoped ids and idempotency keys.         */
/* -------------------------------------------------------------------------- */

/** Ids include the local user id so two demo users never share a primary key. */
function rowId(ownerUserId: string, logicalKey: string): string {
  return `${ownerUserId}-demo-${logicalKey}`;
}

/** Idempotency keys are globally unique in the schema, so namespace by owner. */
function seedKey(ownerUserId: string, logicalKey: string): string {
  return `seed:${ownerUserId}:${logicalKey}`;
}

/** Build the non-personal profile used when a local user row must be created. */
export function buildDemoProfile(clerkUserId: string): DemoUserProfile {
  return { clerkUserId, ...DEMO_PROFILE };
}

/**
 * Build the complete demo dataset for one already-resolved local user.
 * Calling this twice with the same arguments returns deeply equal values.
 */
export function buildDemoData(ownerUserId: string, clerkUserId: string): DemoDataSet {
  const id = (logicalKey: string) => rowId(ownerUserId, logicalKey);
  const key = (logicalKey: string) => seedKey(ownerUserId, logicalKey);
  const accountId = (logicalKey: string) => id(logicalKey);
  const categoryId = (logicalKey: string | null) =>
    logicalKey === null ? null : id(logicalKey);
  const accountNames = new Map(ACCOUNT_DEFS.map((item) => [item.key, item.name]));

  const accounts: DemoAccount[] = ACCOUNT_DEFS.map(({ key: logicalKey, ...def }) => ({
    id: id(logicalKey),
    userId: ownerUserId,
    currency: DEMO_CURRENCY,
    archived: false,
    creditLimit: null,
    reconciledBalance: null,
    reconciledAt: null,
    createdAt: DEMO_CREATED_AT,
    ...def,
  }));

  const categories: DemoCategory[] = CATEGORY_DEFS.map(({ key: logicalKey, ...def }) => ({
    id: id(logicalKey),
    userId: ownerUserId,
    isDefault: false,
    createdAt: DEMO_CREATED_AT,
    ...def,
  }));

  const ordinaryTransactions: DemoTransaction[] = TRANSACTION_DEFS.map(
    ({ key: logicalKey, accountKey, categoryKey, date, ...def }) => ({
      id: id(logicalKey),
      userId: ownerUserId,
      accountId: accountId(accountKey),
      categoryId: categoryId(categoryKey),
      transactionDate: new Date(date),
      recurringId: null,
      transferId: null,
      idempotencyKey: key(logicalKey),
      deletedAt: null,
      createdAt: DEMO_CREATED_AT,
      ...def,
    }),
  );

  const transfers: DemoTransfer[] = TRANSFER_DEFS.map(
    ({ key: logicalKey, sourceKey, destinationKey, date, ...def }) => ({
      id: id(logicalKey),
      userId: ownerUserId,
      sourceAccountId: accountId(sourceKey),
      destinationAccountId: accountId(destinationKey),
      transactionDate: new Date(date),
      createdAt: DEMO_CREATED_AT,
      idempotencyKey: key(logicalKey),
      ...def,
    }),
  );

  // Mirror src/lib/services/transactions.ts: one Transfer plus two TRANSFER
  // transactions with ":out" / ":in" idempotency keys in a single logical pair.
  const transferTransactions: DemoTransaction[] = TRANSFER_DEFS.flatMap((def) => {
    const transferId = id(def.key);
    const sourceName = accountNames.get(def.sourceKey) ?? "Demo account";
    const destinationName = accountNames.get(def.destinationKey) ?? "Demo account";
    const shared = {
      userId: ownerUserId,
      type: "TRANSFER" as const,
      amount: def.amount,
      transactionDate: new Date(def.date),
      categoryId: null,
      paymentMethod: null,
      description: def.description,
      recurringId: null,
      transferId,
      deletedAt: null,
      createdAt: DEMO_CREATED_AT,
    };

    return [
      {
        ...shared,
        id: id(`${def.key}-out`),
        accountId: accountId(def.sourceKey),
        title: `Transfer to ${destinationName}`,
        idempotencyKey: key(`${def.key}:out`),
      },
      {
        ...shared,
        id: id(`${def.key}-in`),
        accountId: accountId(def.destinationKey),
        title: `Transfer from ${sourceName}`,
        idempotencyKey: key(`${def.key}:in`),
      },
    ];
  });

  const budgets: DemoBudget[] = BUDGET_DEFS.map(
    ({ key: logicalKey, categoryKey, startDate, ...def }) => ({
      id: id(logicalKey),
      userId: ownerUserId,
      categoryId: categoryId(categoryKey),
      startDate: new Date(startDate),
      endDate: null,
      createdAt: DEMO_CREATED_AT,
      ...def,
    }),
  );

  const savingsGoals: DemoGoal[] = GOAL_DEFS.map(
    ({ key: logicalKey, targetDate, ...def }) => ({
      id: id(logicalKey),
      userId: ownerUserId,
      targetDate: new Date(targetDate),
      status: "ACTIVE",
      completedAt: null,
      createdAt: DEMO_CREATED_AT,
      ...def,
    }),
  );

  const savingsContributions: DemoContribution[] = CONTRIBUTION_DEFS.map(
    ({ key: logicalKey, goalKey, date, ...def }) => ({
      id: id(logicalKey),
      userId: ownerUserId,
      goalId: id(goalKey),
      transactionId: null,
      createdAt: new Date(date),
      ...def,
    }),
  );

  const debts: DemoDebt[] = DEBT_DEFS.map(
    ({ key: logicalKey, dueDate, startDate, ...def }) => ({
      id: id(logicalKey),
      userId: ownerUserId,
      dueDate: new Date(dueDate),
      startDate: new Date(startDate),
      createdAt: DEMO_CREATED_AT,
      ...def,
    }),
  );

  const debtPayments: DemoDebtPayment[] = DEBT_PAYMENT_DEFS.map(
    ({ key: logicalKey, debtKey, date, ...def }) => ({
      id: id(logicalKey),
      userId: ownerUserId,
      debtId: id(debtKey),
      paymentDate: new Date(date),
      createdAt: new Date(date),
      ...def,
    }),
  );

  const recurringTransactions: DemoRecurring[] = RECURRING_DEFS.map(
    ({ key: logicalKey, accountKey, categoryKey, startDate, nextRun, ...def }) => ({
      id: id(logicalKey),
      userId: ownerUserId,
      accountId: accountId(accountKey),
      categoryId: categoryId(categoryKey),
      startDate: new Date(startDate),
      nextRun: new Date(nextRun),
      endDate: null,
      lastProcessedRun: null,
      createdAt: DEMO_CREATED_AT,
      ...def,
    }),
  );

  const notifications: DemoNotification[] = NOTIFICATION_DEFS.map(
    ({ key: logicalKey, date, ...def }) => ({
      id: id(logicalKey),
      userId: ownerUserId,
      read: false,
      createdAt: new Date(date),
      ...def,
    }),
  );

  return {
    profile: buildDemoProfile(clerkUserId),
    accounts,
    categories,
    transactions: [...ordinaryTransactions, ...transferTransactions],
    transfers,
    budgets,
    savingsGoals,
    savingsContributions,
    debts,
    debtPayments,
    recurringTransactions,
    notifications,
  };
}
