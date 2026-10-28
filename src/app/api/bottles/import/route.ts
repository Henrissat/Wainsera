import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized } from "@/lib/auth-utils";
import {
  mapHeaders,
  mapRawRow,
  type MappedImportRow,
  type RawImportRow,
} from "@/lib/import-bottles";
import { resolveMerchantId } from "@/lib/purchase";

export const runtime = "nodejs";

type Body = {
  mode?: "preview" | "commit";
  headers?: string[];
  rows?: RawImportRow[];
  defaultLocation?: string;
};

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function resolveRegionId(
  regionName: string,
  cache: Map<string, string | null>,
): Promise<string | null> {
  const key = normalizeName(regionName);
  if (cache.has(key)) return cache.get(key)!;

  const regions = await prisma.region.findMany({ select: { id: true, name: true } });
  const hit =
    regions.find((r) => normalizeName(r.name) === key) ??
    regions.find((r) => normalizeName(r.name).includes(key) || key.includes(normalizeName(r.name)));
  const id = hit?.id ?? null;
  cache.set(key, id);
  return id;
}

async function resolveAppellationId(
  appellationName: string | null,
  regionId: string | null,
  cache: Map<string, string | null>,
): Promise<string | null> {
  if (!appellationName) return null;
  const key = `${regionId ?? ""}::${normalizeName(appellationName)}`;
  if (cache.has(key)) return cache.get(key)!;

  const apps = await prisma.appellation.findMany({
    where: regionId ? { OR: [{ regionId }, { regionId: null }] } : undefined,
    select: { id: true, name: true, regionId: true },
  });
  const target = normalizeName(appellationName);
  const exact =
    apps.find(
      (a) => normalizeName(a.name) === target && a.regionId === regionId,
    ) ?? apps.find((a) => normalizeName(a.name) === target);
  const id = exact?.id ?? null;
  cache.set(key, id);
  return id;
}

async function resolveLocationId(
  userId: string,
  name: string,
  type: MappedImportRow["locationType"],
  cache: Map<string, string>,
  created: string[],
): Promise<string> {
  const key = normalizeName(name);
  if (cache.has(key)) return cache.get(key)!;

  const existing = await prisma.location.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    cache.set(key, existing.id);
    return existing.id;
  }

  const loc = await prisma.location.create({
    data: { name, type, userId },
  });
  created.push(name);
  cache.set(key, loc.id);
  return loc.id;
}

