"use client";

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";
import { t, type Locale } from "@/lib/i18n";
import { Button, type ButtonProps } from "@/components/ui/button";

type ServerFormAction = (formData: FormData) => Promise<ActionResult>;

interface ConfirmActionButtonProps {
  action: ServerFormAction;
  id?: string;
  idKey?: string;
  label: string;
  locale: Locale;
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function ConfirmActionButton({
  action,
  id,
  idKey = "id",
  label,
  locale,
  title = t(locale, "confirm.title"),
  description = t(locale, "confirm.description"),
  confirmLabel = t(locale, "action.delete"),
  variant = "destructive",
  size = "sm",
}: ConfirmActionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function onConfirm() {
    const formData = new FormData();
    if (id) formData.set(idKey, id);
    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) {
        toast.success(result.message ?? t(locale, "confirm.deleted"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <Button type="button" variant={variant} size={size} disabled={pending}>
          {label}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
          <AlertDialog.Overlay className="dialog-overlay pointer-events-auto fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
          <AlertDialog.Content className="dialog-panel inset-control pointer-events-auto relative z-50 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[var(--radius-card)] border bg-card p-6 text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={pending}>
                  {t(locale, "action.cancel")}
                </Button>
              </AlertDialog.Cancel>
              <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
                {pending ? t(locale, "common.working") : confirmLabel}
              </Button>
            </div>
          </AlertDialog.Content>
        </div>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
