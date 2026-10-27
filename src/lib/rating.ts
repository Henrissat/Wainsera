/** Parse "4,3" ou "4.3" → nombre 0–5, ou null. */
export function parseRatingInput(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const raw = String(value).trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0 || n > 5) return null;
  // Arrondi à 1 décimale pour stocker proprement
  return Math.round(n * 10) / 10;
}

/** Affichage FR : 4,3 */
export function formatRatingValue(rating: number | null | undefined): string {
  if (rating == null) return "—";
  return rating.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

/** Arrondi au demi pour le remplissage des étoiles (4,3 → 4,5). */
export function roundStars(rating: number): number {
  return Math.round(rating * 2) / 2;
}

/** Remplissage 0–1 pour l’étoile d’index 0..4. */
export function starFill(rating: number, index: number): number {
  const r = roundStars(rating);
  return Math.min(1, Math.max(0, r - index));
}
