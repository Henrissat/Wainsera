import { cn } from "@/lib/utils";
import type { BottleStatus } from "@prisma/client";
import type { DrinkWindowStatus } from "@/lib/drink-status";
import { drinkStatusLabel } from "@/lib/drink-status";
import { BOTTLE_STATUS_LABELS } from "@/lib/types";

const DRINK_STATUS_STYLES: Record<DrinkWindowStatus, string> = {
  TROP_JEUNE:
    "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/25 dark:text-sky-300",
  PRET:
    "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300",
  OPTIMUM:
    "bg-success/15 text-success ring-1 ring-success/30",
  URGENT:
    "bg-warning/15 text-amber-800 ring-1 ring-warning/35 dark:text-amber-300",
  DEPASSE:
    "bg-destructive/10 text-destructive ring-1 ring-destructive/25",
};

const BOTTLE_STATUS_STYLES: Record<BottleStatus, string> = {
  EN_STOCK: "bg-primary/10 text-primary ring-1 ring-primary/20",
  BUE: "bg-muted text-muted-foreground ring-1 ring-border",
  OFFERTE: "bg-accent/15 text-accent-foreground ring-1 ring-accent/25",
  PERDUE: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
};

export function StatusBadge({
  status,
  animate = true,
  className,
}: {
  status: DrinkWindowStatus;
  animate?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:text-xs",
        DRINK_STATUS_STYLES[status],
        animate && "animate-badge-pop",
        className,
      )}
    >
      {drinkStatusLabel[status]}
    </span>
  );
}

export function BottleStatusBadge({
  status,
  className,
}: {
  status: BottleStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        BOTTLE_STATUS_STYLES[status],
        className,
      )}
    >
      {BOTTLE_STATUS_LABELS[status]}
    </span>
  );
}
