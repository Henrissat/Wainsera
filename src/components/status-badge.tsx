import { cn } from "@/lib/utils";
import type { BottleStatus } from "@prisma/client";
import type { DrinkWindowStatus } from "@/lib/drink-status";
import { drinkStatusLabel } from "@/lib/drink-status";
import { BOTTLE_STATUS_LABELS } from "@/lib/types";

const DRINK_STATUS_STYLES: Record<DrinkWindowStatus, string> = {
  TROP_JEUNE: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  PRET: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  OPTIMUM: "bg-green-50 text-green-700 ring-1 ring-green-200",
  URGENT: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  DEPASSE: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

const BOTTLE_STATUS_STYLES: Record<BottleStatus, string> = {
  EN_STOCK: "bg-primary/10 text-primary ring-1 ring-primary/20",
  BUE: "bg-muted text-muted-foreground ring-1 ring-border",
  OFFERTE: "bg-accent/10 text-accent ring-1 ring-accent/20",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
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
