import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { seedMerchantsForUser } from "@/lib/default-merchants";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");
  const name = body.name ? String(body.name).trim() : null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Mot de passe trop court (8 caractères min.)" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email" },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
    },
  });

  await seedMerchantsForUser(user.id);

  return NextResponse.json(
    { id: user.id, email: user.email },
    { status: 201 },
  );
}
