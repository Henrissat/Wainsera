import { NextResponse } from "next/server";
import { WineType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { drinkStatus, drinkStatusLabel } from "@/lib/drink-status";
import { parsePurchaseFields, resolveMerchantId } from "@/lib/purchase";
import { requireUserId, unauthorized, notFound } from "@/lib/auth-utils";

function parseOptionalInt(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function parseScale(value: unknown): number | null {
  const n = parseOptionalInt(value);
  if (n == null || n < 1 || n > 5) return null;
  return n;
}

function parseRating(value: unknown): number | null {
  const n = parseOptionalInt(value);
  if (n == null || n < 0 || n > 5) return null;
  return n;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const bottles = await prisma.bottle.findMany({
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
      merchant: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const year = new Date().getFullYear();
  return NextResponse.json(
    bottles.map((b) => {
      const status = drinkStatus(b.wine, year);
      return {
        ...b,
        drinkWindow: status,
        drinkWindowLabel: drinkStatusLabel[status],
      };
    }),
  );
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await request.json();

  const producer = String(body.producer ?? "").trim();
  const cuvee = body.cuvee ? String(body.cuvee).trim() : null;
  const nameFromParts = [producer, cuvee].filter(Boolean).join(" — ");
  const name = String(body.name ?? nameFromParts).trim() || nameFromParts;

  const locationId = String(body.locationId ?? "").trim();
  const vintage =
    body.vintage === "" || body.vintage == null ? null : Number(body.vintage);
  const drinkFrom = Number(body.drinkFrom);
  const peakStart = Number(body.peakStart);
  const peakEnd = Number(body.peakEnd);
  const drinkTo = Number(body.drinkTo);
  const notes = body.notes ? String(body.notes).trim() : null;
  const wineType = (body.wineType as WineType) || WineType.ROUGE;
  const regionId = body.regionId ? String(body.regionId) : null;
  const appellationId = body.appellationId
    ? String(body.appellationId)
    : null;
  const alcoholAbv =
    body.alcoholAbv === "" || body.alcoholAbv == null
      ? null
      : Number(body.alcoholAbv);
  const quantity = Math.max(1, parseOptionalInt(body.quantity) ?? 1);
  const rating = parseRating(body.rating);
  const scaleDouxAcide = parseScale(body.scaleDouxAcide);
  const scaleSecMoelleux = parseScale(body.scaleSecMoelleux);
  const scaleSoupleTannique = parseScale(body.scaleSoupleTannique);
  const scaleLegerPuissant = parseScale(body.scaleLegerPuissant);

  const grapeIds: string[] = Array.isArray(body.grapeIds)
    ? body.grapeIds.map((g: unknown) => String(g)).filter(Boolean)
    : [];

  if (!producer || !locationId) {
    return NextResponse.json(
      { error: "Domaine/château et emplacement obligatoires" },
      { status: 400 },
    );
  }

  if (!regionId) {
    return NextResponse.json(
      { error: "La région est obligatoire" },
      { status: 400 },
    );
  }

  if (!Object.values(WineType).includes(wineType)) {
    return NextResponse.json({ error: "Type de vin invalide" }, { status: 400 });
  }

  if (
    alcoholAbv != null &&
    (Number.isNaN(alcoholAbv) || alcoholAbv < 0 || alcoholAbv > 30)
  ) {
    return NextResponse.json(
      { error: "Degré d'alcool invalide (0–30 %)" },
      { status: 400 },
    );
  }

  if (
    [drinkFrom, peakStart, peakEnd, drinkTo].some((n) => Number.isNaN(n)) ||
    !(drinkFrom <= peakStart && peakStart <= peakEnd && peakEnd <= drinkTo)
  ) {
    return NextResponse.json(
      {
        error:
          "Fenêtre de garde invalide (drinkFrom ≤ peakStart ≤ peakEnd ≤ drinkTo)",
      },
      { status: 400 },
    );
  }

  const location = await prisma.location.findFirst({
    where: { id: locationId, userId },
  });
  if (!location) return notFound();

  const region = await prisma.region.findUnique({ where: { id: regionId } });
  if (!region) {
    return NextResponse.json({ error: "Région introuvable" }, { status: 404 });
  }

  if (appellationId) {
    const app = await prisma.appellation.findUnique({
      where: { id: appellationId },
    });
    if (!app) {
      return NextResponse.json(
        { error: "Appellation introuvable" },
        { status: 404 },
      );
    }
  }

  const purchase = parsePurchaseFields(body);
  const merchantId = await resolveMerchantId(
    userId,
    body.merchantId,
    body.newMerchant,
  );

  const bottle = await prisma.bottle.create({
    data: {
      quantity,
      format: purchase.format,
      purchasePrice: purchase.purchasePrice,
      purchaseDate: purchase.purchaseDate,
      purchaseNotes: purchase.purchaseNotes,
      user: { connect: { id: userId } },
      location: { connect: { id: locationId } },
      ...(merchantId
        ? { merchant: { connect: { id: merchantId } } }
        : {}),
      wine: {
        create: {
          name,
          producer,
          cuvee,
          vintage: vintage != null && !Number.isNaN(vintage) ? vintage : null,
          wineType,
          alcoholAbv:
            alcoholAbv != null && !Number.isNaN(alcoholAbv)
              ? alcoholAbv
              : null,
          drinkFrom,
          peakStart,
          peakEnd,
          drinkTo,
          rating,
          notes: notes || null,
          scaleDouxAcide,
          scaleSecMoelleux,
          scaleSoupleTannique,
          scaleLegerPuissant,
          user: { connect: { id: userId } },
          region: { connect: { id: regionId } },
          ...(appellationId
            ? { appellation: { connect: { id: appellationId } } }
            : {}),
          grapes: grapeIds.length
            ? {
                create: grapeIds.map((grapeId) => ({
                  grape: { connect: { id: grapeId } },
                })),
              }
            : undefined,
        },
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
      merchant: true,
    },
  });

  return NextResponse.json(bottle, { status: 201 });
}
