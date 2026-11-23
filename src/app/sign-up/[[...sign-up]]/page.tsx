"use client";

import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth/auth-frame";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

export default function SignUpPage() {
  const locale = useClientLocale();

  return (
    <AuthFrame width="signUp">
      <Suspense
        fallback={
          <div className="flex min-h-[24rem] items-center justify-center text-sm text-muted-foreground">
            {t(locale, "auth.loadingApp")}
          </div>
        }
      >
        <SignUp />
      </Suspense>
    </AuthFrame>
  );
}
