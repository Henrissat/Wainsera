import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, notFound } from "@/lib/auth-utils";

const KINDS = ["etiquette", "bouteille", "autre"] as const;

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await request.json();
  const url = String(body.url ?? "").trim();
  const kind = String(body.kind ?? "etiquette").trim().toLowerCase();
  const bottleId = body.bottleId ? String(body.bottleId) : null;
  const wineId = body.wineId ? String(body.wineId) : null;

  if (!url || !isValidHttpUrl(url)) {
    return NextResponse.json(
      { error: "URL invalide (http ou https requis)" },
      { status: 400 },
    );
  }

  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    return NextResponse.json({ error: "Type de photo invalide" }, { status: 400 });
  }

  if (!bottleId && !wineId) {
    return NextResponse.json(
      { error: "bottleId ou wineId requis" },
      { status: 400 },
    );
  }

  if (bottleId) {
    const bottle = await prisma.bottle.findFirst({
      where: { id: bottleId, userId },
    });
    if (!bottle) return notFound();
  }

  if (wineId) {
    const wine = await prisma.wine.findFirst({
      where: { id: wineId, userId },
    });
    if (!wine) return notFound();
  }

  const media = await prisma.media.create({
    data: {
      url,
      kind,
      bottleId,
      wineId: wineId ?? undefined,
    },
  });

  return NextResponse.json(media, { status: 201 });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const media = await prisma.media.findFirst({
    where: {
      id,
      OR: [
        { bottle: { userId } },
        { wine: { userId } },
      ],
    },
  });
  if (!media) return notFound();

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
