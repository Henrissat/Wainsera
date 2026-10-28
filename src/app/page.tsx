import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getDrinkStatus,
  formatDrinkWindow,
  DRINK_STATUS_ORDER,
} from "@/lib/drink-status";
import { BottleRow, type BottleRowData } from "@/components/bottle-row";
import { ErrorState } from "@/components/empty-state";
import { getViewCaveUserId, getSessionUserId } from "@/lib/cave-user";
import { pickThumbnailUrl } from "@/lib/media-thumb";
import { syncDrinkAlerts } from "@/lib/sync-alerts";
import { formatPrice, getWineTypeLabel, WINE_TYPE_LABELS } from "@/lib/types";
import type { WineType } from "@prisma/client";
import {
  Wine,
  Banknote,
  GlassWater,
  Hourglass,
  ArrowRight,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";

const HOME_HERO_IMAGE =
  "https://res.cloudinary.com/doe4mucdz/image/upload/c_fill,g_auto,h_250,w_970/b_rgb:000000,e_gradient_fade,y_-0.50/c_scale,co_rgb:ffffff,fl_relative,l_text:montserrat_25_style_light_align_center:Shop%20Now,w_0.5,y_0.18/v1793198852/9035694_rqg2bs.jpg";

export default async function DashboardPage() {
  const userId = await getViewCaveUserId();
  const canWrite = !!(await getSessionUserId());
  const currentYear = new Date().getFullYear();

  let dbError = false;
  let totalQty = 0;
  let totalValue = 0;
  let readyCount = 0;
  let agingCount = 0;
  let byType: { type: WineType; qty: number }[] = [];
  let recent: BottleRowData[] = [];
  let toDrink: BottleRowData[] = [];

  try {
    if (userId) {
      await syncDrinkAlerts(userId, currentYear);

      const raw = await prisma.bottle.findMany({
        where: { userId, status: "EN_STOCK" },
        include: {
          wine: {
            include: {
              grapes: { include: { grape: true } },
              region: true,
              appellation: true,
              media: { select: { url: true, kind: true }, take: 3 },
            },
          },
          location: true,
          media: { select: { url: true, kind: true }, take: 3 },
        },
        orderBy: { createdAt: "desc" },
      });

      const rows: BottleRowData[] = raw.map((b) => {
        const status = getDrinkStatus(currentYear, b.wine);
        return {
          id: b.id,
          quantity: b.quantity,
          format: b.format,
          purchasePrice: b.purchasePrice,
          thumbnailUrl: pickThumbnailUrl(b.media, b.wine.media),
          wine: {
            name: b.wine.name,
            producer: b.wine.producer,
            cuvee: b.wine.cuvee,
            vintage: b.wine.vintage,
            wineType: b.wine.wineType,
            region: b.wine.region,
            appellation: b.wine.appellation,
            rating: b.wine.rating,
            externalRating: b.wine.externalRating,
            grapes: b.wine.grapes,
          },
          location: {
            name: b.location.name,
            type: b.location.type,
          },
          drinkWindow: formatDrinkWindow(b.wine),
          drinkStatus: status,
        };
      });

      for (const b of rows) {
        const q = b.quantity ?? 1;
        totalQty += q;
        if (b.purchasePrice != null) totalValue += b.purchasePrice * q;
        if (
          b.drinkStatus.kind === "PRET" ||
          b.drinkStatus.kind === "OPTIMUM"
        ) {
          readyCount += q;
        }
        if (b.drinkStatus.kind === "TROP_JEUNE") agingCount += q;
      }

      const typeMap = new Map<WineType, number>();
      for (const b of rows) {
        const t = (b.wine.wineType as WineType) || "AUTRE";
        typeMap.set(t, (typeMap.get(t) ?? 0) + (b.quantity ?? 1));
      }
      byType = [...typeMap.entries()]
        .map(([type, qty]) => ({ type, qty }))
        .sort((a, b) => b.qty - a.qty);

      recent = rows.slice(0, 6);
      toDrink = [...rows]
        .filter(
          (b) =>
            b.drinkStatus.kind === "OPTIMUM" ||
            b.drinkStatus.kind === "URGENT" ||
            b.drinkStatus.kind === "DEPASSE",
        )
        .sort((a, b) => {
          const d =
            DRINK_STATUS_ORDER[a.drinkStatus.kind] -
            DRINK_STATUS_ORDER[b.drinkStatus.kind];
          if (d !== 0) return d;
          return (a.wine.vintage ?? 9999) - (b.wine.vintage ?? 9999);
        })
        .slice(0, 5);
    }
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <ErrorState
        title="Cave inaccessible"
        description="Vérifie DATABASE_URL dans .env (compte Neon)."
      />
    );
  }

  const typeTotal = byType.reduce((s, t) => s + t.qty, 0) || 1;

  return (
    <div className="space-y-8">
      <section className="home-hero relative -mx-4 -mt-5 overflow-hidden sm:-mx-6 lg:-mx-8 lg:-mt-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HOME_HERO_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
          />
          <div className="home-hero-scrim absolute inset-0" />
          <div className="home-hero-fade absolute inset-0" />
        </div>

        <div className="relative z-10 px-4 pb-2 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-medium uppercase tracking-wider text-white/75">
                Tableau de bord
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold text-white drop-shadow-sm sm:text-4xl">
                Accueil
              </h1>
              <p className="mt-2 text-sm text-white/80 sm:text-base">
                Vue d&apos;ensemble de ta cave
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/inventaire"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-white/25"
              >
                Inventaire
                <ArrowRight className="h-4 w-4" />
              </Link>
              {canWrite && (
                <>
                  <Link
                    href="/importer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-white/25"
                  >
                    Importer
                  </Link>
                  <Link
                    href="/ajouter"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-black/20 hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={<Wine className="h-4 w-4" />}
              label="Bouteilles"
              value={String(totalQty)}
            />
            <KpiCard
              icon={<Banknote className="h-4 w-4" />}
              label="Valeur estimée"
              value={formatPrice(totalValue || null)}
              hint="Somme des prix d'achat"
            />
            <KpiCard
              icon={<GlassWater className="h-4 w-4" />}
              label="Prêtes à boire"
              value={String(readyCount)}
              tone="success"
            />
            <KpiCard
              icon={<Hourglass className="h-4 w-4" />}
              label="À garder"
              value={String(agingCount)}
              tone="muted"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="font-display text-base font-semibold">
            Répartition par type
          </h2>
          {byType.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Aucune donnée.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {byType.map((t) => {
                const pct = Math.round((t.qty / typeTotal) * 100);
                return (
                  <li key={t.type}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{getWineTypeLabel(t.type)}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {t.qty} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {byType.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {byType.map((t) => (
                <span
                  key={t.type}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {WINE_TYPE_LABELS[t.type]}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold">À boire</h2>
            <Link
              href="/a-boire"
              className="text-xs font-medium text-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>
          {toDrink.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Rien d&apos;urgent pour le moment.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {toDrink.map((b, i) => (
                <BottleRow key={b.id} bottle={b} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold">
            Dernières acquisitions
          </h2>
          <Link
            href="/inventaire"
            className="text-xs font-medium text-primary hover:underline"
          >
            Inventaire complet
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-5 py-10 text-center text-sm text-muted-foreground">
            Aucune bouteille pour l&apos;instant.
            {canWrite && (
              <>
                {" "}
                <Link href="/ajouter" className="font-medium text-primary underline-offset-2 hover:underline">
                  Ajouter la première
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {recent.map((b, i) => (
              <BottleRow key={b.id} bottle={b} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-md shadow-black/5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span
          className={
            tone === "success"
              ? "text-success"
              : tone === "muted"
                ? "text-muted-foreground"
                : "text-primary"
          }
        >
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
