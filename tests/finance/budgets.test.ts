import { describe, expect, it } from "vitest";
import { budgetStatus, dailyAllowance } from "@/lib/finance/budgets";

describe("budgetStatus", () => {
  it("reports a safe budget below the threshold", () => {
    expect(budgetStatus(40n, 100n)).toEqual({
      spent: 40n,
      limit: 100n,
      remaining: 60n,
      percent: 40,
      state: "safe",
    });
  });

  it("reports warning exactly at the default threshold", () => {
    expect(budgetStatus(80n, 100n)).toMatchObject({
      percent: 80,
      state: "warning",
    });
  });

  it("reports exceeded at and above the limit", () => {
    expect(budgetStatus(100n, 100n).state).toBe("exceeded");
    expect(budgetStatus(150n, 100n)).toMatchObject({
      remaining: -50n,
      percent: 150,
      state: "exceeded",
    });
  });

  it("supports a custom threshold and rounds percentages to one decimal", () => {
    expect(budgetStatus(85n, 100n, 90).state).toBe("safe");
    expect(budgetStatus(1n, 3n, 30)).toMatchObject({
      percent: 33.3,
      state: "warning",
    });
  });

  it("handles zero and negative limits", () => {
    expect(budgetStatus(0n, 0n)).toEqual({
      spent: 0n,
      limit: 0n,
      remaining: 0n,
      percent: 0,
      state: "safe",
    });
    expect(budgetStatus(25n, 0n)).toEqual({
      spent: 25n,
      limit: 0n,
      remaining: -25n,
      percent: 0,
      state: "exceeded",
    });
    expect(budgetStatus(0n, -10n).state).toBe("safe");
  });
});

describe("dailyAllowance", () => {
  it("splits remaining money evenly across days", () => {
    expect(dailyAllowance(100n, 4)).toBe(25n);
    expect(dailyAllowance(100n, 3)).toBe(33n);
  });

  it("returns the full remainder on the last day or past it", () => {
    expect(dailyAllowance(100n, 1)).toBe(100n);
    expect(dailyAllowance(100n, 0)).toBe(100n);
    expect(dailyAllowance(100n, -2)).toBe(100n);
  });

  it("never creates a positive allowance from a deficit", () => {
    expect(dailyAllowance(-5n, 0)).toBe(0n);
    expect(dailyAllowance(-5n, 3)).toBe(-1n);
  });
});
