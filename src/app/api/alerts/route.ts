import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncDrinkAlerts, ALERT_KIND_LABELS } from "@/lib/sync-alerts";
import { requireUserId, unauthorized } from "@/lib/auth-utils";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const year = new Date().getFullYear();
  await syncDrinkAlerts(userId, year);

  const alerts = await prisma.drinkAlert.findMany({
    where: {
      forYear: year,
      wine: { userId },
      bottle: { status: "EN_STOCK", quantity: { gt: 0 }, userId },
    },
    include: {
      wine: { select: { name: true, producer: true, vintage: true } },
      bottle: { select: { id: true, quantity: true } },
    },
    orderBy: [{ readAt: "asc" }, { sentAt: "desc" }],
  });

  return NextResponse.json({
    year,
    unread: alerts.filter((a) => !a.readAt).length,
    alerts: alerts.map((a) => ({
      ...a,
      kindLabel: ALERT_KIND_LABELS[a.kind],
    })),
  });
}

/** Marquer toutes les alertes de l’année comme lues */
export async function PATCH() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const year = new Date().getFullYear();
  const result = await prisma.drinkAlert.updateMany({
    where: {
      forYear: year,
      readAt: null,
      wine: { userId },
    },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ updated: result.count });
}
