export interface PayoffEstimate {
  months: number;
  totalInterest: bigint;
  totalPaid: bigint;
  paidOff: boolean;
}

/** Amortized payoff projection. Interest is a rate, not money; balances stay BigInt. */
export function estimatePayoff(
  outstanding: bigint,
  annualRatePercent: number | null | undefined,
  monthlyPayment: bigint,
  maxMonths = 600,
): PayoffEstimate {
  if (outstanding <= 0n) {
    return { months: 0, totalInterest: 0n, totalPaid: 0n, paidOff: true };
  }
  if (monthlyPayment <= 0n) {
    return { months: maxMonths, totalInterest: 0n, totalPaid: 0n, paidOff: false };
  }
  const rate = Math.max(0, annualRatePercent ?? 0) / 100 / 12;
  let balance = outstanding;
  let interestPaid = 0n;
  let principalPaid = 0n;
  let months = 0;

  while (balance > 0n && months < maxMonths) {
    const interest = rate > 0 ? BigInt(Math.floor(Number(balance) * rate)) : 0n;
    const payment = monthlyPayment > balance + interest ? balance + interest : monthlyPayment;
    const principal = payment - interest;
    if (principal <= 0n) break; // payment does not cover interest
    balance -= principal;
    interestPaid += interest;
    principalPaid += principal;
    months += 1;
  }

  return {
    months,
    totalInterest: interestPaid,
    totalPaid: principalPaid + interestPaid,
    paidOff: balance <= 0n,
  };
}

/** Minimum payment needed to clear a balance within a target number of months. */
export function requiredMonthlyPayment(
  outstanding: bigint,
  annualRatePercent: number | null | undefined,
  months: number,
): bigint {
  if (months <= 0) return outstanding;
  const rate = Math.max(0, annualRatePercent ?? 0) / 100 / 12;
  if (rate === 0) {
    return (outstanding + BigInt(months) - 1n) / BigInt(months);
  }
  const factor = Math.pow(1 + rate, months);
  return BigInt(Math.ceil((Number(outstanding) * rate * factor) / (factor - 1)));
}
