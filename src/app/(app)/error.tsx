"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useClientLocale();
  useEffect(() => {
    console.error("[monmag] app error", error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg space-y-4 p-6 text-center">
      <div>
        <h2 className="text-lg font-semibold">{t(locale, "error.sectionTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(locale, "error.sectionDescription")}
        </p>
      </div>
      <Button onClick={() => reset()}>{t(locale, "error.tryAgain")}</Button>
    </Card>
  );
}
