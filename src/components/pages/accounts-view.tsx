"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { deleteAccountAction } from "@/app/(app)/actions";
import { AccountForm } from "@/components/forms/entity-forms";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { t, type Locale } from "@/lib/i18n";
import { toMinorUnits } from "@/lib/money";
import { label, money } from "@/lib/ui";

export interface AccountRow {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: string;
  initialBalance: string;
  creditLimit: string | null;
  color: string;
  icon: string;
  description: string | null;
  archived: boolean;
}

export function AccountsView({
  rows,
  currency,
  locale,
  total,
}: {
  rows: AccountRow[];
  currency: string;
  locale: Locale;
  total: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AccountRow | null>(null);
  const close = () => { setOpen(false); setEditing(null); };
  const saved = () => { close(); router.refresh(); };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "accounts.heading")}
        description={t(locale, "accounts.subheading")}
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus aria-hidden="true" />
            {t(locale, "accounts.new")}
          </Button>
        }
      />

      <Card className="bg-brand-soft/60">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">{t(locale, "accounts.totalBalance")}</p>
          <p className="numeric mt-1 text-3xl font-semibold">{money(total, currency, locale, currency)}</p>
        </CardContent>
      </Card>

      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((account) => (
            <Card key={account.id} className="relative overflow-hidden">
              <div className="h-1.5" style={{ background: account.color }} />
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{label(account.type, locale)}</p>
                  </div>
                  <Badge variant={account.archived ? "default" : "brand"}>
                    {t(locale, account.archived ? "common.archived" : "common.active")}
                  </Badge>
                </div>
                <p className="numeric text-2xl font-semibold">{money(account.balance, account.currency, locale, currency)}</p>
                {account.description ? <p className="text-sm text-muted-foreground">{account.description}</p> : null}
                <div className="flex justify-end gap-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(account); setOpen(true); }}>{t(locale, "action.edit")}</Button>
                  <ConfirmActionButton
                    action={deleteAccountAction}
                    id={account.id}
                    label={t(locale, "action.delete")}
                    locale={locale}
                    title={t(locale, "confirm.deleteAccount")}
                    description={t(locale, "confirm.detailAccount")}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t(locale, "accounts.empty")}
          description={t(locale, "accounts.emptyHint")}
          icon={Plus}
          action={<Button onClick={() => setOpen(true)}>{t(locale, "accounts.new")}</Button>}
        />
      )}

      <Modal
        open={open}
        onOpenChange={(next) => (next ? null : close())}
        title={t(locale, editing ? "accounts.editTitle" : "accounts.addTitle")}
        description={t(locale, "accounts.modalHint")}
      >
        <AccountForm
          locale={locale}
          onSuccess={saved}
          accounts={rows.map((account) => ({ value: account.id, label: account.name }))}
          item={editing ? {
            id: editing.id,
            name: editing.name,
            type: editing.type,
            currency: editing.currency,
            initialBalance: toMinorUnits(editing.initialBalance, editing.currency),
            color: editing.color,
            icon: editing.icon,
            description: editing.description,
            creditLimit: editing.creditLimit
              ? toMinorUnits(editing.creditLimit, editing.currency)
              : null,
            archived: editing.archived,
          } : undefined}
        />
      </Modal>
    </div>
  );
}
