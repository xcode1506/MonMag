import { toDateInput } from "@/lib/date";
import { amountInput } from "@/lib/ui";

interface RecurringRowSource {
  id: string;
  title: string;
  type: string;
  amount: bigint;
  accountId: string;
  account: { name: string; currency: string } | null;
  categoryId: string | null;
  category: { name: string } | null;
  frequency: string;
  interval: number;
  startDate: Date;
  endDate: Date | null;
  nextRun: Date;
  active: boolean;
}

export interface RecurringRow {
  id: string;
  title: string;
  type: string;
  /** Decimal string in the rule account's currency. */
  amount: string;
  /** Currency used for both display and edit form defaults. */
  accountCurrency: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  frequency: string;
  interval: number;
  startDate: string;
  endDate: string | null;
  nextRun: string;
  active: boolean;
}

/**
 * Carry the account currency with each rule so a mixed-currency account never
 * renders or edits a stored minor-unit amount using the user's preference.
 */
export function toRecurringRow(
  item: RecurringRowSource,
  fallbackCurrency = "IDR",
): RecurringRow {
  const accountCurrency = item.account?.currency ?? fallbackCurrency;
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    amount: amountInput(item.amount, accountCurrency),
    accountCurrency,
    accountId: item.accountId,
    accountName: item.account?.name ?? "Unknown account",
    categoryId: item.categoryId ?? null,
    categoryName: item.category?.name ?? null,
    frequency: item.frequency,
    interval: item.interval,
    startDate: toDateInput(item.startDate),
    endDate: item.endDate ? toDateInput(item.endDate) : null,
    nextRun: toDateInput(item.nextRun),
    active: item.active,
  };
}
