import { toDateInput } from "@/lib/date";
import { amountInput } from "@/lib/ui";

interface TransactionRowSource {
  id: string;
  title: string;
  type: string;
  amount: bigint;
  accountId: string;
  account: { name: string; currency: string } | null;
  category: { name: string } | null;
  transactionDate: Date;
  paymentMethod: string | null;
  description: string | null;
}

export interface TransactionRow {
  id: string;
  title: string;
  type: string;
  /** Decimal string in the transaction account's currency. */
  amount: string;
  /** Currency used for both display and edit form defaults. */
  accountCurrency: string;
  accountId: string;
  accountName: string;
  categoryName: string | null;
  transactionDate: string;
  paymentMethod: string | null;
  description: string | null;
}

/**
 * Convert a ledger row into a client-safe DTO. The account currency travels
 * with the amount so a mixed-currency ledger never renders or edits a value
 * using the user's preferred currency by mistake.
 */
export function toTransactionRow(item: TransactionRowSource): TransactionRow {
  const accountCurrency = item.account?.currency ?? "IDR";
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    amount: amountInput(item.amount, accountCurrency),
    accountCurrency,
    accountId: item.accountId,
    accountName: item.account?.name ?? "Unknown account",
    categoryName: item.category?.name ?? null,
    transactionDate: toDateInput(item.transactionDate),
    paymentMethod: item.paymentMethod,
    description: item.description,
  };
}
