import { sumMoney } from "@/lib/money";

export interface LedgerEntry {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: bigint;
  deletedAt?: Date | null;
}

export interface AccountBalanceInput {
  initialBalance: bigint;
  transactions: readonly LedgerEntry[];
  /** Money sent from this account through explicit transfers. */
  transferredOut: readonly bigint[];
  /** Money received by this account through explicit transfers. */
  transferredIn: readonly bigint[];
}

/** Account balance = opening balance + income - expense - transfers out + transfers in. */
export function accountBalance(input: AccountBalanceInput): bigint {
  const active = input.transactions.filter((entry) => !entry.deletedAt);
  const income = sumMoney(
    active.filter((entry) => entry.type === "INCOME").map((entry) => entry.amount),
  );
  const expense = sumMoney(
    active.filter((entry) => entry.type === "EXPENSE").map((entry) => entry.amount),
  );
  return (
    input.initialBalance +
    income -
    expense -
    sumMoney(input.transferredOut) +
    sumMoney(input.transferredIn)
  );
}

export interface NetWorthAccount {
  balance: bigint;
  type: "CASH" | "BANK" | "EWALLET" | "SAVINGS" | "CREDIT_CARD" | "OTHER";
}

/** Credit card balances are liabilities and are subtracted from assets. */
export function netWorth(accounts: readonly NetWorthAccount[]): {
  assets: bigint;
  liabilities: bigint;
  total: bigint;
} {
  const assets = sumMoney(
    accounts
      .filter((account) => account.type !== "CREDIT_CARD" && account.balance > 0n)
      .map((account) => account.balance),
  );
  const liabilities = sumMoney(
    accounts
      .filter(
        (account) =>
          account.type === "CREDIT_CARD" || account.balance < 0n,
      )
      .map((account) =>
        account.type === "CREDIT_CARD"
          ? account.balance > 0n
            ? account.balance
            : -account.balance
          : -account.balance,
      ),
  );
  return { assets, liabilities, total: assets - liabilities };
}
