"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

export default function NotFound() {
  const locale = useClientLocale();
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <Card className="max-w-md space-y-4 p-6 text-center">
        <div>
          <p className="text-sm font-medium text-brand">404</p>
          <h1 className="mt-1 text-xl font-semibold">{t(locale, "error.notFoundTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(locale, "error.notFoundDescription")}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">{t(locale, "error.goDashboard")}</Link>
        </Button>
      </Card>
    </main>
  );
}
