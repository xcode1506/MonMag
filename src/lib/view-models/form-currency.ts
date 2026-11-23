import { fromMinorUnits, toMinorUnits } from "@/lib/money";

export interface CurrencyAccountOption {
  value: string;
  currency: string;
}

/**
 * Resolve the currency a money input is expressed in from the selected
 * account. The user's preference is only a fallback for empty account lists;
 * once an account is selected its currency is authoritative.
 */
export function resolveAccountCurrency(
  accounts: readonly CurrencyAccountOption[],
  accountId: string | undefined,
  fallback: string,
): string {
  return accounts.find((account) => account.value === accountId)?.currency ?? fallback;
}

/**
 * Preserve the entered monetary value when the selected account changes to a
 * currency with a different scale. Minor units are the canonical bridge.
 */
export function rescaleAmountText(
  value: string,
  fromCurrency: string,
  toCurrency: string,
): string {
  if (!value.trim()) return value;
  return fromMinorUnits(toMinorUnits(value, fromCurrency), toCurrency);
}
