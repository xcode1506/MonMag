"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Download, Pencil, Plus, Search, Tag } from "lucide-react";
import { deleteCategoryAction, deleteTransactionAction } from "@/app/(app)/actions";
import {
  CategoryForm,
  TransactionForm,
  TransferForm,
  type Option,
} from "@/components/forms/entity-forms";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/date";
import { t, type Locale } from "@/lib/i18n";
import { parseMoneyInput } from "@/lib/money";
import { label, money, tone } from "@/lib/ui";

export interface TransactionRow {
  id: string;
  title: string;
  type: string;
  amount: string;
  accountCurrency: string;
  accountId: string;
  accountName: string;
  categoryName: string | null;
  transactionDate: string;
  paymentMethod: string | null;
  description: string | null;
}

type AccountOption = Option & { currency: string };

interface Props {
  rows: TransactionRow[];
  total: number;
  accounts: AccountOption[];
  categories: Option[];
  categoriesWithType: Array<Option & { type: string; isDefault: boolean; color: string }>;
  currency: string;
  locale: Locale;
  timezone?: string;
  today: string;
  exportHref: string;
  filters: { search: string; type: string; accountId: string; categoryId: string; from: string; to: string };
  autoOpen: boolean;
}

export function TransactionsView({
  rows,
  total,
  accounts,
  categories,
  categoriesWithType,
  currency,
  locale,
  today,
  timezone = "Asia/Jakarta",
  exportHref,
  filters,
  autoOpen,
}: Props) {
  const router = useRouter();
  const [form, setForm] = React.useState<"transaction" | "transfer" | "category" | null>(
    autoOpen ? "transaction" : null,
  );
  const [editing, setEditing] = React.useState<TransactionRow | null>(null);

  function close() {
    setForm(null);
    setEditing(null);
    if (autoOpen) router.replace("/transactions");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "transactions.heading")}
        description={t(locale, "transactions.subheading")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={exportHref}>
                <Download aria-hidden="true" />
                {t(locale, "action.exportCsv")}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setForm("transfer")}>
              <ArrowLeftRight aria-hidden="true" />
              {t(locale, "transactions.transfer")}
            </Button>
            <Button variant="outline" onClick={() => setForm("category")}>
              <Tag aria-hidden="true" />
              {t(locale, "common.category")}
            </Button>
            <Button onClick={() => { setEditing(null); setForm("transaction"); }}>
              <Plus aria-hidden="true" />
              {t(locale, "transactions.new")}
            </Button>
          </>
        }
      />

      <form method="get" action="/transactions" className="grid gap-3 ledger-panel border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
          <Input name="search" defaultValue={filters.search} placeholder={t(locale, "transactions.searchPlaceholder")} className="pl-9" />
        </div>
        <Select name="type" defaultValue={filters.type} aria-label={t(locale, "common.type")}>
          <option value="">{t(locale, "transactions.allTypes")}</option>
          <option value="INCOME">{t(locale, "transactions.income")}</option>
          <option value="EXPENSE">{t(locale, "transactions.expense")}</option>
        </Select>
        <Select name="accountId" defaultValue={filters.accountId} aria-label={t(locale, "common.account")}>
          <option value="">{t(locale, "transactions.allAccounts")}</option>
          {accounts.map((account) => <option key={account.value} value={account.value}>{account.label}</option>)}
        </Select>
        <Select name="categoryId" defaultValue={filters.categoryId} aria-label={t(locale, "common.category")}>
          <option value="">{t(locale, "transactions.allCategories")}</option>
          {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
        </Select>
        <Button type="submit" variant="secondary">{t(locale, "action.apply")}</Button>
        <Input name="from" defaultValue={filters.from} placeholder={t(locale, "transactions.fromPlaceholder")} aria-label={t(locale, "transactions.fromDate")} />
        <Input name="to" defaultValue={filters.to} placeholder={t(locale, "transactions.toPlaceholder")} aria-label={t(locale, "transactions.toDate")} />
      </form>

      {rows.length ? (
        <>
          <div className="transaction-table-shell hidden sm:block">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t(locale, "common.date")}</th>
                  <th scope="col">{t(locale, "common.title")}</th>
                  <th scope="col">{t(locale, "common.category")}</th>
                  <th scope="col">{t(locale, "common.account")}</th>
                  <th scope="col">{t(locale, "common.type")}</th>
                  <th scope="col" className="text-right">{t(locale, "common.amount")}</th>
                  <th scope="col"><span className="sr-only">{t(locale, "common.actions")}</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="numeric text-muted-foreground">{formatDate(row.transactionDate, locale, timezone)}</td>
                    <td>
                      <p className="font-medium">{row.title}</p>
                      {row.paymentMethod ? <p className="text-xs text-muted-foreground">{row.paymentMethod}</p> : null}
                    </td>
                    <td>{row.categoryName ?? <span className="text-muted-foreground">{t(locale, "common.notProvided")}</span>}</td>
                    <td>{row.accountName}</td>
                    <td><Badge variant={tone(row.type)}>{label(row.type, locale)}</Badge></td>
                    <td className={`numeric text-right font-medium ${row.type === "INCOME" ? "text-positive" : ""}`}>
                      {row.type === "INCOME" ? "+" : "−"}{money(row.amount, row.accountCurrency, locale, currency)}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t(locale, "action.editItem", { name: row.title })}
                          onClick={() => { setEditing(row); setForm("transaction"); }}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <ConfirmActionButton
                          action={deleteTransactionAction}
                          id={row.id}
                          label={t(locale, "action.delete")}
                          locale={locale}
                          title={t(locale, "transactions.deleteConfirm")}
                          description={t(locale, "confirm.detailTransaction")}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="transaction-card-list space-y-3 sm:hidden">
            {rows.map((row) => (
              <article key={row.id} className="ledger-panel border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={tone(row.type)}>{label(row.type, locale)}</Badge>
                      <span className="numeric text-xs text-muted-foreground">
                        {formatDate(row.transactionDate, locale, timezone)}
                      </span>
                    </div>
                    <p className="mt-2 truncate font-medium">{row.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {row.categoryName ?? t(locale, "common.notProvided")} · {row.accountName}
                    </p>
                  </div>
                  <p className={`numeric shrink-0 font-display text-lg font-medium ${
                    row.type === "INCOME" ? "text-positive" : ""
                  }`}>
                    {row.type === "INCOME" ? "+" : "−"}{money(row.amount, row.accountCurrency, locale, currency)}
                  </p>
                </div>
                <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={t(locale, "action.editItem", { name: row.title })}
                    onClick={() => { setEditing(row); setForm("transaction"); }}
                  >
                    <Pencil aria-hidden="true" />
                    {t(locale, "action.edit")}
                  </Button>
                  <ConfirmActionButton
                    action={deleteTransactionAction}
                    id={row.id}
                    label={t(locale, "action.delete")}
                    locale={locale}
                    title={t(locale, "transactions.deleteConfirm")}
                    description={t(locale, "confirm.detailTransaction")}
                  />
                </div>
              </article>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            {t(locale, "transactions.count", { shown: rows.length, total })}
          </p>
        </>
      ) : (
        <EmptyState
          title={t(locale, "transactions.empty")}
          description={t(locale, "transactions.emptyHint")}
          icon={Search}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => { setEditing(null); setForm("transaction"); }}>
                {t(locale, "transactions.new")}
              </Button>
              {Object.values(filters).some(Boolean) ? (
                <Button asChild variant="outline">
                  <Link href="/transactions">{t(locale, "action.clearFilters")}</Link>
                </Button>
              ) : null}
            </div>
          }
        />
      )}

      {categoriesWithType.length ? (
        <div className="ledger-panel border bg-card p-5">
          <h2 className="mb-3 font-semibold">{t(locale, "transactions.categories")}</h2>
          <div className="flex flex-wrap gap-2">
            {categoriesWithType.map((category) => (
              <span key={category.value} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                <span className="size-2 rounded-full" style={{ background: category.color }} />
                {category.label}
                <span className="text-muted-foreground">({label(category.type, locale)})</span>
                {!category.isDefault ? (
                  <ConfirmActionButton
                    action={deleteCategoryAction}
                    id={category.value}
                    label={t(locale, "action.delete")}
                    locale={locale}
                    title={t(locale, "confirm.deleteCategory")}
                    description={t(locale, "confirm.detailCategory")}
                    variant="ghost"
                  />
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <Modal
        open={form === "transaction"}
        onOpenChange={(open) => (open ? null : close())}
        title={t(locale, editing ? "transactions.editTitle" : "transactions.newTitle")}
        description={t(locale, "transactions.modalHint")}
      >
        <TransactionForm
          locale={locale}
          onSuccess={close}
          accounts={accounts}
          categories={categories}
          currency={editing?.accountCurrency ?? currency}
          today={today}
          item={editing ? {
            id: editing.id,
            title: editing.title,
            type: editing.type,
            amount: parseMoneyInput(editing.amount, editing.accountCurrency),
            accountId: editing.accountId,
            categoryId: categories.find((category) => category.label === editing.categoryName)?.value ?? null,
            transactionDate: editing.transactionDate,
            paymentMethod: editing.paymentMethod,
            description: editing.description,
          } : undefined}
        />
      </Modal>

      <Modal
        open={form === "transfer"}
        onOpenChange={(open) => (open ? null : close())}
        title={t(locale, "transactions.transferTitle")}
        description={t(locale, "transactions.transferHint")}
      >
        <TransferForm locale={locale} onSuccess={close} accounts={accounts} currency={currency} today={today} />
      </Modal>

      <Modal
        open={form === "category"}
        onOpenChange={(open) => (open ? null : close())}
        title={t(locale, "transactions.categoryTitle")}
        description={t(locale, "transactions.categoryHint")}
      >
        <CategoryForm locale={locale} onSuccess={close} />
      </Modal>
    </div>
  );
}
