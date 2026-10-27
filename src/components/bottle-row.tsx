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

export function BottleRow({
  bottle,
  index = 0,
}: {
  bottle: BottleRowData;
  index?: number;
}) {
  const staggerClass = `stagger-${Math.min(index + 1, 8)}`;
  const title = bottle.wine.producer || bottle.wine.name;
  const grapeNames =
    bottle.wine.grapes?.map((g) => g.grape.name).join(", ") ?? "";
  const qty = bottle.quantity ?? 1;

  return (
    <Link
      href={`/bouteilles/${bottle.id}`}
      className={cn(
        "group block rounded-lg border border-border/60 bg-card px-4 py-3.5 transition-all hover:border-primary/30 hover:shadow-sm",
        "animate-fade-in-up",
        staggerClass,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted/40">
          {bottle.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bottle.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-primary/40">
              <Wine className="h-5 w-5" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-display text-base font-semibold text-foreground">
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
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {bottle.wine.wineType && (
                  <span>{getWineTypeLabel(bottle.wine.wineType)}</span>
                )}
                {bottle.wine.cuvee && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{bottle.wine.cuvee}</span>
                  </>
                )}
                {bottle.wine.appellation?.name && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{bottle.wine.appellation.name}</span>
                  </>
                )}
                {bottle.wine.region?.name && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{bottle.wine.region.name}</span>
                  </>
                )}
                {grapeNames && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="truncate">{grapeNames}</span>
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
                    <span>{getBottleFormatLabel(bottle.format)}</span>
                  </>
                )}
                {bottle.purchasePrice != null && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{formatPrice(bottle.purchasePrice)}</span>
                  </>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {bottle.location.name}
                  <span className="text-muted-foreground/60">·</span>
                  <span className="text-xs">
                    {getLocationTypeLabel(bottle.location.type)}
                  </span>
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground/80">
                Garde : {bottle.drinkWindow}
              </div>
            </div>
            <div className="shrink-0">
              <StatusBadge status={bottle.drinkStatus.kind} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
