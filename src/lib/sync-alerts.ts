import { AlertKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { drinkStatus } from "@/lib/drink-status";

/**
 * Crée les alertes manquantes pour l’année civile (pas de cron).
 * Idempotent : ne duplique pas wineId+bottleId+kind+forYear.
 */
export async function syncDrinkAlerts(
  userId: string,
  year = new Date().getFullYear(),
) {
  const bottles = await prisma.bottle.findMany({
    where: { userId, status: "EN_STOCK", quantity: { gt: 0 } },
    include: { wine: true },
  });

  let created = 0;

  for (const bottle of bottles) {
    const wine = bottle.wine;
    const status = drinkStatus(wine, year);
    const kinds: AlertKind[] = [];

    if (year === wine.drinkFrom) kinds.push("ENTREE_FENETRE");
    if (year === wine.peakStart) kinds.push("DEBUT_PIC");
    if (status === "URGENT") kinds.push("URGENT");
    if (status === "DEPASSE" || year === wine.drinkTo) kinds.push("LIMITE");

    for (const kind of kinds) {
      const existing = await prisma.drinkAlert.findFirst({
        where: {
          wineId: wine.id,
          bottleId: bottle.id,
          kind,
          forYear: year,
        },
      });
      if (!existing) {
        await prisma.drinkAlert.create({
          data: {
            wineId: wine.id,
            bottleId: bottle.id,
            kind,
            forYear: year,
          },
        });
        created += 1;
      }
    }
  }

  return { created, year };
}

export async function countUnreadAlerts(
  userId: string,
  year = new Date().getFullYear(),
) {
  return prisma.drinkAlert.count({
    where: {
      forYear: year,
      readAt: null,
      wine: { userId },
      OR: [
        { bottle: { status: "EN_STOCK", quantity: { gt: 0 }, userId } },
        { bottleId: null },
      ],
    },
  });
}

export const ALERT_KIND_LABELS: Record<AlertKind, string> = {
  ENTREE_FENETRE: "Entre dans la fenêtre",
  DEBUT_PIC: "Début du pic",
  URGENT: "À boire bientôt",
  LIMITE: "Limite / dépassé",
};
