import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/money";
import { buildTransactionCsv } from "@/lib/view-models/transaction-export";

describe("transaction CSV export", () => {
  const transaction = {
    transactionDate: new Date("2026-02-01T00:00:00.000Z"),
    title: "Coffee",
    type: "EXPENSE",
    amount: 1234n,
    account: { name: "USD Wallet", currency: "USD" },
    category: { name: "Food" },
    paymentMethod: "CARD",
    description: "Morning coffee",
  };

  it("formats each amount using that transaction's account currency", () => {
    const csv = buildTransactionCsv([transaction]);

    expect(csv).toContain('"Amount (decimal)"');
    expect(csv).not.toContain("Amount (minor units)");
    expect(csv).toContain('"12.34"');
    expect(csv).toContain(`"${formatMoney(1234n, "USD", "id-ID")}"`);
    expect(csv).toContain('"USD"');
    expect(csv).not.toContain("Rp");
  });

  it("localizes CSV headers using the requested locale", () => {
    const indonesian = buildTransactionCsv([transaction], "id");
    expect(indonesian).toContain('"Tanggal"');
    expect(indonesian).toContain('"Jumlah (desimal)"');
    expect(indonesian).toContain('"Metode pembayaran"');
    expect(indonesian).not.toContain('"Amount (decimal)"');

    const japanese = buildTransactionCsv([transaction], "ja");
    expect(japanese).toContain('"日付"');
    expect(japanese).toContain('"金額（10進数）"');
    expect(japanese).toContain('"支払い方法"');
  });

  it("neutralizes spreadsheet formulas hidden behind leading whitespace", () => {
    const csv = buildTransactionCsv([
      { ...transaction, title: " =SUM(1+1)" },
    ]);

    expect(csv).toContain(`"' =SUM(1+1)"`);
  });

  it("keeps IDR rows on the zero-decimal scale", () => {
    const csv = buildTransactionCsv([
      {
        ...transaction,
        amount: 1234n,
        account: { name: "Cash", currency: "IDR" },
      },
    ]);

    expect(csv).toContain('"1234"');
    expect(csv).toContain(`"${formatMoney(1234n, "IDR", "id-ID")}"`);
    expect(csv).toContain('"IDR"');
  });
});
