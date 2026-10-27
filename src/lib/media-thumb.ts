type MediaLike = { url: string; kind: string };

/** Première vignette : étiquette de la bouteille, sinon autre photo, sinon media du vin. */
export function pickThumbnailUrl(
  bottleMedia: MediaLike[] | undefined,
  wineMedia: MediaLike[] | undefined,
): string | null {
  const pool = [...(bottleMedia ?? []), ...(wineMedia ?? [])];
  if (pool.length === 0) return null;
  const etiquette = pool.find((m) => m.kind === "etiquette");
  return (etiquette ?? pool[0]).url;
}
