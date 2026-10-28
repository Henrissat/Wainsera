import type { BottleFormat, LocationType, WineType } from "@prisma/client";
import { suggestDrinkWindow } from "@/lib/drink-window-defaults";
import { parseRatingInput } from "@/lib/rating";

/** Champs reconnus après normalisation des en-têtes. */
export type ImportField =
  | "producer"
  | "cuvee"
  | "name"
  | "vintage"
  | "wineType"
  | "region"
  | "appellation"
  | "grapes"
  | "alcoholAbv"
  | "quantity"
  | "location"
  | "locationType"
  | "format"
  | "purchasePrice"
  | "purchaseDate"
  | "merchant"
  | "purchaseNotes"
  | "rating"
  | "externalRating"
  | "notes"
  | "profile"
  | "conservation"
  | "drinkFrom"
  | "peakStart"
  | "peakEnd"
  | "drinkTo";

/** Alias FR/EN → champ canonique. L’ordre des colonnes n’importe pas. */
const HEADER_ALIASES: Record<string, ImportField> = {
  // Domaine
  producer: "producer",
  domaine: "producer",
  chateau: "producer",
  chateau_domaine: "producer",
  domaine_chateau: "producer",
  proprietaire: "producer",
  maison: "producer",
  // Cuvée / nom (dans beaucoup d’exports « Cuvee » = nom du vin)
  cuvee: "cuvee",
  cuvee_nom: "cuvee",
  name: "name",
  nom: "name",
  vin: "name",
  // Millésime
  vintage: "vintage",
  millesime: "vintage",
  annee: "vintage",
  // Couleur / type (Rouge, Blanc…) — PAS le profil de dégustation
  winetype: "wineType",
  wine_type: "wineType",
  type: "wineType",
  couleur: "wineType",
  // Région / appellation
  region: "region",
  region_viticole: "region",
  region_pays: "region",
  regionpays: "region",
  pays: "region",
  appellation: "appellation",
  aoc: "appellation",
  aop: "appellation",
  // Cépages
  grapes: "grapes",
  cepages: "grapes",
  cepage: "grapes",
  // Alcool / qty
  alcoholabv: "alcoholAbv",
  alcohol_abv: "alcoholAbv",
  alcool: "alcoholAbv",
  degre: "alcoholAbv",
  abv: "alcoholAbv",
  quantity: "quantity",
  quantite: "quantity",
  qte: "quantity",
  nb: "quantity",
  // Emplacement
  location: "location",
  emplacement: "location",
  rangement: "location",
  cave: "location",
  lieu: "location",
  locationtype: "locationType",
  location_type: "locationType",
  type_emplacement: "locationType",
  // Format / achat
  format: "format",
  contenance: "format",
  purchaseprice: "purchasePrice",
  purchase_price: "purchasePrice",
  prix: "purchasePrice",
  prix_achat: "purchasePrice",
  purchasedate: "purchaseDate",
  purchase_date: "purchaseDate",
  date_achat: "purchaseDate",
  merchant: "merchant",
  marchand: "merchant",
  caviste: "merchant",
  magasin: "merchant",
  purchasenotes: "purchaseNotes",
  purchase_notes: "purchaseNotes",
  note_achat: "purchaseNotes",
  origine: "purchaseNotes",
  // Notes / scores
  rating: "rating",
  note: "rating",
  note_perso: "rating",
  ma_note: "rating",
  externalrating: "externalRating",
  external_rating: "externalRating",
  note_externe: "externalRating",
  note_web: "externalRating",
  avis: "externalRating",
  notes: "notes",
  commentaire: "notes",
  comment: "notes",
  bouche: "notes",
  // Profil dégustation (ex. « Puissant, tannique… ») ≠ type Rouge/Blanc
  profil: "profile",
  profile: "profile",
  type_de_vin: "profile",
  type_vin: "profile",
  // Durée de garde libre (« 8-10 ans »)
  conservation: "conservation",
  garde: "conservation",
  duree_garde: "conservation",
  // Garde (années calendaires)
  drinkfrom: "drinkFrom",
  drink_from: "drinkFrom",
  pret_a_partir: "drinkFrom",
  a_partir_de: "drinkFrom",
  boire_a_partir: "drinkFrom",
  peakstart: "peakStart",
  peak_start: "peakStart",
  debut_pic: "peakStart",
  debut_optimum: "peakStart",
  peakend: "peakEnd",
  peak_end: "peakEnd",
  fin_pic: "peakEnd",
  fin_optimum: "peakEnd",
  drinkto: "drinkTo",
  drink_to: "drinkTo",
  limite: "drinkTo",
  boire_avant: "drinkTo",
};

