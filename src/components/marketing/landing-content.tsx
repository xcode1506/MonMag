"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  CalendarRange,
  Globe2,
  HandCoins,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

const FEATURES = [
  { icon: ArrowLeftRight, title: "landing.feature1Title", text: "landing.feature1Text" },
  { icon: Wallet, title: "landing.feature2Title", text: "landing.feature2Text" },
  { icon: HandCoins, title: "landing.feature3Title", text: "landing.feature3Text" },
  { icon: PiggyBank, title: "landing.feature4Title", text: "landing.feature4Text" },
  { icon: CalendarRange, title: "landing.feature5Title", text: "landing.feature5Text" },
  { icon: BarChart3, title: "landing.feature6Title", text: "landing.feature6Text" },
] as const;

const GLOBAL_FACTS = [
  { icon: Globe2, label: "landing.factLanguages" },
  { icon: Landmark, label: "landing.factCurrencies" },
  { icon: CalendarRange, label: "landing.factTimezone" },
] as const;

const HERO_TAGS = [
  { rotate: "-12", label: "landing.feature2Title", color: "--candy-coral" },
  { rotate: "-9", label: "landing.feature4Title", color: "--candy-lime" },
  { rotate: "-6", label: "landing.feature1Title", color: "--candy-sunflower" },
  { rotate: "6", label: "landing.feature6Title", color: "--candy-violet" },
  { rotate: "9", label: "landing.feature3Title", color: "--candy-tangerine" },
  { rotate: "12", label: "landing.feature5Title", color: "--candy-pink" },
] as const;

