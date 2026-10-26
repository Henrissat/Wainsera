import { prisma } from "@/lib/prisma";
import { AddBottleForm } from "@/components/add-bottle-form";
import { ErrorState } from "@/components/empty-state";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AjouterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

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
    [locations, regions, grapes, merchants] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div className="border-b border-border/50 pb-5">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Nouvelle bouteille
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-foreground">
          Ajouter à la cave
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Type, domaine, appellation, région, cépages, quantité…
        </p>
      </div>

      {dbError ? (
        <ErrorState
          title="Base de données indisponible"
          description="Vérifie DATABASE_URL (Neon), puis npm run db:push && npm run db:seed."
        />
      ) : (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          {regions.length === 0 && (
            <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Listes vides : lance <code className="font-mono">npm run db:seed</code>{" "}
              pour charger régions, appellations et cépages.
            </p>
          )}
          <AddBottleForm
            locations={locations}
            regions={regions}
            grapes={grapes}
            merchants={merchants}
          />
        </div>
      )}
    </div>
  );
}
