/**
 * Chart-ready view models.
 *
 * Recharts renders numbers, while the ledger stores integer minor units and
 * exposes decimal strings. These helpers convert display strings once, keep
 * the source arrays untouched, and derive the two values a chart cannot infer
 * on its own: net flow and category share.
 */

export interface CashflowInput {
  month: string;
  income: string;
  expense: string;
}

export interface CashflowTrendPoint {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryInput {
  name: string;
  value: string;
  color: string;
}

export interface RankedCategory {
  name: string;
  value: number;
  color: string;
  share: number;
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Adds a derived net series without mutating the supplied cashflow points. */
export function buildCashflowTrend(
  points: readonly CashflowInput[],
): CashflowTrendPoint[] {
  return points.map((point) => {
    const income = roundToCents(Number(point.income));
    const expense = roundToCents(Number(point.expense));
    return {
      month: point.month,
      income,
      expense,
      net: roundToCents(income - expense),
    };
  });
}

/**
 * Ranks categories by displayed value and derives share from the full set.
 * The unranked input is never mutated; share uses all categories as the
 * denominator so a truncated top-N still reads as a share of total spend.
 */
export function rankCategories(
  categories: readonly CategoryInput[],
  limit = 6,
): RankedCategory[] {
  const values = categories.map((category) => ({
    ...category,
    value: Number(category.value),
  }));
  const total = values.reduce((sum, category) => sum + category.value, 0);

  return values
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((category) => ({
      name: category.name,
      value: category.value,
      color: category.color,
      share: total === 0 ? 0 : Math.round((category.value / total) * 100),
    }));
}
