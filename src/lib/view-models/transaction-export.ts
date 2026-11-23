import { t, type Locale } from "@/lib/i18n";
import { formatMoney, fromMinorUnits } from "@/lib/money";

interface ExportRowSource {
  transactionDate: Date;
  title: string;
  type: string;
  amount: bigint;
  account: { name: string; currency: string } | null;
  category: { name: string } | null;
  paymentMethod: string | null;
  description: string | null;
}

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  // Prevent spreadsheet formula injection from user-entered titles and notes.
  if (/^\s*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function dateCell(value: Date): string {
  const day = value.getUTCDate().toString().padStart(2, "0");
  const month = (value.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}/${value.getUTCFullYear()}`;
}

/**
 * Build the ledger CSV. Each row's amount is scaled with that transaction's
 * account currency, never with the user's preferred currency.
 */
export function buildTransactionCsv(
  rows: readonly ExportRowSource[],
  locale: Locale = "en",
): string {
  const header = [
    t(locale, "common.date"),
    t(locale, "common.title"),
    t(locale, "common.type"),
    t(locale, "export.amountDecimal"),
    t(locale, "common.amount"),
    t(locale, "form.currency"),
    t(locale, "common.account"),
    t(locale, "common.category"),
    t(locale, "export.paymentMethod"),
    t(locale, "common.description"),
  ];
  const body = rows.map((tx) => {
    const currency = tx.account?.currency ?? "IDR";
    return [
      dateCell(tx.transactionDate),
      tx.title,
      tx.type,
      fromMinorUnits(tx.amount, currency),
      formatMoney(tx.amount, currency, "id-ID"),
      currency,
      tx.account?.name ?? "",
      tx.category?.name ?? "",
      tx.paymentMethod ?? "",
      tx.description ?? "",
    ];
  });

  return `\uFEFF${[header, ...body]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")}`;
}
