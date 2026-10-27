import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/cave-user";
import { ImportBottlesForm } from "@/components/import-bottles-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImporterPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login?callbackUrl=/importer");

  const locations = await prisma.location.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/inventaire"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Inventaire
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
          Importer des bouteilles
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Importe un fichier Excel ou CSV. Les colonnes sont reconnues par leur
          en-tête (domaine, région, millésime…). L’ordre n’a pas d’importance.
          La fenêtre de garde est estimée automatiquement si le millésime est
          fourni.
        </p>
      </div>

      <ImportBottlesForm locations={locations} />
    </div>
  );
}
