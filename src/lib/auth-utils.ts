import { auth } from "@/auth";

export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized() {
  return Response.json({ error: "Non authentifié" }, { status: 401 });
}

export function notFound() {
  return Response.json({ error: "Introuvable" }, { status: 404 });
}
