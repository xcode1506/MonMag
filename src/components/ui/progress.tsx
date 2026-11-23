import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
  label?: string;
}

export function Progress({ value, className, indicatorClassName, label }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("progress-indicator h-full rounded-full bg-brand transition-[width] duration-500", indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
