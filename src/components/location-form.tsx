"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCATION_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function LocationForm({
  onSuccess,
}: {
  onSuccess?: (location: { id: string; name: string }) => void;
} = {}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("CAVE");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ name?: string; general?: string }>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: { name?: string; general?: string } = {};
    if (!name.trim()) next.name = "Le nom est requis";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }
      setName("");
      setType("CAVE");
      setNotes("");
      if (onSuccess) {
        onSuccess(data);
      } else {
        router.refresh();
      }
    } catch (err) {
      setErrors({
        general:
          err instanceof Error ? err.message : "Une erreur est survenue",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errors.general}
        </div>
      )}

      <div>
        <label
          htmlFor="loc-name"
          className="block text-sm font-medium text-foreground"
        >
          Nom de l&apos;emplacement
        </label>
        <input
          id="loc-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Cave principale"
          className={cn(
            "mt-1 block w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
            errors.name ? "border-destructive" : "border-input",
          )}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="loc-type"
          className="block text-sm font-medium text-foreground"
        >
          Type
        </label>
        <select
          id="loc-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {LOCATION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="loc-notes"
          className="block text-sm font-medium text-foreground"
        >
          Notes <span className="text-muted-foreground">(optionnel)</span>
        </label>
        <textarea
          id="loc-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Ex. Température, humidité, accès..."
          className="mt-1 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Créer l&apos;emplacement
      </button>
    </form>
  );
}
