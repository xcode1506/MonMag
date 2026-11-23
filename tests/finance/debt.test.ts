import { describe, expect, it } from "vitest";
import { estimatePayoff, requiredMonthlyPayment } from "@/lib/finance/debt";

describe("estimatePayoff", () => {
  it("marks an already cleared debt as paid off immediately", () => {
    expect(estimatePayoff(0n, 12, 100n)).toEqual({
      months: 0,
      totalInterest: 0n,
      totalPaid: 0n,
      paidOff: true,
    });
    expect(estimatePayoff(-10n, 12, 100n).paidOff).toBe(true);
  });

  it("cannot repay with a zero or negative monthly payment", () => {
    expect(estimatePayoff(1_000n, 12, 0n)).toEqual({
      months: 600,
      totalInterest: 0n,
      totalPaid: 0n,
      paidOff: false,
    });
    expect(estimatePayoff(1_000n, 12, -5n, 12).months).toBe(12);
  });

  it("repays a zero-interest debt in whole payments", () => {
    expect(estimatePayoff(1_000n, null, 250n)).toEqual({
      months: 4,
      totalInterest: 0n,
      totalPaid: 1_000n,
      paidOff: true,
    });
  });

  it("amortizes monthly interest and caps the final payment", () => {
    expect(estimatePayoff(1_000n, 12, 300n)).toEqual({
      months: 4,
      totalInterest: 22n,
      totalPaid: 1_022n,
      paidOff: true,
    });
  });

  it("stops when the payment does not cover the interest", () => {
    expect(estimatePayoff(1_000n, 1200, 50n)).toEqual({
      months: 0,
      totalInterest: 0n,
      totalPaid: 0n,
      paidOff: false,
    });
  });

  it("respects the month cap when progress is too slow", () => {
    expect(estimatePayoff(10_000n, 12, 101n, 2)).toEqual({
      months: 2,
      totalInterest: 199n,
      totalPaid: 202n,
      paidOff: false,
    });
  });

  it("treats missing or negative rates as zero", () => {
    expect(estimatePayoff(100n, undefined, 100n).paidOff).toBe(true);
    expect(estimatePayoff(100n, -5, 100n).totalInterest).toBe(0n);
  });
});

describe("requiredMonthlyPayment", () => {
  it("returns the full balance when there are no months remaining", () => {
    expect(requiredMonthlyPayment(1_000n, 12, 0)).toBe(1_000n);
    expect(requiredMonthlyPayment(1_000n, 12, -3)).toBe(1_000n);
  });

  it("splits a zero-interest balance with ceiling division", () => {
    expect(requiredMonthlyPayment(1_000n, null, 3)).toBe(334n);
    expect(requiredMonthlyPayment(1_000n, -5, 3)).toBe(334n);
  });

  it("uses the amortization formula when interest applies", () => {
    expect(requiredMonthlyPayment(1_000n, 12, 12)).toBe(89n);
  });
});
