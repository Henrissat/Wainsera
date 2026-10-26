/**
 * Suggestions de fenêtre de garde (années depuis le millésime).
 * L’utilisateur peut toujours modifier les valeurs dans le formulaire.
 *
 * drinkFrom  = vintage + readyFrom   (début « prêt »)
 * peakStart  = vintage + peakFrom    (début optimum)
 * peakEnd    = vintage + peakTo      (fin optimum)
 * drinkTo    = vintage + limitTo     (limite)
 */

export type AgingOffsets = {
  readyFrom: number;
  peakFrom: number;
  peakTo: number;
  limitTo: number;
  label: string;
};

export type DrinkWindowSuggestion = {
  drinkFrom: number;
  peakStart: number;
  peakEnd: number;
  drinkTo: number;
  label: string;
};

function offsets(
  readyFrom: number,
  peakFrom: number,
  peakTo: number,
  limitTo: number,
  label: string,
): AgingOffsets {
  return { readyFrom, peakFrom, peakTo, limitTo, label };
}

/** Appellations / mots-clés → garde longue (grands crus, etc.) */
const LONG_AGE_KEYWORDS = [
  "grand cru classé",
  "grand cru",
  "premier cru",
  "1er cru",
  "premier grand cru",
  "pomerol",
  "pauillac",
  "margaux",
  "saint-julien",
  "saint-estèphe",
  "pessac-léognan",
  "hermitage",
  "côte-rôtie",
  "châteauneuf-du-pape",
  "romanée",
  "chambertin",
  "montrachet",
  "sauternes",
];

const MEDIUM_BORDEAUX_KEYWORDS = [
  "bordeaux supérieur",
  "saint-émilion",
  "saint emilion",
  "médoc",
  "haut-médoc",
  "côtes de bourg",
  "blaye",
  "fronsac",
];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Choisit une grille de garde selon type / région / appellation.
 */
export function resolveAgingOffsets(input: {
  wineType?: string;
  regionName?: string | null;
  appellationName?: string | null;
}): AgingOffsets {
  const type = input.wineType ?? "ROUGE";
  const region = normalize(input.regionName ?? "");
  const appellation = normalize(input.appellationName ?? "");
  const combined = `${region} ${appellation}`;

  // Effervescents : boire assez jeune en général
  if (type === "CHAMPAGNE" || type === "CREMANT") {
    if (includesAny(appellation, ["grand cru", "premier cru", "prestige"])) {
      return offsets(3, 5, 12, 18, "Champagne / crémant de garde");
    }
    return offsets(1, 2, 5, 8, "Champagne / crémant (boire plutôt jeune)");
  }

  // Rosés : courts
  if (type === "ROSE") {
    return offsets(0, 0, 2, 3, "Rosé (fenêtre courte)");
  }

  // Blancs
  if (type === "BLANC") {
    if (includesAny(combined, ["sauternes", "barsac", "monbazillac", "jurançon"])) {
      return offsets(5, 8, 20, 30, "Blanc liquoreux (longue garde)");
    }
    if (includesAny(combined, ["montrachet", "meursault", "puligny", "chablis grand"])) {
      return offsets(3, 5, 12, 18, "Grand blanc de Bourgogne");
    }
    if (region.includes("bourgogne") || region.includes("loire") || region.includes("alsace")) {
      return offsets(1, 2, 6, 10, "Blanc classique");
    }
    return offsets(0, 1, 4, 6, "Blanc (boire assez jeune)");
  }

  // ——— Rouges ———

  // Bordeaux
  if (region.includes("bordeaux") || includesAny(combined, ["bordeaux", "saint-emilion", "pomerol", "medoc", "margaux", "pauillac"])) {
    if (includesAny(appellation, LONG_AGE_KEYWORDS) || includesAny(combined, ["grand cru classe", "premier grand cru"])) {
      // Grands crus : 15–20 ans+ (souvent jusqu’à 30 pour les meilleurs)
      return offsets(8, 15, 25, 35, "Grand cru bordelais (15–30 ans+)");
    }
    if (
      includesAny(appellation, MEDIUM_BORDEAUX_KEYWORDS) ||
      includesAny(appellation, ["saint-emilion"]) ||
      appellation.includes("saint-emilion grand cru")
    ) {
      // Saint-Émilion / bons Bordeaux : 5–15 ans
      if (appellation.includes("grand cru")) {
        return offsets(8, 15, 25, 32, "Saint-Émilion Grand Cru / GCC (15–30 ans)");
      }
      return offsets(5, 7, 15, 20, "Saint-Émilion / bon Bordeaux (5–15 ans)");
    }
    if (appellation.includes("bordeaux superieur") || appellation.includes("bordeaux supérieur")) {
      return offsets(5, 7, 15, 18, "Bordeaux Supérieur (5–15 ans)");
    }
    // Cuvées classiques Bordeaux : 2–6 ans
    return offsets(2, 3, 6, 8, "Bordeaux classique (2–6 ans)");
  }

  // Bourgogne rouge
  if (region.includes("bourgogne") || region.includes("beaujolais")) {
    if (region.includes("beaujolais") && !includesAny(appellation, ["moulin", "morgon", "fleurie"])) {
      return offsets(0, 0, 3, 5, "Beaujolais (plutôt jeune)");
    }
    if (includesAny(appellation, LONG_AGE_KEYWORDS)) {
      return offsets(5, 8, 18, 25, "Grand cru / 1er cru de Bourgogne");
    }
    return offsets(2, 4, 10, 14, "Bourgogne rouge");
  }

  // Rhône
  if (region.includes("rhone") || region.includes("rhône")) {
    if (includesAny(appellation, ["hermitage", "cote-rotie", "chateauneuf"])) {
      return offsets(5, 8, 18, 25, "Grand Rhône de garde");
    }
    return offsets(2, 4, 10, 14, "Côtes du Rhône");
  }

  // Languedoc / Provence / Sud-Ouest
  if (
    region.includes("languedoc") ||
    region.includes("provence") ||
    region.includes("sud-ouest") ||
    region.includes("cahors") ||
    region.includes("madiran")
  ) {
    if (includesAny(appellation, ["madiran", "cahors", "bandol"])) {
      return offsets(4, 6, 15, 20, "Sud-Ouest / Bandol de garde");
    }
    return offsets(1, 2, 6, 10, "Sud / Languedoc");
  }

  // Loire rouge
  if (region.includes("loire")) {
    return offsets(2, 3, 8, 12, "Loire rouge");
  }

  // Défaut rouge
  return offsets(2, 3, 8, 12, "Rouge (estimation générique)");
}

export function suggestDrinkWindow(input: {
  vintage: number;
  wineType?: string;
  regionName?: string | null;
  appellationName?: string | null;
}): DrinkWindowSuggestion {
  const o = resolveAgingOffsets(input);
  return {
    drinkFrom: input.vintage + o.readyFrom,
    peakStart: input.vintage + o.peakFrom,
    peakEnd: input.vintage + o.peakTo,
    drinkTo: input.vintage + o.limitTo,
    label: o.label,
  };
}
