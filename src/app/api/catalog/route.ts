import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Listes pour les menus déroulants d'ajout */
export async function GET() {
  const [regions, grapes] = await Promise.all([
    prisma.region.findMany({
      orderBy: { name: "asc" },
      include: {
        appellations: { orderBy: { name: "asc" }, select: { id: true, name: true } },
      },
    }),
    prisma.grape.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return NextResponse.json({ regions, grapes });
}
