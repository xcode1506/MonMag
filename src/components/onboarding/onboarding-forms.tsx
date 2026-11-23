"use client";

import { useRouter } from "next/navigation";
import { saveProfileStepAction, finishOnboardingAction } from "@/app/(app)/actions";
import { ActionForm } from "@/components/forms/action-form";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { useClientLocale } from "@/lib/client-locale";
import { COMMON_TIMEZONES } from "@/lib/date";
import { LOCALES, LOCALE_NAMES, t, type Locale } from "@/lib/i18n";
import { CURRENCIES, CURRENCY_NAMES } from "@/lib/money";

export function ProfileStep({
  locale,
  fullName,
  currency,
  language,
  timezone,
}: {
  locale: Locale;
  fullName: string;
  currency: string;
  language: string;
  timezone: string;
}) {
  const router = useRouter();
  return (
    <ActionForm
      action={saveProfileStepAction}
      onSuccess={() => router.refresh()}
      submitLabel={t(locale, "form.continue")}
      pendingLabel={t(locale, "common.saving")}
    >
      {({ fieldErrors }) => (
        <>
          <FormField label={t(locale, "form.fullName")} name="fullName" error={fieldErrors.fullName}>
            <Input id="fullName" name="fullName" defaultValue={fullName} required autoComplete="name" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "settings.currency")} name="preferredCurrency" error={fieldErrors.preferredCurrency}>
              <Select id="preferredCurrency" name="preferredCurrency" defaultValue={currency}>
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>{CURRENCY_NAMES[code]}</option>
                ))}
              </Select>
            </FormField>
            <FormField label={t(locale, "settings.language")} name="preferredLanguage" error={fieldErrors.preferredLanguage}>
              <Select id="preferredLanguage" name="preferredLanguage" defaultValue={language}>
                {LOCALES.map((code) => (
                  <option key={code} value={code}>{LOCALE_NAMES[code]}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField
            label={t(locale, "settings.timezone")}
            name="timezone"
            error={fieldErrors.timezone}
            hint={t(locale, "onboarding.timezoneHint")}
          >
            <Select id="timezone" name="timezone" defaultValue={timezone}>
              {!COMMON_TIMEZONES.includes(timezone as (typeof COMMON_TIMEZONES)[number]) && (
                <option value={timezone}>{timezone}</option>
              )}
              {COMMON_TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>
              ))}
            </Select>
          </FormField>
        </>
      )}
    </ActionForm>
  );
}

export function AccountStep({ locale, currency }: { locale: Locale; currency: string }) {
  const router = useRouter();
  return (
    <ActionForm
      action={finishOnboardingAction}
      onSuccess={() => router.refresh()}
      submitLabel={t(locale, "form.finishSetup")}
      pendingLabel={t(locale, "form.creating")}
    >
      {({ fieldErrors }) => (
        <>
          <FormField
            label={t(locale, "common.name")}
            name="name"
            error={fieldErrors.name}
            hint={t(locale, "onboarding.accountNameHint")}
          >
            <Input id="name" name="name" placeholder={t(locale, "form.accountPlaceholder")} required />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "common.type")} name="type" error={fieldErrors.type}>
              <Select id="type" name="type" defaultValue="BANK">
                <option value="BANK">{t(locale, "form.bank")}</option>
                <option value="CASH">{t(locale, "form.cash")}</option>
                <option value="EWALLET">{t(locale, "form.eWallet")}</option>
                <option value="SAVINGS">{t(locale, "form.savings")}</option>
                <option value="CREDIT_CARD">{t(locale, "form.creditCard")}</option>
                <option value="OTHER">{t(locale, "form.other")}</option>
              </Select>
            </FormField>
            <FormField label={t(locale, "accounts.initialBalance")} name="initialBalance" error={fieldErrors.initialBalance}>
              <Input id="initialBalance" name="initialBalance" inputMode="decimal" defaultValue="0" />
            </FormField>
          </div>
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="color" value="#0F766E" />
        </>
      )}
    </ActionForm>
  );
}

export function SkipAccountButton() {
  const locale = useClientLocale();
  const router = useRouter();
  return (
    <Button variant="ghost" onClick={() => router.refresh()}>
      {t(locale, "form.back")}
    </Button>
  );
}
