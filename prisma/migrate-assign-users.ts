/**
 * Migration one-shot : crée l’admin et rattache les données orphelines.
 * Usage : npm run db:migrate-users
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_MERCHANTS = [
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

async function main() {
  const email = (process.env.AUTH_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.AUTH_ADMIN_PASSWORD ?? "";
  if (!email || !password) {
    throw new Error(
      "AUTH_ADMIN_EMAIL et AUTH_ADMIN_PASSWORD requis dans .env",
    );
  }

  const passwordHash = await hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    create: { email, name: "Admin", passwordHash },
    update: { passwordHash },
  });
  console.log(`Admin : ${admin.email} (${admin.id})`);

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Location" SET "userId" = $1 WHERE "userId" IS NULL`,
      admin.id,
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "Merchant" SET "userId" = $1 WHERE "userId" IS NULL`,
      admin.id,
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "Wine" SET "userId" = $1 WHERE "userId" IS NULL`,
      admin.id,
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "Bottle" SET "userId" = $1 WHERE "userId" IS NULL`,
      admin.id,
    );
  } catch (e) {
    console.warn("Update null userId (peut être déjà NOT NULL) :", e);
  }

  for (const name of DEFAULT_MERCHANTS) {
    await prisma.merchant.upsert({
      where: { userId_name: { userId: admin.id, name } },
      create: { name, userId: admin.id },
      update: {},
    });
  }

  console.log("Migration users OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
