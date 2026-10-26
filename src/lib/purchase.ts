import { BottleFormat } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function resolveMerchantId(
  merchantId: unknown,
  newMerchantName: unknown,
): Promise<string | null> {
  const existing = merchantId ? String(merchantId).trim() : "";
  if (existing) return existing;

  const name = newMerchantName ? String(newMerchantName).trim() : "";
  if (!name) return null;

  const merchant = await prisma.merchant.upsert({
    where: { name },
    create: { name },
    update: {},
  });
  return merchant.id;
}

export function parsePurchaseFields(body: Record<string, unknown>) {
  const format = (body.format as BottleFormat) || BottleFormat.STANDARD_75;
  const purchasePrice =
    body.purchasePrice === "" || body.purchasePrice == null
      ? null
      : Number(body.purchasePrice);
  const purchaseDateRaw = body.purchaseDate
    ? String(body.purchaseDate).trim()
    : "";
  const purchaseDate = purchaseDateRaw
    ? new Date(purchaseDateRaw)
    : null;
  const purchaseNotes = body.purchaseNotes
    ? String(body.purchaseNotes).trim()
    : null;

  return {
    format: Object.values(BottleFormat).includes(format)
      ? format
      : BottleFormat.STANDARD_75,
    purchasePrice:
      purchasePrice != null && !Number.isNaN(purchasePrice) && purchasePrice >= 0
        ? purchasePrice
        : null,
    purchaseDate:
      purchaseDate && !Number.isNaN(purchaseDate.getTime())
        ? purchaseDate
        : null,
    purchaseNotes: purchaseNotes || null,
  };
}