export function LandingContent() {
  const locale = useClientLocale();

  return (
    <div className="landing-page">
      <header className="landing-masthead relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="system-seal" aria-hidden="true">
            MM
          </span>
          <span>
            <span className="block font-display text-xl font-semibold leading-none tracking-[-0.02em]">
              MonMag
            </span>
            <span className="mt-1 block text-[0.625rem] font-normal uppercase tracking-[0.04em] text-mist">
              {t(locale, "app.name")} / PRIVATE FINANCE
            </span>
          </span>
        </Link>
        <nav
          aria-label={t(locale, "landing.accountNavAria")}
          className="flex items-center gap-2 sm:gap-3"
        >
          <ThemeToggle />
          <Button asChild variant="ghost" className="min-h-11">
            <Link href="/sign-in">{t(locale, "landing.navSignIn")}</Link>
          </Button>
        </nav>
      </header>
      <div className="console-rule" aria-hidden="true" />

      <section
        className="hero-grid relative z-10 mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 lg:py-24"
        aria-labelledby="hero-title"
      >
        <div className="max-w-2xl space-y-6">
          <p className="hero-eyebrow">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {t(locale, "landing.privateChip")}
          </p>

          <h1 id="hero-title" className="hero-display">
            {t(locale, "landing.heroTitleBefore")}{" "}
            <span className="hero-display-accent">{t(locale, "landing.heroTitleAccent")}</span>
          </h1>

          <p className="hero-lead max-w-xl">
            {t(locale, "landing.heroLead")}
          </p>

          <ul className="flex flex-wrap gap-2" aria-label={t(locale, "landing.globalAria")}>
            {GLOBAL_FACTS.map((fact) => (
              <li
                key={fact.label}
                className="inline-flex items-center gap-2 rounded-[var(--radius-tag)] border border-border bg-indigo-surface px-3 py-1.5 text-xs font-normal text-fog"
              >
                <fact.icon className="size-3.5 text-brand-accent" aria-hidden="true" />
                {t(locale, fact.label)}
              </li>
            ))}
          </ul>

          <p className="max-w-xl border-l-2 border-brand/60 pl-4 text-xs leading-relaxed text-fog">
            {t(locale, "landing.displayNote")}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" className="min-h-11">
              <Link href="/sign-up">
                {t(locale, "landing.ctaStart")}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-11">
              <Link href="/sign-in">{t(locale, "landing.navSignIn")}</Link>
            </Button>
          </div>

          <p className="text-xs text-mist">{t(locale, "landing.dataScoped")}</p>
        </div>

        <div className="hero-preview">
          <div className="hero-tag-cloud" aria-hidden="true">
            {HERO_TAGS.map((tag) => (
              <span
                key={tag.rotate}
                className="hero-tag"
                data-rotate={tag.rotate}
                style={{ background: `var(${tag.color})` }}
              >
                {t(locale, tag.label)}
              </span>
            ))}
          </div>

          <div
            className="console-preview-panel"
            role="img"
            aria-label={t(locale, "landing.previewAria")}
          >
            <div className="vault-panel border border-border p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
                <span className="figure-index">MM / 01</span>
                <span className="text-[0.625rem] font-normal uppercase tracking-[0.04em] text-mist">
                  {t(locale, "landing.overview")}
                </span>
                <span className="system-seal" aria-hidden="true">
                  MM
                </span>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-normal uppercase tracking-[0.04em] text-mist">
                    {t(locale, "landing.totalBalance")}
                  </p>
                  <p className="numeric mt-1 font-display text-3xl tracking-[-0.02em] sm:text-4xl">
                    $24,860.50
                  </p>
                </div>
                <span className="rounded-[var(--radius-tag)] bg-indigo-surface px-3 py-1 text-xs font-normal text-candy-sky">
                  {t(locale, "landing.thisMonth")}
                </span>
              </div>

              <dl className="mt-5 divide-y divide-border border-y border-border">
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-xs font-normal text-fog">{t(locale, "transactions.income")}</dt>
                  <dd className="numeric text-sm font-semibold text-positive">$6,420.00</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-xs font-normal text-fog">{t(locale, "landing.expenses")}</dt>
                  <dd className="numeric text-sm font-semibold text-negative">$3,180.25</dd>
                </div>
              </dl>

              <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-background/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{t(locale, "landing.monthlyBudget")}</span>
                  <span className="numeric text-fog">68%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-[var(--radius-tag)] bg-muted" aria-hidden="true">
                  <div className="h-full w-[68%] rounded-[var(--radius-tag)] bg-brand" />
                </div>
                <p className="numeric mt-2 text-[0.7rem] text-fog">
                  {t(locale, "landing.leftThisMonth")}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-mist">
            {t(locale, "landing.sampleData")} {t(locale, "landing.previewDisclaimer")}
          </p>
        </div>
      </section>

      <section
        className="midnight-band-alt relative z-10 border-t border-border"
        aria-labelledby="features-title"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow">{t(locale, "landing.workspaceEyebrow")}</p>
            <h2 id="features-title" className="section-title mt-3">
              {t(locale, "landing.featuresTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-fog sm:text-base">
              {t(locale, "landing.featuresLead")}
            </p>
          </div>

          <div className="feature-grid">
            {FEATURES.map((feature, index) => (
              <article key={feature.title} className="feature-card vault-panel">
                <div className="flex items-start justify-between gap-3">
                  <span className="feature-glyph">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="figure-index">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-4 font-display text-lg">{t(locale, feature.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fog">
                  {t(locale, feature.text)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="midnight-band relative z-10" aria-labelledby="cta-title">
        <div className="mx-auto w-full max-w-6xl px-5 pb-14 sm:px-8 sm:pb-20">
          <div className="console-cta-band">
            <div>
              <p className="eyebrow">{t(locale, "app.name")}</p>
              <h2 id="cta-title" className="section-title mt-3">
                {t(locale, "landing.ctaTitle")}
              </h2>
              <p className="muted-on-band mt-2 max-w-xl text-sm leading-relaxed">
                {t(locale, "landing.ctaText")}
              </p>
            </div>
            <Button asChild size="lg" variant="outline" className="button-on-band min-h-11 shrink-0">
              <Link href="/sign-up">
                {t(locale, "landing.ctaStart")}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-6 text-xs text-fog sm:px-8">
          <p>{t(locale, "landing.footer")}</p>
          <p className="hidden font-display text-sm text-foreground sm:block">MonMag</p>
        </div>
      </footer>
    </div>
  );
}