export const IMPORT_TEMPLATE_HEADERS = [
  "domaine",
  "cuvee",
  "millesime",
  "type",
  "region",
  "appellation",
  "cepages",
  "alcool",
  "quantite",
  "emplacement",
  "type_emplacement",
  "format",
  "prix",
  "date_achat",
  "caviste",
  "note",
  "note_externe",
  "commentaire",
  "a_partir_de",
  "debut_pic",
  "fin_pic",
  "boire_avant",
] as const;

export type RawImportRow = Record<string, string>;

export type MappedImportRow = {
  producer: string;
  cuvee: string | null;
  name: string;
  vintage: number | null;
  wineType: WineType;
  regionName: string;
  appellationName: string | null;
  grapeNames: string[];
  alcoholAbv: number | null;
  quantity: number;
  locationName: string;
  locationType: LocationType;
  format: BottleFormat;
  purchasePrice: number | null;
  purchaseDate: string | null;
  merchantName: string | null;
  purchaseNotes: string | null;
  rating: number | null;
  externalRating: number | null;
  notes: string | null;
  scaleDouxAcide: number | null;
  scaleSecMoelleux: number | null;
  scaleSoupleTannique: number | null;
  scaleLegerPuissant: number | null;
  drinkFrom: number;
  peakStart: number;
  peakEnd: number;
  drinkTo: number;
  drinkWindowAuto: boolean;
};

export type ImportRowIssue = {
  row: number;
  level: "error" | "warning";
  message: string;
};

