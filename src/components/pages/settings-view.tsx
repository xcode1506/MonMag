"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";
import { Globe2, ShieldCheck } from "lucide-react";
import { SettingsForm } from "@/components/forms/entity-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { dateLocaleTag, LOCALE_NAMES, localeOf, t, type Locale } from "@/lib/i18n";

export function SettingsView({
  user,
  accounts,
  locale,
  timezone = "Asia/Jakarta",
}: {
  user: {
    fullName: string;
    email: string;
    preferredCurrency: string;
    preferredLanguage: string;
    timezone: string;
    dateFormat: string;
    firstDayOfWeek: number;
    defaultAccountId: string | null;
    theme: string;
  };
  accounts: Array<{ value: string; label: string }>;
  locale: Locale;
  timezone?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "settings.heading")}
        description={`${t(locale, "settings.subheading")} ${t(locale, "settings.subheadingExtra")}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t(locale, "settings.preferences")}</CardTitle>
            <CardDescription>{t(locale, "settings.preferencesHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm locale={locale} user={user} accounts={accounts} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4" aria-hidden="true" />
                {t(locale, "settings.security")}
              </CardTitle>
              <CardDescription>{t(locale, "settings.securityHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 ledger-panel border p-3">
                <UserButton
                  appearance={{ elements: { avatarBox: "size-9" } }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="size-4" aria-hidden="true" />
                {t(locale, "settings.regional")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{t(locale, "settings.language")}: {LOCALE_NAMES[localeOf(user.preferredLanguage)]}</p>
              <p>{t(locale, "settings.currency")}: {user.preferredCurrency}</p>
              <p>{t(locale, "settings.timezone")}: {timezone}</p>
              <p>{t(locale, "settings.dateFormat")}: {user.dateFormat}</p>
              <p>
                {t(locale, "settings.weekStarts")}: {user.firstDayOfWeek === 0 ? t(locale, "settings.sunday") : t(locale, "settings.monday")}
              </p>
              <p className="pt-2 text-xs">{t(locale, "settings.previewLocale")}: {dateLocaleTag(locale)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
