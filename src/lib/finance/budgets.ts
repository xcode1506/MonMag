import { percentOf } from "@/lib/money";

export type BudgetState = "safe" | "warning" | "exceeded";

export interface BudgetStatus {
  spent: bigint;
  limit: bigint;
  remaining: bigint;
  percent: number;
  state: BudgetState;
}

export function budgetStatus(
  spent: bigint,
  limit: bigint,
  alertThreshold = 80,
): BudgetStatus {
  if (limit <= 0n) {
    return {
      spent,
      limit,
      remaining: -spent,
      percent: 0,
      state: spent > 0n ? "exceeded" : "safe",
    };
  }
  const percent = percentOf(spent, limit);
  const state: BudgetState =
    percent >= 100 ? "exceeded" : percent >= alertThreshold ? "warning" : "safe";
  return {
    spent,
    limit,
    remaining: limit - spent,
    percent: Math.round(percent * 10) / 10,
    state,
  };
}

/** Evenly distribute a period budget into remaining days. */
export function dailyAllowance(remaining: bigint, daysRemaining: number): bigint {
  if (daysRemaining <= 0) return remaining > 0n ? remaining : 0n;
  return remaining / BigInt(daysRemaining);
}
