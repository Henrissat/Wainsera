import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized } from "@/lib/auth-utils";

/** Créer une appellation manquante (catalogue global, partagé). */
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await request.json();
  const regionId = String(body.regionId ?? "").trim();
  const name = String(body.name ?? "").trim();

  if (!regionId || !name) {
    return NextResponse.json(
      { error: "Région et nom d'appellation obligatoires" },
      { status: 400 },
    );
  }

  if (name.length > 120) {
    return NextResponse.json({ error: "Nom trop long" }, { status: 400 });
  }

  const region = await prisma.region.findUnique({ where: { id: regionId } });
  if (!region) {
    return NextResponse.json({ error: "Région introuvable" }, { status: 404 });
  }

  const existing = await prisma.appellation.findFirst({
    where: {
      regionId,
      name: { equals: name, mode: "insensitive" },
    },
  });
  if (existing) {
    return NextResponse.json(existing);
  }

  const appellation = await prisma.appellation.create({
    data: { name, regionId },
  });

  return NextResponse.json(appellation, { status: 201 });
}
