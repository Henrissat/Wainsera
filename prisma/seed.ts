import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GRAPES = [
  "Merlot",
  "Cabernet Sauvignon",
  "Cabernet Franc",
  "Pinot Noir",
  "Chardonnay",
  "Syrah",
  "Grenache",
  "Sauvignon Blanc",
  "Riesling",
  "Gamay",
  "Mourvèdre",
  "Carignan",
  "Chenin Blanc",
  "Viognier",
  "Malbec",
  "Pinot Gris",
  "Gewurztraminer",
  "Ugni Blanc",
  "Muscat",
  "Tempranillo",
  "Sémillon",
  "Petit Verdot",
  "Cinsault",
  "Clairette",
  "Rolle",
  "Melon de Bourgogne",
  "Poulsard",
  "Trousseau",
  "Savagnin",
];

/** Région → appellations principales */
const REGIONS: Record<string, string[]> = {
  Bordeaux: [
    "Saint-Émilion",
    "Saint-Émilion Grand Cru",
    "Pomerol",
    "Pauillac",
    "Margaux",
    "Saint-Julien",
    "Saint-Estèphe",
    "Médoc",
    "Haut-Médoc",
    "Pessac-Léognan",
    "Sauternes",
    "Barsac",
    "Entre-deux-Mers",
    "Bordeaux",
    "Bordeaux Supérieur",
    "Côtes de Bourg",
    "Blaye Côtes de Bordeaux",
  ],
  Bourgogne: [
    "Chablis",
    "Chablis Premier Cru",
    "Chablis Grand Cru",
    "Côte de Nuits",
    "Gevrey-Chambertin",
    "Vosne-Romanée",
    "Nuits-Saint-Georges",
    "Côte de Beaune",
    "Pommard",
    "Volnay",
    "Meursault",
    "Puligny-Montrachet",
    "Chassagne-Montrachet",
    "Beaune",
    "Mâcon",
    "Pouilly-Fuissé",
    "Bourgogne",
    "Bourgogne Aligoté",
  ],
  "Côtes du Rhône": [
    "Côtes du Rhône",
    "Côtes du Rhône Villages",
    "Châteauneuf-du-Pape",
    "Gigondas",
    "Vacqueyras",
    "Hermitage",
    "Crozes-Hermitage",
    "Côte-Rôtie",
    "Condrieu",
    "Saint-Joseph",
    "Cornas",
    "Tavel",
    "Lirac",
  ],
  Champagne: [
    "Champagne",
    "Champagne Premier Cru",
    "Champagne Grand Cru",
  ],
  Loire: [
    "Sancerre",
    "Pouilly-Fumé",
    "Vouvray",
    "Chinon",
    "Bourgueil",
    "Saumur",
    "Saumur-Champigny",
    "Muscadet Sèvre-et-Maine",
    "Anjou",
    "Touraine",
  ],
  Alsace: [
    "Alsace",
    "Alsace Grand Cru",
    "Crémant d'Alsace",
  ],
  Languedoc: [
    "Languedoc",
    "Minervois",
    "Corbières",
    "Fitou",
    "Faugères",
    "Saint-Chinian",
    "Pic Saint-Loup",
    "Limoux",
  ],
  Provence: [
    "Côtes de Provence",
    "Bandol",
    "Cassis",
    "Palette",
    "Bellet",
  ],
  Beaujolais: [
    "Beaujolais",
    "Beaujolais-Villages",
    "Morgon",
    "Fleurie",
    "Moulin-à-Vent",
    "Juliénas",
    "Chiroubles",
    "Brouilly",
    "Côte de Brouilly",
    "Régnié",
    "Chénas",
    "Saint-Amour",
  ],
  Jura: ["Arbois", "Côtes du Jura", "Château-Chalon", "L'Étoile"],
  Savoie: ["Vin de Savoie", "Roussette de Savoie", "Crépy"],
  "Sud-Ouest": [
    "Madiran",
    "Cahors",
    "Bergerac",
    "Monbazillac",
    "Jurançon",
    "Irouléguy",
    "Gaillac",
  ],
  Autre: [],
};

async function main() {
  for (const name of GRAPES) {
    await prisma.grape.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  for (const [regionName, appellations] of Object.entries(REGIONS)) {
    const region = await prisma.region.upsert({
      where: { name: regionName },
      create: { name: regionName },
      update: {},
    });

    for (const appName of appellations) {
      const existing = await prisma.appellation.findFirst({
        where: { name: appName, regionId: region.id },
      });
      if (!existing) {
        await prisma.appellation.create({
          data: { name: appName, regionId: region.id },
        });
      }
    }
  }

  const MERCHANTS = [
    "Cave / caviste",
    "Grande distribution",
    "Foire aux vins",
    "Producteur / domaine",
    "Internet",
    "Enchères",
    "Cadeau",
    "Restaurant",
    "Autre",
  ];

  for (const name of MERCHANTS) {
    await prisma.merchant.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  console.log(
    `Seed OK : ${GRAPES.length} cépages, ${Object.keys(REGIONS).length} régions, ${MERCHANTS.length} marchands.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
