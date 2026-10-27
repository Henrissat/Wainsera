import type {
  BottleFormat,
  BottleStatus,
  LocationType,
  WineType,
} from "@prisma/client";

export type { BottleFormat, BottleStatus, LocationType, WineType };

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  CAVE: "Cave",
  MAISON: "Maison",
  GRENIER: "Grenier",
  AUTRE: "Autre",
};

export const LOCATION_TYPES = (
  Object.entries(LOCATION_TYPE_LABELS) as [LocationType, string][]
).map(([value, label]) => ({ value, label }));

export const BOTTLE_STATUS_LABELS: Record<BottleStatus, string> = {
  EN_STOCK: "En stock",
  BUE: "Bue",
  OFFERTE: "Offerte",
  PERDUE: "Perdue",
};

export const WINE_TYPE_LABELS: Record<WineType, string> = {
  ROUGE: "Vin rouge",
  BLANC: "Vin blanc",
  ROSE: "Rosé",
  CHAMPAGNE: "Champagne",
  CREMANT: "Crémant",
  AUTRE: "Autre",
};

export const WINE_TYPES = (
  Object.entries(WINE_TYPE_LABELS) as [WineType, string][]
).map(([value, label]) => ({ value, label }));

export const BOTTLE_FORMAT_LABELS: Record<BottleFormat, string> = {
  PICCOLO_20: "Piccolo (20 cl)",
  DEMI_37_5: "Demi-bouteille (37,5 cl)",
  STANDARD_75: "Bouteille (75 cl)",
  LITER_100: "Litre (100 cl)",
  MAGNUM_150: "Magnum (1,5 L)",
  JEROBOAM_300: "Jéroboam (3 L)",
  REHOBOAM_450: "Réhoboam (4,5 L)",
  MATHUSALEM_600: "Mathusalem (6 L)",
  OTHER: "Autre format",
};

export const BOTTLE_FORMATS = (
  Object.entries(BOTTLE_FORMAT_LABELS) as [BottleFormat, string][]
).map(([value, label]) => ({ value, label }));

export function getBottleFormatLabel(format: string): string {
  return BOTTLE_FORMAT_LABELS[format as BottleFormat] ?? format;
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export const PROFILE_SCALES = [
  {
    key: "scaleDouxAcide" as const,
    left: "Doux",
    right: "Acide",
  },
  {
    key: "scaleSecMoelleux" as const,
    left: "Sec",
    right: "Moelleux",
  },
  {
    key: "scaleSoupleTannique" as const,
    left: "Souple",
    right: "Tannique",
  },
  {
    key: "scaleLegerPuissant" as const,
    left: "Léger",
    right: "Puissant",
  },
];

export function getLocationTypeLabel(type: string): string {
  return LOCATION_TYPE_LABELS[type as LocationType] ?? type;
}

export function getWineTypeLabel(type: string): string {
  return WINE_TYPE_LABELS[type as WineType] ?? type;
}

export function formatVintage(vintage: number | null): string {
  return vintage == null ? "NV" : String(vintage);
}

export { formatRatingValue as formatRating } from "./rating";
