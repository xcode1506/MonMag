"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useClientLocale();
  useEffect(() => {
    console.error("[monmag] page error", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <Card className="max-w-md space-y-4 p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">{t(locale, "error.unexpectedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(locale, "error.unexpectedDescription")}
          </p>
        </div>
        <Button onClick={reset}>{t(locale, "error.tryAgain")}</Button>
      </Card>
    </main>
  );
}
