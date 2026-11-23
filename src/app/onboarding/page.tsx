import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { AccountStep, ProfileStep } from "@/components/onboarding/onboarding-forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { localeOf, t } from "@/lib/i18n";

async function OnboardingContent() {
  const user = await requireUser();
  if (user.onboardingCompleted) redirect("/dashboard");

  const step = user.onboardingStep >= 1 ? 2 : 1;
  const locale = localeOf(user.preferredLanguage);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-[var(--radius-button)] bg-brand text-brand-foreground">
              <ChartNoAxesCombined className="size-5" aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold tracking-tight">MonMag</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-out">{t(locale, "form.signOut")}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2" aria-label={t(locale, "aria.stepOf", { step, total: 2 })}>
          {[1, 2].map((value) => (
            <div
              key={value}
              className={`h-1.5 flex-1 rounded-full ${value <= step ? "bg-brand" : "bg-muted"}`}
            />
          ))}
        </div>

        <Card className="p-6 sm:p-8">
          <div className="mb-6 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              {t(locale, "aria.stepOf", { step, total: 2 })}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {step === 1
                ? t(locale, "onboarding.personalizeTitle")
                : t(locale, "onboarding.accountTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? t(locale, "onboarding.personalizeDescription")
                : t(locale, "onboarding.accountDescription")}
            </p>
          </div>

          {step === 1 ? (
            <ProfileStep
              locale={locale}
              fullName={user.fullName}
              currency={user.preferredCurrency}
              language={user.preferredLanguage}
              timezone={user.timezone}
            />
          ) : (
            <AccountStep locale={locale} currency={user.preferredCurrency} />
          )}
        </Card>

        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {t(locale, "onboarding.privacy")}
        </p>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center px-4">
          <Card className="h-96 w-full max-w-xl animate-pulse bg-muted/40" />
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
