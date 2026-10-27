import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDrinkStatus } from "@/lib/drink-status";
import { getViewCaveUserId, getSessionUserId } from "@/lib/cave-user";
import { StatusBadge, BottleStatusBadge } from "@/components/status-badge";
import {
  formatVintage,
  getLocationTypeLabel,
  getWineTypeLabel,
  getBottleFormatLabel,
  formatPrice,
  PROFILE_SCALES,
} from "@/lib/types";
import { StarRating } from "@/components/star-rating";
import { formatWineSummary } from "@/lib/wine-label";
import { ErrorState } from "@/components/empty-state";
import BottleActions from "@/components/bottle-actions";
import { BottlePhotos } from "@/components/bottle-photos";
import { GardeCurve } from "@/components/garde-curve";
import {
  MapPin,
  Wine,
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
  const grapeNames = bottle.wine.grapes.map((g) => g.grape.name);
  const title = bottle.wine.producer || bottle.wine.name;
  const heroUrl =
    bottle.media.find((m) => m.kind === "etiquette")?.url ??
    bottle.media[0]?.url ??
    bottle.wine.media.find((m) => m.kind === "etiquette")?.url ??
    bottle.wine.media[0]?.url ??
    null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/inventaire"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;inventaire
        </Link>
        {canWrite && (
          <Link
            href={`/bouteilles/${bottle.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="grid gap-0 md:grid-cols-[200px_1fr]">
          <div className="relative aspect-[3/4] bg-muted/40 md:aspect-auto md:min-h-[280px]">
            {heroUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center text-primary/30">
                <Wine className="h-16 w-16" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                    {title}
                  </h2>
                  {bottle.wine.cuvee && (
                    <p className="mt-1 text-base text-muted-foreground">
                      Cuvée {bottle.wine.cuvee}
                    </p>
                  )}
                  <p className="mt-1.5 font-display text-lg text-muted-foreground">
                    {formatVintage(bottle.wine.vintage)}
                    {bottle.quantity > 1 ? ` · ×${bottle.quantity}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={drink.kind} />
                  <BottleStatusBadge status={bottle.status} />
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {formatWineSummary(bottle.wine)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {bottle.wine.rating != null && (
                  <StarRating value={bottle.wine.rating} label="Moi" />
                )}
                {bottle.wine.externalRating != null && (
                  <StarRating
                    value={bottle.wine.externalRating}
                    label="Avis"
                    tone="external"
                  />
                )}
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-muted/40 px-4 py-3 text-sm">
              <span className="font-medium">{drink.label}</span>
              <span className="text-muted-foreground">
                {" "}
                — {drink.description}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <GardeCurve
        wine={{
          drinkFrom: bottle.wine.drinkFrom,
          peakStart: bottle.wine.peakStart,
          peakEnd: bottle.wine.peakEnd,
          drinkTo: bottle.wine.drinkTo,
          vintage: bottle.wine.vintage,
        }}
        currentYear={currentYear}
        className="animate-fade-in-up"
      />

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
    <div className="rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