async function findGrapeIdFlexible(
  name: string,
  cache: Map<string, string>,
): Promise<string> {
  const key = normalizeName(name);
  if (cache.has(key)) return cache.get(key)!;

  const all = await prisma.grape.findMany({ select: { id: true, name: true } });
  const hit = all.find((g) => normalizeName(g.name) === key);
  if (hit) {
    cache.set(key, hit.id);
    return hit.id;
  }

  const created = await prisma.grape.create({ data: { name } });
  cache.set(key, created.id);
  return created.id;
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const mode = body.mode === "commit" ? "commit" : "preview";
  const headers = Array.isArray(body.headers) ? body.headers.map(String) : [];
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const defaultLocation = body.defaultLocation
    ? String(body.defaultLocation).trim()
    : "";

  if (!rows.length) {
    return NextResponse.json(
      { error: "Aucune ligne à importer" },
      { status: 400 },
    );
  }
  if (rows.length > 500) {
    return NextResponse.json(
      { error: "Maximum 500 lignes par import" },
      { status: 400 },
    );
  }

  const { mapping, unknown } = mapHeaders(
    headers.length
      ? headers
      : Object.keys(rows[0] ?? {}),
  );

  if (!mapping.producer || !mapping.region) {
    return NextResponse.json(
      {
        error:
          "Colonnes obligatoires manquantes : domaine (ou château) et région. Vérifie les en-têtes.",
        unknownHeaders: unknown,
        mapping,
      },
      { status: 400 },
    );
  }

  const parsed = rows.map((raw, i) =>
    mapRawRow(raw, mapping, i + 2, { locationName: defaultLocation }),
  );

  const regionCache = new Map<string, string | null>();
  const appellationCache = new Map<string, string | null>();
  const grapeCache = new Map<string, string>();

  // Enrichit avec résolution catalogue (preview + commit)
  const enriched = [];
  for (const p of parsed) {
    if (!p.data) {
      enriched.push({
        ...p,
        regionId: null as string | null,
        appellationId: null as string | null,
      });
      continue;
    }

    const regionId = await resolveRegionId(p.data.regionName, regionCache);
    if (!regionId) {
      p.errors.push(`Région introuvable : « ${p.data.regionName} »`);
      enriched.push({ ...p, data: null, regionId: null, appellationId: null });
      continue;
    }

    const appellationId = await resolveAppellationId(
      p.data.appellationName,
      regionId,
      appellationCache,
    );
    if (p.data.appellationName && !appellationId) {
      p.warnings.push(
        `Appellation « ${p.data.appellationName} » non trouvée — ignorée`,
      );
    }

    enriched.push({ ...p, regionId, appellationId });
  }

  const valid = enriched.filter((r) => r.data && r.errors.length === 0);
  const invalid = enriched.filter((r) => !r.data || r.errors.length > 0);

  if (mode === "preview") {
    return NextResponse.json({
      mode: "preview",
      mapping,
      unknownHeaders: unknown,
      total: enriched.length,
      validCount: valid.length,
      errorCount: invalid.length,
      rows: enriched.map((r) => ({
        row: r.row,
        errors: r.errors,
        warnings: r.warnings,
        summary: r.data
          ? {
              producer: r.data.producer,
              cuvee: r.data.cuvee,
              vintage: r.data.vintage,
              region: r.data.regionName,
              location: r.data.locationName,
              quantity: r.data.quantity,
              drinkWindowAuto: r.data.drinkWindowAuto,
            }
          : null,
      })),
    });
  }

  if (valid.length === 0) {
    return NextResponse.json(
      {
        error: "Aucune ligne valide à importer",
        errorCount: invalid.length,
        rows: invalid.map((r) => ({
          row: r.row,
          errors: r.errors,
          warnings: r.warnings,
        })),
      },
      { status: 400 },
    );
  }

  const locationCache = new Map<string, string>();
  const createdLocations: string[] = [];
  let imported = 0;
  const failures: { row: number; message: string }[] = [];

  for (const item of valid) {
    const data = item.data!;
    try {
      const locationId = await resolveLocationId(
        userId,
        data.locationName,
        data.locationType,
        locationCache,
        createdLocations,
      );

      const grapeIds: string[] = [];
      for (const g of data.grapeNames) {
        grapeIds.push(await findGrapeIdFlexible(g, grapeCache));
      }

      const merchantId = await resolveMerchantId(
        userId,
        null,
        data.merchantName,
      );

      const purchaseDate = data.purchaseDate
        ? new Date(data.purchaseDate)
        : null;

      await prisma.bottle.create({
        data: {
          quantity: data.quantity,
          format: data.format,
          purchasePrice: data.purchasePrice,
          purchaseDate:
            purchaseDate && !Number.isNaN(purchaseDate.getTime())
              ? purchaseDate
              : null,
          purchaseNotes: data.purchaseNotes,
          user: { connect: { id: userId } },
          location: { connect: { id: locationId } },
          ...(merchantId
            ? { merchant: { connect: { id: merchantId } } }
            : {}),
          wine: {
            create: {
              name: data.name,
              producer: data.producer,
              cuvee: data.cuvee,
              vintage: data.vintage,
              wineType: data.wineType,
              alcoholAbv: data.alcoholAbv,
              drinkFrom: data.drinkFrom,
              peakStart: data.peakStart,
              peakEnd: data.peakEnd,
              drinkTo: data.drinkTo,
              rating: data.rating,
              externalRating: data.externalRating,
              notes: data.notes,
              scaleDouxAcide: data.scaleDouxAcide,
              scaleSecMoelleux: data.scaleSecMoelleux,
              scaleSoupleTannique: data.scaleSoupleTannique,
              scaleLegerPuissant: data.scaleLegerPuissant,
              user: { connect: { id: userId } },
              region: { connect: { id: item.regionId! } },
              ...(item.appellationId
                ? { appellation: { connect: { id: item.appellationId } } }
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
      });
      imported += 1;
    } catch (e) {
      failures.push({
        row: item.row,
        message: e instanceof Error ? e.message : "Erreur à l’import",
      });
    }
  }

  return NextResponse.json({
    mode: "commit",
    imported,
    skipped: invalid.length + failures.length,
    createdLocations,
    failures,
    errorRows: invalid.map((r) => ({
      row: r.row,
      errors: r.errors,
    })),
  });
}
