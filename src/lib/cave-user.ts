import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Cave affichée en lecture :
 * - connecté → sa propre cave
 * - anonyme → cave publique (compte AUTH_ADMIN_EMAIL)
 */
export async function getViewCaveUserId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  return getPublicCaveUserId();
}

export async function getPublicCaveUserId(): Promise<string | null> {
  const email = (process.env.AUTH_ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return user?.id ?? null;
}

/** Utilisateur connecté (écriture). */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
