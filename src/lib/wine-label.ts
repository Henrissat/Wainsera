/** Libellé type inventaire : Rouge · Château X · Saint-Émilion · 2019 · Bordeaux · Merlot… */
export function formatWineSummary(wine: {
  name: string;
  producer?: string | null;
  cuvee?: string | null;
  vintage?: number | null;
  wineType?: string;
  region?: { name: string } | null;
  appellation?: { name: string } | null;
  grapes?: { grape: { name: string } }[];
}): string {
  const parts: string[] = [];
  if (wine.wineType) {
    const typeLabels: Record<string, string> = {
      ROUGE: "Vin rouge",
      BLANC: "Vin blanc",
      ROSE: "Rosé",
      CHAMPAGNE: "Champagne",
      CREMANT: "Crémant",
      AUTRE: "Autre",
    };
    parts.push(typeLabels[wine.wineType] ?? wine.wineType);
  }
  parts.push(wine.producer || wine.name);
  if (wine.cuvee) parts.push(wine.cuvee);
  if (wine.appellation?.name) parts.push(wine.appellation.name);
  if (wine.vintage != null) parts.push(String(wine.vintage));
  else parts.push("NV");
  if (wine.region?.name) parts.push(wine.region.name);
  const grapes = wine.grapes?.map((g) => g.grape.name).filter(Boolean);
  if (grapes?.length) parts.push(grapes.join(", "));
  return parts.join(" · ");
}
