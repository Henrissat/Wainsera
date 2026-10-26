"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wine, Gift, XCircle, Trash2 } from "lucide-react";
import type { BottleStatus } from "@prisma/client";

const actions = [
  { status: "BUE" as const, label: "Bue (−1)", icon: Wine },
  { status: "OFFERTE" as const, label: "Offerte (−1)", icon: Gift },
  { status: "PERDUE" as const, label: "Perdue (−1)", icon: XCircle },
];

export default function BottleActions({
  bottleId,
  quantity = 1,
}: {
  bottleId: string;
  quantity?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(status: BottleStatus) {
    setError(null);
    setLoading(status);
    try {
      const res = await fetch(`/api/bottles/${bottleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, consumeOne: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      router.refresh();
      if (quantity <= 1) router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Supprimer définitivement cette entrée (toutes les quantités) ?",
      )
    ) {
      return;
    }
    setError(null);
    setLoading("DELETE");
    try {
      const res = await fetch(`/api/bottles/${bottleId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-muted-foreground">
        Stock actuel : {quantity} bouteille{quantity > 1 ? "s" : ""}. « −1 »
        retire une unité ; à 0 le lot passe au statut choisi.
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.status}
              type="button"
              onClick={() => handleAction(action.status)}
              disabled={loading !== null}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                action.status === "BUE" &&
                  "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10",
                action.status === "OFFERTE" &&
                  "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20",
                action.status === "PERDUE" &&
                  "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
              )}
            >
              <Icon className="h-4 w-4" />
              {loading === action.status ? "…" : action.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {loading === "DELETE" ? "…" : "Supprimer"}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
