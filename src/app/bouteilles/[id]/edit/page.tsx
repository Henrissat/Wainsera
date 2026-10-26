import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddBottleForm } from "@/components/add-bottle-form";
import { ErrorState } from "@/components/empty-state";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditBottlePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { id } = await params;

  let bottle: Awaited<ReturnType<typeof load>> = null;
  let locations: { id: string; name: string; type: string }[] = [];
  let regions: {
    id: string;
    name: string;
    appellations: { id: string; name: string }[];
  }[] = [];
  let grapes: { id: string; name: string }[] = [];
  let merchants: { id: string; name: string }[] = [];
  let dbError = false;

  try {
    [bottle, locations, regions, grapes, merchants] = await Promise.all([
      load(id, userId),
      prisma.location.findMany({
        where: { userId },
        orderBy: [{ type: "asc" }, { name: "asc" }],
        select: { id: true, name: true, type: true },
      }),
      prisma.region.findMany({
        orderBy: { name: "asc" },
        include: {
          appellations: {
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          },
        },
      }),
      prisma.grape.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.merchant.findMany({
        where: { userId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <ErrorState
        title="Base indisponible"
        description="Vérifie DATABASE_URL (Neon)."
      />
    );
  }

  if (!bottle) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/bouteilles/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la fiche
      </Link>

      <div className="border-b border-border/50 pb-5">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Édition
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
          Modifier la bouteille
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {bottle.wine.producer || bottle.wine.name}
        </p>
      </div>

      <div className="rounded-lg border border-border/60 bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <AddBottleForm
          bottleId={bottle.id}
          locations={locations}
          regions={regions}
          grapes={grapes}
          merchants={merchants}
          initial={{
            producer: bottle.wine.producer,
            cuvee: bottle.wine.cuvee,
            vintage: bottle.wine.vintage,
            locationId: bottle.locationId,
            wineType: bottle.wine.wineType,
            regionId: bottle.wine.regionId,
            appellationId: bottle.wine.appellationId,
            grapeIds: bottle.wine.grapes.map((g) => g.grapeId),
            alcoholAbv: bottle.wine.alcoholAbv,
            quantity: bottle.quantity,
            format: bottle.format,
            purchasePrice: bottle.purchasePrice,
            purchaseDate: bottle.purchaseDate
              ? bottle.purchaseDate.toISOString().slice(0, 10)
              : null,
            merchantId: bottle.merchantId,
            purchaseNotes: bottle.purchaseNotes,
            rating: bottle.wine.rating,
            notes: bottle.wine.notes,
            scaleDouxAcide: bottle.wine.scaleDouxAcide,
            scaleSecMoelleux: bottle.wine.scaleSecMoelleux,
            scaleSoupleTannique: bottle.wine.scaleSoupleTannique,
            scaleLegerPuissant: bottle.wine.scaleLegerPuissant,
            drinkFrom: bottle.wine.drinkFrom,
            peakStart: bottle.wine.peakStart,
            peakEnd: bottle.wine.peakEnd,
            drinkTo: bottle.wine.drinkTo,
          }}
        />
      </div>
    </div>
  );
}

async function load(id: string, userId: string) {
  return prisma.bottle.findFirst({
    where: { id, userId },
    include: {
      wine: { include: { grapes: true } },
    },
  });
}
