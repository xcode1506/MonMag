"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useClientLocale } from "@/lib/client-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  className,
}: ModalProps) {
  const locale = useClientLocale();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
          <Dialog.Overlay className="dialog-overlay pointer-events-auto fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
          <Dialog.Content
            className={cn(
              "dialog-panel inset-control pointer-events-auto relative z-50 max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-[var(--radius-card)] border bg-card p-6 text-card-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              className,
            )}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Dialog.Title className="text-lg font-semibold tracking-tight">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close
                aria-label={t(locale, "aria.closeDialog")}
                className="rounded-[var(--radius-button)] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
