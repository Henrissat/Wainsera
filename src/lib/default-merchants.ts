import { prisma } from "@/lib/prisma";

export const DEFAULT_MERCHANT_NAMES = [
  "Cave / caviste",
  "Grande distribution",
  "Foire aux vins",
  "Producteur / domaine",
  "Internet",
  "Enchères",
  "Cadeau",
  "Restaurant",
  "Autre",
] as const;

export async function seedMerchantsForUser(userId: string) {
  for (const name of DEFAULT_MERCHANT_NAMES) {
    await prisma.merchant.upsert({
      where: { userId_name: { userId, name } },
      create: { name, userId },
      update: {},
    });
  }
}
