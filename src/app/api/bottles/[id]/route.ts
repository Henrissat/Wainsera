import { NextResponse } from "next/server";
import { BottleStatus, WineType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parsePurchaseFields, resolveMerchantId } from "@/lib/purchase";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.bottle.findUnique({
    where: { id },
    include: { wine: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Bouteille introuvable" },
      { status: 404 },
    );
  }

  // --- Mise à jour complète de la fiche ---
  if (body.mode === "update") {
    const producer = String(body.producer ?? "").trim();
    const cuvee = body.cuvee ? String(body.cuvee).trim() : null;
    const name = [producer, cuvee].filter(Boolean).join(" — ") || producer;
    const locationId = String(body.locationId ?? "").trim();
    const wineType = (body.wineType as WineType) || existing.wine.wineType;
    const regionId = body.regionId ? String(body.regionId) : null;
    const appellationId = body.appellationId
      ? String(body.appellationId)
      : null;
    const vintage =
      body.vintage === "" || body.vintage == null
        ? null
        : Number(body.vintage);
    const drinkFrom = Number(body.drinkFrom);
    const peakStart = Number(body.peakStart);
    const peakEnd = Number(body.peakEnd);
    const drinkTo = Number(body.drinkTo);
    const alcoholAbv =
      body.alcoholAbv === "" || body.alcoholAbv == null
        ? null
        : Number(body.alcoholAbv);
    const quantity = Math.max(1, parseOptionalInt(body.quantity) ?? 1);
    const grapeIds: string[] = Array.isArray(body.grapeIds)
      ? body.grapeIds.map((g: unknown) => String(g)).filter(Boolean)
      : [];

    if (!producer || !locationId || !regionId) {
      return NextResponse.json(
        { error: "Domaine, emplacement et région obligatoires" },
        { status: 400 },
      );
    }

    if (
      [drinkFrom, peakStart, peakEnd, drinkTo].some((n) => Number.isNaN(n)) ||
      !(drinkFrom <= peakStart && peakStart <= peakEnd && peakEnd <= drinkTo)
    ) {
      return NextResponse.json(
        { error: "Fenêtre de garde invalide" },
        { status: 400 },
      );
    }

    await prisma.wineGrape.deleteMany({ where: { wineId: existing.wineId } });

    const purchase = parsePurchaseFields(body);
    const merchantId = await resolveMerchantId(
      body.merchantId,
      body.newMerchant,
    );

    const bottle = await prisma.bottle.update({
      where: { id },
      data: {
        quantity,
        format: purchase.format,
        purchasePrice: purchase.purchasePrice,
        purchaseDate: purchase.purchaseDate,
        purchaseNotes: purchase.purchaseNotes,
        location: { connect: { id: locationId } },
        merchant: merchantId
          ? { connect: { id: merchantId } }
          : { disconnect: true },
        wine: {
          update: {
            name,
            producer,
            cuvee,
            vintage:
              vintage != null && !Number.isNaN(vintage) ? vintage : null,
            wineType,
            alcoholAbv:
              alcoholAbv != null && !Number.isNaN(alcoholAbv)
                ? alcoholAbv
                : null,
            drinkFrom,
            peakStart,
            peakEnd,
            drinkTo,
            rating: parseRating(body.rating),
            notes: body.notes ? String(body.notes).trim() : null,
            scaleDouxAcide: parseScale(body.scaleDouxAcide),
            scaleSecMoelleux: parseScale(body.scaleSecMoelleux),
            scaleSoupleTannique: parseScale(body.scaleSoupleTannique),
            scaleLegerPuissant: parseScale(body.scaleLegerPuissant),
            region: { connect: { id: regionId } },
            appellation: appellationId
              ? { connect: { id: appellationId } }
              : { disconnect: true },
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

    return NextResponse.json(bottle);
  }

  // --- Quantité seule ---
  if (body.quantity != null && body.status == null) {
    const quantity = Number(body.quantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: "Quantité invalide" },
        { status: 400 },
      );
    }
    if (quantity === 0) {
      return NextResponse.json(
        await prisma.bottle.update({
          where: { id },
          data: { quantity: 0, status: "BUE" },
        }),
      );
    }
    return NextResponse.json(
      await prisma.bottle.update({ where: { id }, data: { quantity } }),
    );
  }

  // --- Statut / consommation ---
  const status = body.status as BottleStatus;
  if (!Object.values(BottleStatus).includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  if (
    body.consumeOne === true &&
    existing.status === "EN_STOCK" &&
    existing.quantity > 1
  ) {
    return NextResponse.json(
      await prisma.bottle.update({
        where: { id },
        data: { quantity: existing.quantity - 1 },
      }),
    );
  }

  return NextResponse.json(
    await prisma.bottle.update({
      where: { id },
      data: {
        status,
        quantity: status === "EN_STOCK" ? existing.quantity : 0,
      },
    }),
  );
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.bottle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Bouteille introuvable" },
      { status: 404 },
    );
  }
}
