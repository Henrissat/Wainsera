import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import {
  formatVintage,
  getLocationTypeLabel,
  getWineTypeLabel,
  getBottleFormatLabel,
  formatPrice,
} from "@/lib/types";
import type { DrinkStatusInfo } from "@/lib/drink-status";
import { StarRating } from "@/components/star-rating";
import { Wine, MapPin } from "lucide-react";

export type BottleRowData = {
  id: string;
  quantity?: number;
  format?: string;
  purchasePrice?: number | null;
  thumbnailUrl?: string | null;
  wine: {
    name: string;
    producer?: string | null;
    cuvee?: string | null;
    vintage: number | null;
    wineType?: string;
    rating?: number | null;
    externalRating?: number | null;
    region?: { name: string } | null;
    appellation?: { name: string } | null;
    grapes?: { grape: { name: string } }[];
  };
  location: {
    name: string;
    type: string;
  };
  drinkWindow: string;
  drinkStatus: DrinkStatusInfo;
};

const STATUS_ACCENT: Record<DrinkStatusInfo["kind"], string> = {
  TROP_JEUNE: "bg-sky-500",
  PRET: "bg-emerald-500",
  OPTIMUM: "bg-success",
  URGENT: "bg-warning",
  DEPASSE: "bg-destructive",
};

export function BottleRow({
  bottle,
  index = 0,
  variant = "full",
}: {
  bottle: BottleRowData;
  index?: number;
  /** compact = ligne dense pour widgets (accueil « À boire ») */
  variant?: "full" | "compact";
}) {
  const staggerClass = `stagger-${Math.min(index + 1, 8)}`;
  const title = bottle.wine.producer || bottle.wine.name;
  const grapeNames =
    bottle.wine.grapes?.map((g) => g.grape.name).join(", ") ?? "";
  const qty = bottle.quantity ?? 1;
  const place =
    [bottle.wine.appellation?.name, bottle.wine.region?.name]
      .filter(Boolean)
      .join(" · ") || null;

  if (variant === "compact") {
    return (
      <Link
        href={`/bouteilles/${bottle.id}`}
        className={cn(
          "group flex w-full min-w-0 max-w-full items-center gap-2.5 overflow-hidden rounded-xl border border-border/50 bg-card/80 py-1.5 pr-2.5 pl-0 transition-colors hover:border-primary/30 hover:bg-card",
          "animate-fade-in-up",
          staggerClass,
        )}
      >
        <span
          className={cn(
            "h-11 w-1 shrink-0 rounded-full",
            STATUS_ACCENT[bottle.drinkStatus.kind],
          )}
          aria-hidden
        />
        <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-muted/50">
          {bottle.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bottle.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-primary/35">
              <Wine className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <h3 className="truncate font-display text-sm font-semibold leading-tight text-foreground">
              {title}
            </h3>
            <span className="shrink-0 font-display text-xs text-muted-foreground">
              {formatVintage(bottle.wine.vintage)}
            </span>
            {qty > 1 && (
              <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                ×{qty}
              </span>
            )}
          </div>
          {place && (
            <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
              {place}
            </p>
          )}
        </div>
        <StatusBadge
          status={bottle.drinkStatus.kind}
          animate={false}
          className="shrink-0"
        />
      </Link>
    );
  }

  return (
    <Link
      href={`/bouteilles/${bottle.id}`}
      className={cn(
        "group flex w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-primary/35 hover:shadow-md hover:shadow-primary/5",
        "animate-fade-in-up",
        staggerClass,
      )}
    >
      <div className="relative w-[4.75rem] shrink-0 self-stretch bg-muted/50 sm:w-24">
        {bottle.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bottle.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-primary/35">
            <Wine className="h-6 w-6" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 overflow-hidden px-3 py-3.5 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <h3 className="max-w-full truncate font-display text-base font-semibold text-foreground">
                {title}
              </h3>
              <span className="shrink-0 font-display text-sm font-medium text-muted-foreground">
                {formatVintage(bottle.wine.vintage)}
              </span>
              {qty > 1 && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                  ×{qty}
                </span>
              )}
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {bottle.wine.wineType && (
                <span className="shrink-0">
                  {getWineTypeLabel(bottle.wine.wineType)}
                </span>
              )}
              {bottle.wine.cuvee && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="min-w-0 truncate">{bottle.wine.cuvee}</span>
                </>
              )}
              {bottle.wine.appellation?.name && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="min-w-0 truncate">
                    {bottle.wine.appellation.name}
                  </span>
                </>
              )}
              {bottle.wine.region?.name && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="min-w-0 truncate">
                    {bottle.wine.region.name}
                  </span>
                </>
              )}
              {grapeNames && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="min-w-0 truncate">{grapeNames}</span>
                </>
              )}
              {bottle.wine.rating != null && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <StarRating value={bottle.wine.rating} size="sm" />
                </>
              )}
              {bottle.wine.externalRating != null && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <StarRating
                    value={bottle.wine.externalRating}
                    size="sm"
                    label="Avis"
                    tone="external"
                  />
                </>
              )}
              {bottle.format && bottle.format !== "STANDARD_75" && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="shrink-0">
                    {getBottleFormatLabel(bottle.format)}
                  </span>
                </>
              )}
              {bottle.purchasePrice != null && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="shrink-0">
                    {formatPrice(bottle.purchasePrice)}
                  </span>
                </>
              )}
            </div>
            <div className="mt-1.5 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">
                {bottle.location.name}
                <span className="text-muted-foreground/60"> · </span>
                {getLocationTypeLabel(bottle.location.type)}
              </span>
            </div>
            <div className="mt-1 truncate text-xs text-muted-foreground/80">
              Garde : {bottle.drinkWindow}
            </div>
          </div>
          <div className="max-w-[40%] shrink-0">
            <StatusBadge status={bottle.drinkStatus.kind} />
          </div>
        </div>
      </div>
    </Link>
  );
}
