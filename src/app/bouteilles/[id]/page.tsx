import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDrinkStatus, formatDrinkWindow } from "@/lib/drink-status";
import { getViewCaveUserId, getSessionUserId } from "@/lib/cave-user";
import { StatusBadge, BottleStatusBadge } from "@/components/status-badge";
import {
  formatVintage,
  getLocationTypeLabel,
  getWineTypeLabel,
  getBottleFormatLabel,
  formatPrice,
  formatRating,
  PROFILE_SCALES,
} from "@/lib/types";
import { formatWineSummary } from "@/lib/wine-label";
import { ErrorState } from "@/components/empty-state";
import BottleActions from "@/components/bottle-actions";
import { BottlePhotos } from "@/components/bottle-photos";
import {
  MapPin,
  Wine,
  Calendar,
  FileText,
  ArrowLeft,
  Grape,
  Percent,
  Pencil,
  ShoppingBag,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function BottleDetailPage({ params }: Props) {
  const userId = await getViewCaveUserId();
  const sessionUserId = await getSessionUserId();
  const canWrite = !!sessionUserId && sessionUserId === userId;

  const { id } = await params;
  const currentYear = new Date().getFullYear();

  let bottle: Awaited<ReturnType<typeof loadBottle>> = null;
  let dbError = false;

  try {
    if (userId) bottle = await loadBottle(id, userId);
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <ErrorState
        title="Base de données indisponible"
        description="Vérifie DATABASE_URL (Neon), puis npm run db:push."
      />
    );
  }

  if (!bottle) notFound();

  const drink = getDrinkStatus(currentYear, bottle.wine);
  const drinkWindow = formatDrinkWindow(bottle.wine);
  const grapeNames = bottle.wine.grapes.map((g) => g.grape.name);
  const title = bottle.wine.producer || bottle.wine.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;inventaire
        </Link>
        {canWrite && (
          <Link
            href={`/bouteilles/${bottle.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Link>
        )}
      </div>

      <div className="border-b border-border/50 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-primary/60" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                {title}
              </h2>
            </div>
            {bottle.wine.cuvee && (
              <p className="mt-1 text-base text-muted-foreground">
                Cuvée {bottle.wine.cuvee}
              </p>
            )}
            <p className="mt-1.5 font-display text-lg text-muted-foreground">
              {formatVintage(bottle.wine.vintage)}
              {bottle.quantity > 1 ? ` · ×${bottle.quantity}` : ""}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatWineSummary(bottle.wine)}
            </p>
            {bottle.wine.rating != null && (
              <p className="mt-2 text-amber-600">
                {formatRating(bottle.wine.rating)}{" "}
                <span className="text-sm text-muted-foreground">
                  {bottle.wine.rating}/5
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={drink.kind} />
            <BottleStatusBadge status={bottle.status} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
        <span className="font-medium">{drink.label}</span>
        <span className="text-muted-foreground"> — {drink.description}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard
          icon={<Wine className="h-4 w-4" />}
          label="Type"
          value={getWineTypeLabel(bottle.wine.wineType)}
        />
        <InfoCard
          icon={<MapPin className="h-4 w-4" />}
          label="Région / appellation"
          value={[bottle.wine.region?.name, bottle.wine.appellation?.name]
            .filter(Boolean)
            .join(" · ") || "—"}
        />
        <InfoCard
          icon={<Grape className="h-4 w-4" />}
          label="Cépages"
          value={grapeNames.length ? grapeNames.join(", ") : "—"}
        />
        <InfoCard
          icon={<Percent className="h-4 w-4" />}
          label="Alcool"
          value={
            bottle.wine.alcoholAbv != null
              ? `${bottle.wine.alcoholAbv} % vol.`
              : "—"
          }
        />
        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="Fenêtre de garde"
          value={drinkWindow}
        />
        <InfoCard
          icon={<MapPin className="h-4 w-4" />}
          label="Emplacement"
          value={`${bottle.location.name} · ${getLocationTypeLabel(bottle.location.type)} · ×${bottle.quantity}`}
        />
        <InfoCard
          icon={<Wine className="h-4 w-4" />}
          label="Format"
          value={getBottleFormatLabel(bottle.format)}
        />
        <InfoCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Achat"
          value={[
            formatPrice(bottle.purchasePrice),
            bottle.purchaseDate
              ? bottle.purchaseDate.toLocaleDateString("fr-FR")
              : null,
            bottle.merchant?.name,
          ]
            .filter(Boolean)
            .join(" · ") || "—"}
        />
      </div>

      {bottle.purchaseNotes && (
        <p className="text-sm text-muted-foreground">
          Note d&apos;achat : {bottle.purchaseNotes}
        </p>
      )}

      {PROFILE_SCALES.some((s) => bottle.wine[s.key] != null) && (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
          <h3 className="font-display text-base font-semibold">
            Caractéristiques
          </h3>
          <div className="mt-4 space-y-4">
            {PROFILE_SCALES.map((s) => {
              const value = bottle.wine[s.key];
              if (value == null) return null;
              return (
                <div key={s.key}>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{s.left}</span>
                    <span className="font-medium text-foreground">{value}/5</span>
                    <span>{s.right}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={
                          n <= value
                            ? "h-2 flex-1 rounded-full bg-primary"
                            : "h-2 flex-1 rounded-full bg-muted"
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
        <h3 className="font-display text-base font-semibold">
          Détail de la fenêtre
        </h3>
        <div className="mt-3 space-y-2 text-sm">
          {(
            [
              ["Boire à partir de", bottle.wine.drinkFrom],
              ["Début optimum", bottle.wine.peakStart],
              ["Fin optimum", bottle.wine.peakEnd],
              ["Boire avant", bottle.wine.drinkTo],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between border-b border-border/30 pb-2"
            >
              <span className="text-muted-foreground">{label}</span>
              <span
                className={
                  value === currentYear
                    ? "font-semibold text-primary"
                    : value < currentYear
                      ? "text-muted-foreground line-through"
                      : "font-medium"
                }
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {bottle.wine.notes && (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">
              Commentaire
            </h3>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{bottle.wine.notes}</p>
        </div>
      )}

      <BottlePhotos
        bottleId={bottle.id}
        wineId={bottle.wine.id}
        canEdit={canWrite}
        media={[
          ...bottle.media,
          ...bottle.wine.media.filter(
            (m) => !bottle.media.some((bm) => bm.id === m.id),
          ),
        ]}
      />

      {canWrite && bottle.status === "EN_STOCK" && (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
          <h3 className="font-display text-base font-semibold">Actions</h3>
          <BottleActions bottleId={bottle.id} quantity={bottle.quantity} />
        </div>
      )}
    </div>
  );
}

async function loadBottle(id: string, userId: string) {
  return prisma.bottle.findFirst({
    where: { id, userId },
    include: {
      wine: {
        include: {
          grapes: { include: { grape: true } },
          region: true,
          appellation: true,
          media: true,
        },
      },
      location: true,
      merchant: true,
      media: true,
    },
  });
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
