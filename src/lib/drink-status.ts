export type DrinkWindowStatus =
  | "TROP_JEUNE"
  | "PRET"
  | "OPTIMUM"
  | "URGENT"
  | "DEPASSE";

export type DrinkWindow = {
  drinkFrom: number;
  peakStart: number;
  peakEnd: number;
  drinkTo: number;
};

/** Statuts les plus urgents en premier (pour tri inventaire / à boire). */
export const DRINK_STATUS_ORDER: Record<DrinkWindowStatus, number> = {
  DEPASSE: 0,
  URGENT: 1,
  OPTIMUM: 2,
  PRET: 3,
  TROP_JEUNE: 4,
};

export const drinkStatusLabel: Record<DrinkWindowStatus, string> = {
  TROP_JEUNE: "Trop jeune",
  PRET: "Prêt à boire",
  OPTIMUM: "Fenêtre optimale",
  URGENT: "À boire bientôt",
  DEPASSE: "Potentiel dépassé",
};

export const drinkStatusDescription: Record<DrinkWindowStatus, string> = {
  TROP_JEUNE: "Encore trop tôt pour ouvrir cette bouteille.",
  PRET: "Elle peut se boire, le pic arrive bientôt.",
  OPTIMUM: "C’est le moment idéal pour la déguster.",
  URGENT: "La fenêtre se referme — à privilégier bientôt.",
  DEPASSE: "Le potentiel de garde est dépassé.",
};

export function drinkStatus(
  wine: DrinkWindow,
  year = new Date().getFullYear(),
): DrinkWindowStatus {
  if (year < wine.drinkFrom) return "TROP_JEUNE";
  if (year < wine.peakStart) return "PRET";
  if (year <= wine.peakEnd) return "OPTIMUM";
  if (year <= wine.drinkTo) return "URGENT";
  return "DEPASSE";
}

export type DrinkStatusInfo = {
  kind: DrinkWindowStatus;
  label: string;
  description: string;
};

/** Alias compatible avec les pages UI (année en premier). */
export function getDrinkStatus(
  year: number,
  wine: DrinkWindow,
): DrinkStatusInfo {
  const kind = drinkStatus(wine, year);
  return {
    kind,
    label: drinkStatusLabel[kind],
    description: drinkStatusDescription[kind],
  };
}

export function formatDrinkWindow(wine: DrinkWindow): string {
  return `${wine.drinkFrom} → pic ${wine.peakStart}–${wine.peakEnd} → limite ${wine.drinkTo}`;
}
