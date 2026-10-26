import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import {
  getDrinkStatus,
  formatDrinkWindow,
  DRINK_STATUS_ORDER,
  type DrinkWindowStatus,
} from "@/lib/drink-status";
import { BottleRow, type BottleRowData } from "@/components/bottle-row";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { InventoryFilters } from "@/components/inventory-filters";
import { Plus } from "lucide-react";
import type { WineType } from "@prisma/client";
import { syncDrinkAlerts } from "@/lib/sync-alerts";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim().toLowerCase();
  const type = String(sp.type ?? "") as WineType | "";
  const region = String(sp.region ?? "");
  const grape = String(sp.grape ?? "");
  const drink = String(sp.drink ?? "") as DrinkWindowStatus | "";
  const location = String(sp.location ?? "");
  const sort = String(sp.sort ?? "urgence");

  const currentYear = new Date().getFullYear();

  let bottles: BottleRowData[] = [];
  let filterRegions: { id: string; name: string }[] = [];
  let filterGrapes: { id: string; name: string }[] = [];
  let filterLocations: { id: string; name: string }[] = [];
  let dbError = false;
  let totalQty = 0;

  try {
    await syncDrinkAlerts(currentYear);

    const [rawBottles, regions, grapes, locations] = await Promise.all([
      prisma.bottle.findMany({
        where: {
          status: "EN_STOCK",
          ...(location ? { locationId: location } : {}),
          wine: {
            ...(type ? { wineType: type } : {}),
            ...(region ? { regionId: region } : {}),
            ...(grape
              ? { grapes: { some: { grapeId: grape } } }
              : {}),
          },
        },
        include: {
          wine: {
            include: {
              grapes: { include: { grape: true } },
              region: true,
              appellation: true,
            },
          },
          location: true,
        },
      }),
      prisma.region.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.grape.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.location.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    filterRegions = regions;
    filterGrapes = grapes;
    filterLocations = locations;

    bottles = rawBottles
      .map((b) => {
        const status = getDrinkStatus(currentYear, b.wine);
        return {
          id: b.id,
          quantity: b.quantity,
          format: b.format,
          purchasePrice: b.purchasePrice,
          wine: {
            name: b.wine.name,
            producer: b.wine.producer,
            cuvee: b.wine.cuvee,
            vintage: b.wine.vintage,
            wineType: b.wine.wineType,
            region: b.wine.region,
            appellation: b.wine.appellation,
            rating: b.wine.rating,
            grapes: b.wine.grapes,
          },
          location: {
            name: b.location.name,
            type: b.location.type,
          },
          drinkWindow: formatDrinkWindow(b.wine),
          drinkStatus: status,
        };
      })
      .filter((b) => {
        if (drink && b.drinkStatus.kind !== drink) return false;
        if (!q) return true;
        const hay = [
          b.wine.name,
          b.wine.producer,
          b.wine.cuvee,
          b.wine.appellation?.name,
          b.wine.region?.name,
          ...(b.wine.grapes?.map((g) => g.grape.name) ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });

    bottles.sort((a, b) => {
      if (sort === "nom") {
        return (a.wine.producer || a.wine.name).localeCompare(
          b.wine.producer || b.wine.name,
          "fr",
        );
      }
      if (sort === "millesime") {
        return (b.wine.vintage ?? 0) - (a.wine.vintage ?? 0);
      }
      if (sort === "note") {
        return (b.wine.rating ?? -1) - (a.wine.rating ?? -1);
      }
      const orderDiff =
        DRINK_STATUS_ORDER[a.drinkStatus.kind] -
        DRINK_STATUS_ORDER[b.drinkStatus.kind];
      if (orderDiff !== 0) return orderDiff;
      return (a.wine.vintage ?? 9999) - (b.wine.vintage ?? 9999);
    });

    totalQty = bottles.reduce((sum, b) => sum + (b.quantity ?? 1), 0);
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="space-y-6">
        <HeroHeader count={null} qty={null} />
        <ErrorState
          title="Cave inaccessible"
          description="Vérifie DATABASE_URL dans .env (compte Neon), puis lance npm run db:push."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroHeader count={bottles.length} qty={totalQty} />

      <Suspense fallback={null}>
        <InventoryFilters
          regions={filterRegions}
          grapes={filterGrapes}
          locations={filterLocations}
        />
      </Suspense>

      {bottles.length === 0 ? (
        <EmptyState
          title="Aucun résultat"
          description="Aucune bouteille ne correspond aux filtres — ou la cave est vide."
          action={
            <Link
              href="/ajouter"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Ajouter une bouteille
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {bottles.map((bottle, i) => (
            <BottleRow key={bottle.id} bottle={bottle} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroHeader({
  count,
  qty,
}: {
  count: number | null;
  qty: number | null;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Inventaire
        </p>
        <h2 className="mt-1 font-display text-3xl font-bold leading-tight text-foreground">
          Wainsera
        </h2>
        {count !== null && qty !== null && (
          <p className="mt-1 text-sm text-muted-foreground">
            {count} fiche{count > 1 ? "s" : ""}
            {qty !== count ? ` · ${qty} bouteille${qty > 1 ? "s" : ""}` : ""}
          </p>
        )}
      </div>
      {count !== null && (
        <Link
          href="/ajouter"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Link>
      )}
    </div>
  );
}
