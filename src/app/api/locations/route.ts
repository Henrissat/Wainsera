import { NextResponse } from "next/server";
import { LocationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized } from "@/lib/auth-utils";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const locations = await prisma.location.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const type = body.type as LocationType;
  const notes = body.notes ? String(body.notes) : null;

  if (!name) {
    return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
  }

  if (!Object.values(LocationType).includes(type)) {
    return NextResponse.json({ error: "Type d'emplacement invalide" }, { status: 400 });
  }

  const location = await prisma.location.create({
    data: {
      name,
      type,
      notes,
      user: { connect: { id: userId } },
    },
  });

  return NextResponse.json(location, { status: 201 });
}
