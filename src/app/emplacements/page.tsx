import { prisma } from "@/lib/prisma";
import { getLocationTypeLabel } from "@/lib/types";
import { LocationForm } from "@/components/location-form";
import { ErrorState } from "@/components/empty-state";
import { MapPin, Wine } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmplacementsPage() {
  let locations: {
    id: string;
    name: string;
    type: string;
    notes: string | null;
    _count: { bottles: number };
  }[] = [];
  let dbError = false;

  try {
    locations = await prisma.location.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { bottles: true } },
      },
    });
  } catch {
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border/50 pb-5">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Lieux de stockage
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-foreground">
          Emplacements
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cave, maison, grenier — définissez vos lieux de stockage.
        </p>
      </div>

      {dbError ? (
        <ErrorState
          title="Base de données indisponible"
          description="Vérifie DATABASE_URL (Neon) dans .env, puis npm run db:push."
        />
      ) : (
        <>
          {locations.length > 0 && (
            <div className="space-y-2">
              {locations.map((loc, i) => (
                <div
                  key={loc.id}
                  className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-4 py-3.5`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary/60" />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">
                        {loc.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getLocationTypeLabel(loc.type)}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Wine className="h-3.5 w-3.5" />
                          {loc._count.bottles} bouteille
                          {loc._count.bottles > 1 ? "s" : ""}
                        </span>
                      </div>
                      {loc.notes && (
                        <p className="mt-0.5 text-xs text-muted-foreground/80">
                          {loc.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-border/60 bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {locations.length === 0
                ? "Créer votre premier emplacement"
                : "Nouvel emplacement"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {locations.length === 0
                ? "Avant d'ajouter des bouteilles, définissez au moins un lieu de stockage."
                : "Ajoutez un nouveau lieu de stockage."}
            </p>
            <div className="mt-5">
              <LocationForm />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
