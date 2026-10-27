import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getDrinkStatus,
  formatDrinkWindow,
  DRINK_STATUS_ORDER,
} from "@/lib/drink-status";
import { BottleRow, type BottleRowData } from "@/components/bottle-row";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { MarkAlertsReadButton } from "@/components/mark-alerts-read";
import {
  syncDrinkAlerts,
  ALERT_KIND_LABELS,
} from "@/lib/sync-alerts";
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Bell,
} from "lucide-react";
import { getViewCaveUserId, getSessionUserId } from "@/lib/cave-user";

export const dynamic = "force-dynamic";

export default async function ABoirePage() {
  const userId = await getViewCaveUserId();
  const canWrite = !!(await getSessionUserId());
  const currentYear = new Date().getFullYear();

  let bottles: BottleRowData[] = [];
  let alerts: {
    id: string;
    kind: keyof typeof ALERT_KIND_LABELS;
    readAt: Date | null;
    wine: { name: string; producer: string | null; vintage: number | null };
    bottleId: string | null;
  }[] = [];
  let dbError = false;

  try {
    if (userId) {
      await syncDrinkAlerts(userId, currentYear);

      const [rawBottles, rawAlerts] = await Promise.all([
        prisma.bottle.findMany({
          where: { userId, status: "EN_STOCK" },
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
        prisma.drinkAlert.findMany({
          where: {
            forYear: currentYear,
            wine: { userId },
            bottle: { status: "EN_STOCK", quantity: { gt: 0 }, userId },
          },
          include: {
            wine: { select: { name: true, producer: true, vintage: true } },
          },
          orderBy: [{ readAt: "asc" }, { sentAt: "desc" }],
          take: 20,
        }),
      ]);

      alerts = rawAlerts;

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
        .filter(
          (b) =>
            b.drinkStatus.kind === "OPTIMUM" ||
            b.drinkStatus.kind === "URGENT" ||
            b.drinkStatus.kind === "DEPASSE",
        )
        .sort((a, b) => {
          const orderDiff =
            DRINK_STATUS_ORDER[a.drinkStatus.kind] -
            DRINK_STATUS_ORDER[b.drinkStatus.kind];
          if (orderDiff !== 0) return orderDiff;
          const va = a.wine.vintage ?? 9999;
          const vb = b.wine.vintage ?? 9999;
          return va - vb;
        });
    }
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="space-y-6">
        <Header counts={null} />
        <ErrorState
          title="Base de données indisponible"
          description="Vérifie DATABASE_URL (Neon) dans .env, puis npm run db:push."
        />
      </div>
    );
  }

  const counts = {
    optimum: bottles.filter((b) => b.drinkStatus.kind === "OPTIMUM").length,
    urgent: bottles.filter((b) => b.drinkStatus.kind === "URGENT").length,
    depasse: bottles.filter((b) => b.drinkStatus.kind === "DEPASSE").length,
  };

  const unread = alerts.filter((a) => !a.readAt);

  return (
    <div className="space-y-6">
      <Header counts={counts} />

      {unread.length > 0 && (
        <div className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Bell className="mt-0.5 h-4 w-4 text-amber-800" />
              <div>
                <p className="text-sm font-medium text-amber-950">
                  {unread.length} alerte{unread.length > 1 ? "s" : ""} non lue
                  {unread.length > 1 ? "s" : ""} ({currentYear})
                </p>
                <ul className="mt-2 space-y-1 text-xs text-amber-900/90">
                  {unread.slice(0, 5).map((a) => (
                    <li key={a.id}>
                      <span className="font-medium">
                        {ALERT_KIND_LABELS[a.kind]}
                      </span>
                      {" — "}
                      {a.wine.producer || a.wine.name}
                      {a.wine.vintage != null ? ` (${a.wine.vintage})` : ""}
                      {a.bottleId && (
                        <>
                          {" · "}
                          <Link
                            href={`/bouteilles/${a.bottleId}`}
                            className="underline underline-offset-2"
                          >
                            voir
                          </Link>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {canWrite && <MarkAlertsReadButton />}
          </div>
        </div>
      )}

      {bottles.length === 0 ? (
        <EmptyState
          title="Rien à boire pour l'instant"
          description="Aucune bouteille n'est à son optimum ou en urgence. Vos vins vieillissent encore sagement."
          action={
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Voir l&apos;inventaire
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

function Header({
  counts,
}: {
  counts: { optimum: number; urgent: number; depasse: number } | null;
}) {
  return (
    <div className="space-y-4 border-b border-border/50 pb-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Priorités de dégustation
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-foreground">
          À boire
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bouteilles à leur optimum ou dont la fenêtre se referme — alertes
          calculées à l&apos;ouverture.
        </p>
      </div>

      {counts && (
        <div className="grid grid-cols-3 gap-3">
          <CountCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Optimum"
            count={counts.optimum}
            color="text-emerald-700"
          />
          <CountCard
            icon={<CalendarClock className="h-4 w-4" />}
            label="Urgent"
            count={counts.urgent}
            color="text-amber-700"
          />
          <CountCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Dépassé"
            count={counts.depasse}
            color="text-rose-700"
          />
        </div>
      )}
    </div>
  );
}

function CountCard({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5 text-center">
      <div
        className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}
      >
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">
        {count}
      </p>
    </div>
  );
}
