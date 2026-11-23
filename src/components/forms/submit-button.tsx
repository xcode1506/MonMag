"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";

interface SubmitButtonProps extends ButtonProps {
  children: React.ReactNode;
  pendingLabel?: string;
}

export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: SubmitButtonProps) {
  const locale = useClientLocale();
  const { pending } = useFormStatus();
  const resolvedPendingLabel = pendingLabel ?? t(locale, "common.saving");
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? resolvedPendingLabel : children}
    </Button>
  );
}
