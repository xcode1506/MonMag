"use client";

import * as React from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";
import { useActionForm } from "./use-action-form";

type FormAction = (formData: FormData) => Promise<ActionResult>;

interface ActionFormProps {
  action: FormAction;
  children:
    | React.ReactNode
    | ((context: { pending: boolean; fieldErrors: Record<string, string[]> }) => React.ReactNode);
  onSuccess?: () => void;
  className?: string;
  submitLabel?: string;
  /** Overrides the submit button's accessible name for repeated row actions. */
  submitAriaLabel?: string;
  pendingLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
}

/** Client form shell that wires a Server Action to React 19 form state and toasts. */
export function ActionForm({
  action,
  children,
  onSuccess,
  className,
  submitLabel,
  submitAriaLabel,
  pendingLabel,
  onCancel,
  cancelLabel,
}: ActionFormProps) {
  const locale = useClientLocale();
  const resolvedSubmitLabel = submitLabel ?? t(locale, "action.save");
  const resolvedPendingLabel = pendingLabel ?? t(locale, "common.saving");
  const resolvedCancelLabel = cancelLabel ?? t(locale, "action.cancel");
  const { formAction, pending, fieldErrors } = useActionForm(action, { onSuccess });

  return (
    <form action={formAction} className={className ?? "space-y-4"} noValidate>
      {typeof children === "function" ? children({ pending, fieldErrors }) : children}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {resolvedCancelLabel}
          </Button>
        ) : null}
        <SubmitButton pendingLabel={resolvedPendingLabel} aria-label={submitAriaLabel}>
          {resolvedSubmitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
