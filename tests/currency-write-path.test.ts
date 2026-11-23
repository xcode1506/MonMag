import { describe, expect, it } from "vitest";
import { sumMoneyValues } from "@/lib/money";
import { amountInput } from "@/lib/ui";
import {
  budgetSchemaFor,
  debtSchemaFor,
  transactionSchemaFor,
} from "@/lib/validation";
import { toTransactionRow } from "@/lib/view-models/transactions";

describe("currency-aware write path", () => {
  it("parses transaction amounts with the account's currency scale", () => {
    const parsed = transactionSchemaFor("USD").parse({
      title: "Coffee",
      type: "EXPENSE",
      amount: "12.34",
      accountId: "account-1",
      transactionDate: "02/01/2026",
    });

    expect(parsed.amount).toBe(1234n);
  });

  it("keeps bigint amounts as minor units regardless of currency", () => {
    const parsed = transactionSchemaFor("USD").parse({
      title: "Coffee",
      type: "EXPENSE",
      amount: 1234n,
      accountId: "account-1",
      transactionDate: "02/01/2026",
    });

    expect(parsed.amount).toBe(1234n);
  });

  it("parses budget and debt amounts with the user's preferred currency", () => {
    const budget = budgetSchemaFor("USD").parse({
      name: "Food",
      amount: "250.50",
      startDate: "01/01/2026",
    });
    const debt = debtSchemaFor("USD").parse({
      name: "Mortgage",
      originalAmount: "1,234.50",
      outstandingBalance: "1,000.25",
      monthlyPayment: "250.50",
      startDate: "01/01/2026",
    });

    expect(budget.amount).toBe(25050n);
    expect(debt.originalAmount).toBe(123450n);
    expect(debt.outstandingBalance).toBe(100025n);
    expect(debt.monthlyPayment).toBe(25050n);
  });
});

describe("transaction row view model", () => {
  it("keeps the account currency alongside the form amount string", () => {
    const row = toTransactionRow({
      id: "transaction-1",
      title: "Coffee",
      type: "EXPENSE",
      amount: 12345n,
      accountId: "account-1",
      account: { name: "EUR Wallet", currency: "EUR" },
      category: { name: "Food" },
      transactionDate: new Date("2026-01-02T00:00:00.000Z"),
      paymentMethod: null,
      description: null,
    });

    expect(row).toMatchObject({
      amount: "123.45",
      accountCurrency: "EUR",
      accountName: "EUR Wallet",
      categoryName: "Food",
    });
  });
});

describe("exact money totals", () => {
  it("sums decimal strings as integer minor units without float drift", () => {
    const total = sumMoneyValues(
      ["9007199254740993.01", "0.02"],
      "USD",
    );

    expect(total).toBe(900719925474099303n);
    expect(amountInput(total, "USD")).toBe("9007199254740993.03");
  });
});
