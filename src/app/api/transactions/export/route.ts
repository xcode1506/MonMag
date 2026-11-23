import { route } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/date";
import { localeOf } from "@/lib/i18n";
import {
  getTransactionsForExport,
  MAX_EXPORT_ROWS,
} from "@/lib/services/transactions";
import { buildTransactionCsv } from "@/lib/view-models/transaction-export";

export const GET = route(async (request: Request) => {
  const user = await requireApiUser();
  const url = new URL(request.url);
  const from = parseDateInput(url.searchParams.get("from") ?? "") ?? undefined;
  const to = parseDateInput(url.searchParams.get("to") ?? "") ?? undefined;
  const transactions = await getTransactionsForExport(
    user.id,
    from,
    to,
    MAX_EXPORT_ROWS,
  );

  return new Response(
    buildTransactionCsv(transactions, localeOf(user.preferredLanguage)),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="monmag-transactions.csv"',
        "Cache-Control": "no-store",
      },
    },
  );
});
