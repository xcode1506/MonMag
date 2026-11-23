import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative";
}

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "numeric truncate font-display text-3xl font-medium tracking-tight",
              tone === "positive" && "text-positive",
              tone === "negative" && "text-negative",
            )}
          >
            {value}
          </p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="rounded-[var(--radius-button)] bg-muted p-2 text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}