export type ParsedImportRow = {
  row: number;
  raw: RawImportRow;
  data: MappedImportRow | null;
  errors: string[];
  warnings: string[];
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Normalise un en-tête pour le matching d’alias. */
export function normalizeHeader(header: string): string {
  return stripAccents(String(header ?? ""))
    .toLowerCase()
    .trim()
    .replace(/[%°]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function mapHeaders(headers: string[]): {
  mapping: Partial<Record<ImportField, string>>;
  unknown: string[];
} {
  const mapping: Partial<Record<ImportField, string>> = {};
  const unknown: string[] = [];
  for (const h of headers) {
    if (!String(h ?? "").trim()) continue;
    const key = normalizeHeader(h);
    const field = HEADER_ALIASES[key];
    if (!field) {
      unknown.push(String(h));
      continue;
    }
    if (!mapping[field]) mapping[field] = h;
  }
  return { mapping, unknown };
}

function cell(
  raw: RawImportRow,
  mapping: Partial<Record<ImportField, string>>,
  field: ImportField,
): string {
  const header = mapping[field];
  if (!header) return "";
  const v = raw[header];
  return v == null ? "" : String(v).trim();
}

function parseIntYear(value: string): number | null {
  if (!value) return null;
  const n = Number(String(value).replace(",", ".").replace(/\s/g, ""));
  if (Number.isNaN(n)) return null;
  const y = Math.round(n);
  if (y < 1900 || y > 2100) return null;
  return y;
}

function parsePositiveNumber(value: string): number | null {
  if (!value) return null;
  const n = Number(String(value).replace(",", ".").replace(/\s/g, ""));
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

function parseWineType(value: string): WineType | null {
  if (!value) return null;
  const n = stripAccents(value).toLowerCase().trim();
  if (["rouge", "red"].includes(n)) return "ROUGE";
  if (["blanc", "white"].includes(n)) return "BLANC";
  if (["rose", "pink"].includes(n)) return "ROSE";
  if (n === "champagne") return "CHAMPAGNE";
  if (n === "cremant") return "CREMANT";
  if (["autre", "other"].includes(n)) return "AUTRE";
  const upper = value.toUpperCase().replace(/\s+/g, "_");
  if (
    ["ROUGE", "BLANC", "ROSE", "CHAMPAGNE", "CREMANT", "AUTRE"].includes(upper)
  ) {
    return upper as WineType;
  }
  return null;
}

function parseLocationType(value: string): LocationType {
  const n = stripAccents(value).toLowerCase().trim();
  if (!n) return "CAVE";
  if (n.includes("maison") || n === "home") return "MAISON";
  if (n.includes("grenier") || n.includes("attic")) return "GRENIER";
  if (n.includes("cave") || n.includes("cellar")) return "CAVE";
  if (["CAVE", "MAISON", "GRENIER", "AUTRE"].includes(value.toUpperCase())) {
    return value.toUpperCase() as LocationType;
  }
  return "AUTRE";
}

function parseFormat(value: string): BottleFormat {
  const n = stripAccents(value).toLowerCase().replace(/\s+/g, "");
  if (!n) return "STANDARD_75";
  if (n.includes("piccolo") || n.includes("20")) return "PICCOLO_20";
  if (n.includes("demi") || n.includes("37")) return "DEMI_37_5";
  if (n.includes("magnum") || n.includes("1,5") || n.includes("1.5") || n.includes("150"))
    return "MAGNUM_150";
  if (n.includes("jeroboam") || n.includes("3l") || n.includes("300"))
    return "JEROBOAM_300";
  if (n.includes("rehoboam") || n.includes("4,5") || n.includes("450"))
    return "REHOBOAM_450";
  if (n.includes("mathusalem") || n.includes("6l") || n.includes("600"))
    return "MATHUSALEM_600";
  if (n.includes("litre") || n.includes("100")) return "LITER_100";
  if (n.includes("75") || n.includes("standard") || n.includes("bouteille"))
    return "STANDARD_75";
  const upper = value.toUpperCase().replace(/\s+/g, "_");
  const allowed: BottleFormat[] = [
    "PICCOLO_20",
    "DEMI_37_5",
    "STANDARD_75",
    "LITER_100",
    "MAGNUM_150",
    "JEROBOAM_300",
    "REHOBOAM_450",
    "MATHUSALEM_600",
    "OTHER",
  ];
  if (allowed.includes(upper as BottleFormat)) return upper as BottleFormat;
  return "OTHER";
}

function parseDateIso(value: string): string | null {
  if (!value) return null;
  const raw = value.trim();
  // Excel serial date (approx)
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 20000 && serial < 80000) {
      const utc = Date.UTC(1899, 11, 30) + serial * 86400000;
      const d = new Date(utc);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  // JJ/MM/AAAA
  const fr = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (fr) {
    const day = Number(fr[1]);
    const month = Number(fr[2]);
    let year = Number(fr[3]);
    if (year < 100) year += 2000;
    const d = new Date(Date.UTC(year, month - 1, day));
    if (
      d.getUTCFullYear() === year &&
      d.getUTCMonth() === month - 1 &&
      d.getUTCDate() === day
    ) {
      return d.toISOString().slice(0, 10);
    }
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function splitGrapes(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[,;/|]+/)
    .map((g) => g.trim())
    .filter((g) => g && !/^assemblage$/i.test(g));
}

/** « 8-10 ans », « 5 à 8 ans », « 12 ans » → borne max (et min si plage). */
export function parseConservationYears(
  value: string,
): { min: number; max: number } | null {
  const raw = stripAccents(value).toLowerCase();
  if (!raw.trim()) return null;
  const range = raw.match(/(\d+)\s*(?:-|–|a|à|\/)\s*(\d+)/);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }
  const single = raw.match(/(\d+)\s*ans?/);
  if (single) {
    const n = Number(single[1]);
    if (!Number.isNaN(n) && n > 0) return { min: Math.max(1, n - 2), max: n };
  }
  return null;
}

/** Profil libre → échelles 1–5 (best effort). */
export function parseProfileScales(value: string): {
  scaleDouxAcide: number | null;
  scaleSecMoelleux: number | null;
  scaleSoupleTannique: number | null;
  scaleLegerPuissant: number | null;
} {
  const n = stripAccents(value).toLowerCase();
  if (!n.trim()) {
    return {
      scaleDouxAcide: null,
      scaleSecMoelleux: null,
      scaleSoupleTannique: null,
      scaleLegerPuissant: null,
    };
  }

  let scaleLegerPuissant: number | null = null;
  if (n.includes("puissant")) scaleLegerPuissant = 5;
  else if (n.includes("leger")) scaleLegerPuissant = 2;
  else if (n.includes("equilibre") && n.includes("puissant"))
    scaleLegerPuissant = 3;

  let scaleSoupleTannique: number | null = null;
  if (n.includes("tannique") || n.includes("tanique")) scaleSoupleTannique = 5;
  else if (n.includes("souple")) scaleSoupleTannique = 2;

  let scaleSecMoelleux: number | null = null;
  if (n.includes("moelleux") || n.includes("doux")) scaleSecMoelleux = 4;
  else if (n.includes("sec")) scaleSecMoelleux = 1;

  let scaleDouxAcide: number | null = null;
  if (n.includes("acide")) scaleDouxAcide = 5;
  else if (n.includes("doux") && !n.includes("moelleux")) scaleDouxAcide = 2;

  // « équilibré doux/acide » → milieu
  if (n.includes("equilibre") && n.includes("doux") && n.includes("acide")) {
    scaleDouxAcide = 3;
  }

  return {
    scaleDouxAcide,
    scaleSecMoelleux,
    scaleSoupleTannique,
    scaleLegerPuissant,
  };
}

/**
 * Normalise « Bordeaux / Médoc », « Languedoc-Roussillon », pays étrangers
 * vers un nom de région catalogue.
 */
export function canonicalizeRegionName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return cleaned;
  const first = cleaned.split("/")[0]?.trim() ?? cleaned;
  const n = stripAccents(first).toLowerCase();

  const aliases: [RegExp, string][] = [
    [/languedoc/, "Languedoc"],
    [/roussillon/, "Roussillon"],
    [/bordeaux/, "Bordeaux"],
    [/bourgogne|beaune|nuits/, "Bourgogne"],
    [/beaujolais/, "Beaujolais"],
    [/rhone/, "Côtes du Rhône"],
    [/loire|sancerre|chinon|saumur/, "Loire"],
    [/alsace/, "Alsace"],
    [/champagne/, "Champagne"],
    [/provence|bandol|bellet/, "Provence"],
    [/jura/, "Jura"],
    [/savoie/, "Savoie"],
    [/corse/, "Corse"],
    [/sud[- ]?ouest|gascogne|cahors|madiran|saint-sardos|fronton/, "Sud-Ouest"],
    [/espagne|spain|ribera|rioja|ribera del duero/, "Autre"],
    [/italie|italy|toscane|piemont/, "Autre"],
    [/portugal|douro/, "Autre"],
    [/usa|californie|napa/, "Autre"],
    [/hongrie|kekfrankos|tokaj/, "Autre"],
  ];

  for (const [re, name] of aliases) {
    if (re.test(n) || re.test(stripAccents(cleaned).toLowerCase())) return name;
  }
  return first;
}

export function mapRawRow(
  raw: RawImportRow,
  mapping: Partial<Record<ImportField, string>>,
  rowNumber: number,
  defaults?: { locationName?: string },
): ParsedImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  const producerRaw = cell(raw, mapping, "producer");
  const cuveeRaw = cell(raw, mapping, "cuvee");
  const nameRaw = cell(raw, mapping, "name");
  // Beaucoup de fichiers n’ont que « Cuvee » (= nom du vin / château)
  const producer = producerRaw || cuveeRaw || nameRaw;
  const cuvee =
    producerRaw && cuveeRaw && producerRaw !== cuveeRaw ? cuveeRaw : null;
  if (!producerRaw && cuveeRaw) {
    warnings.push("Pas de domaine : la colonne cuvée sert de nom / domaine");
  }

  const regionRaw = cell(raw, mapping, "region");
  const regionName = regionRaw ? canonicalizeRegionName(regionRaw) : "";
  if (regionRaw && regionName !== regionRaw.split("/")[0]?.trim()) {
    warnings.push(`Région « ${regionRaw} » → « ${regionName} »`);
  }

  const locationName =
    cell(raw, mapping, "location") || defaults?.locationName?.trim() || "";

  if (!producer) errors.push("Domaine / château / cuvée manquant");
  if (!regionName) errors.push("Région manquante");
  if (!locationName) errors.push("Emplacement manquant");

  const vintage = parseIntYear(cell(raw, mapping, "vintage"));
  if (cell(raw, mapping, "vintage") && vintage == null) {
    errors.push("Millésime invalide");
  }

  const wineTypeParsed = parseWineType(cell(raw, mapping, "wineType"));
  if (cell(raw, mapping, "wineType") && !wineTypeParsed) {
    warnings.push(
      `Couleur / type non reconnu (« ${cell(raw, mapping, "wineType")} ») → Rouge`,
    );
  }
  const wineType: WineType = wineTypeParsed ?? "ROUGE";

  const profileRaw = cell(raw, mapping, "profile");
  const scales = parseProfileScales(profileRaw);

  let drinkFrom = parseIntYear(cell(raw, mapping, "drinkFrom"));
  let peakStart = parseIntYear(cell(raw, mapping, "peakStart"));
  let peakEnd = parseIntYear(cell(raw, mapping, "peakEnd"));
  let drinkTo = parseIntYear(cell(raw, mapping, "drinkTo"));
  let drinkWindowAuto = false;

  const conservation = parseConservationYears(
    cell(raw, mapping, "conservation"),
  );

  const hasAnyWindow =
    drinkFrom != null || peakStart != null || peakEnd != null || drinkTo != null;
  const hasFullWindow =
    drinkFrom != null && peakStart != null && peakEnd != null && drinkTo != null;

  if (!hasFullWindow) {
    if (vintage != null) {
      const suggestion = suggestDrinkWindow({
        vintage,
        wineType,
        regionName,
        appellationName: cell(raw, mapping, "appellation") || null,
      });
      drinkFrom = drinkFrom ?? suggestion.drinkFrom;
      peakStart = peakStart ?? suggestion.peakStart;
      peakEnd = peakEnd ?? suggestion.peakEnd;
      drinkTo = drinkTo ?? suggestion.drinkTo;
      drinkWindowAuto = true;

      if (conservation) {
        drinkFrom = vintage + Math.max(0, conservation.min - 2);
        peakStart = vintage + conservation.min;
        peakEnd = vintage + Math.max(conservation.min, conservation.max - 1);
        drinkTo = vintage + conservation.max;
        warnings.push(
          `Garde d’après conservation « ${cell(raw, mapping, "conservation")} »`,
        );
      } else if (hasAnyWindow) {
        warnings.push("Fenêtre de garde complétée automatiquement");
      } else {
        warnings.push(`Garde estimée : ${suggestion.label}`);
      }
    } else if (hasAnyWindow) {
      errors.push(
        "Fenêtre de garde incomplète (fournis les 4 années ou un millésime)",
      );
    } else {
      errors.push("Millésime ou fenêtre de garde requis");
    }
  }

  if (
    drinkFrom != null &&
    peakStart != null &&
    peakEnd != null &&
    drinkTo != null &&
    !(drinkFrom <= peakStart && peakStart <= peakEnd && peakEnd <= drinkTo)
  ) {
    errors.push("Ordre de garde invalide (prêt ≤ pic ≤ fin pic ≤ limite)");
  }

  const alcoholAbv = parsePositiveNumber(cell(raw, mapping, "alcoholAbv"));
  if (cell(raw, mapping, "alcoholAbv") && alcoholAbv == null) {
    warnings.push("Degré d’alcool ignoré (invalide)");
  }
  if (alcoholAbv != null && alcoholAbv > 30) {
    warnings.push("Degré d’alcool suspect (> 30 %) — ignoré");
  }

  const qtyRaw = cell(raw, mapping, "quantity");
  let quantity = 1;
  if (qtyRaw) {
    const q = Number(String(qtyRaw).replace(",", "."));
    if (Number.isNaN(q) || q < 1) {
      warnings.push("Quantité invalide → 1");
    } else {
      quantity = Math.min(999, Math.round(q));
    }
  }

  const purchasePrice = parsePositiveNumber(cell(raw, mapping, "purchasePrice"));
  const purchaseDateRaw = cell(raw, mapping, "purchaseDate");
  const purchaseDate = parseDateIso(purchaseDateRaw);
  if (purchaseDateRaw && !purchaseDate) {
    warnings.push("Date d’achat non reconnue — ignorée");
  }

  const rating = parseRatingInput(cell(raw, mapping, "rating"));
  if (cell(raw, mapping, "rating") && rating == null) {
    warnings.push("Note personnelle ignorée (0–5 attendu)");
  }
  const externalRating = parseRatingInput(cell(raw, mapping, "externalRating"));
  if (cell(raw, mapping, "externalRating") && externalRating == null) {
    warnings.push("Note externe ignorée (0–5 attendu)");
  }

  const noteParts = [
    cell(raw, mapping, "notes"),
    profileRaw ? `Profil : ${profileRaw}` : "",
  ].filter(Boolean);
  const notes = noteParts.length ? noteParts.join("\n") : null;

  const name =
    nameRaw ||
    [producer, cuvee].filter(Boolean).join(" — ") ||
    producer;

  if (errors.length) {
    return { row: rowNumber, raw, data: null, errors, warnings };
  }

  const data: MappedImportRow = {
    producer,
    cuvee,
    name,
    vintage,
    wineType,
    regionName,
    appellationName: cell(raw, mapping, "appellation") || null,
    grapeNames: splitGrapes(cell(raw, mapping, "grapes")),
    alcoholAbv:
      alcoholAbv != null && alcoholAbv <= 30 ? alcoholAbv : null,
    quantity,
    locationName,
    locationType: parseLocationType(cell(raw, mapping, "locationType")),
    format: parseFormat(cell(raw, mapping, "format")),
    purchasePrice,
    purchaseDate,
    merchantName: cell(raw, mapping, "merchant") || null,
    purchaseNotes: cell(raw, mapping, "purchaseNotes") || null,
    rating,
    externalRating,
    notes,
    scaleDouxAcide: scales.scaleDouxAcide,
    scaleSecMoelleux: scales.scaleSecMoelleux,
    scaleSoupleTannique: scales.scaleSoupleTannique,
    scaleLegerPuissant: scales.scaleLegerPuissant,
    drinkFrom: drinkFrom!,
    peakStart: peakStart!,
    peakEnd: peakEnd!,
    drinkTo: drinkTo!,
    drinkWindowAuto,
  };

  return { row: rowNumber, raw, data, errors, warnings };
}

export function parseSheetMatrix(
  matrix: unknown[][],
): { headers: string[]; rows: RawImportRow[] } {
  if (!matrix.length) return { headers: [], rows: [] };
  const headerRow = (matrix[0] ?? []).map((h) =>
    h == null ? "" : String(h).trim(),
  );

  const rows: RawImportRow[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r] ?? [];
    const raw: RawImportRow = {};
    let empty = true;
    for (let c = 0; c < headerRow.length; c++) {
      const header = headerRow[c];
      if (!header) continue;
      const val = line[c];
      const str =
        val == null || val === ""
          ? ""
          : typeof val === "number"
            ? String(val)
            : String(val).trim();
      raw[header] = str;
      if (str) empty = false;
    }
    if (!empty) rows.push(raw);
  }

  return {
    headers: headerRow.filter(Boolean),
    rows,
  };
}

export function buildCsvTemplate(): string {
  const headers = IMPORT_TEMPLATE_HEADERS.join(";");
  const example = [
    "Château Exemple",
    "Cuvée Réserve",
    "2018",
    "Rouge",
    "Bordeaux",
    "Pauillac",
    "Cabernet Sauvignon, Merlot",
    "13,5",
    "2",
    "Cave principale",
    "Cave",
    "75 cl",
    "45",
    "15/06/2022",
    "Ma cave préférée",
    "4,5",
    "4",
    "",
    "",
    "",
    "",
    "",
  ].join(";");
  return `${headers}\n${example}\n`;
}
