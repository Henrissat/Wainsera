"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { WINE_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

export type FilterOption = { id: string; name: string };

const DRINK_OPTIONS = [
  { value: "", label: "Tous statuts garde" },
  { value: "TROP_JEUNE", label: "Trop jeune" },
  { value: "PRET", label: "Prêt" },
  { value: "OPTIMUM", label: "Optimum" },
  { value: "URGENT", label: "Urgent" },
  { value: "DEPASSE", label: "Dépassé" },
];

const SORT_OPTIONS = [
  { value: "urgence", label: "Urgence" },
  { value: "millesime", label: "Millésime" },
  { value: "nom", label: "Nom" },
  { value: "note", label: "Note" },
];

export function InventoryFilters({
  regions,
  grapes,
  locations,
}: {
  regions: FilterOption[];
  grapes: FilterOption[];
  locations: FilterOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";
  const region = searchParams.get("region") ?? "";
  const grape = searchParams.get("grape") ?? "";
  const drink = searchParams.get("drink") ?? "";
  const location = searchParams.get("location") ?? "";
  const sort = searchParams.get("sort") ?? "urgence";

  const [search, setSearch] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) params.delete(key);
      else params.set(key, value);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  const clearAll = () => {
    setSearch("");
    startTransition(() => router.push(pathname));
  };

  const hasFilters = Boolean(
    q || type || region || grape || drink || location || sort !== "urgence",
  );

  const field =
    "rounded-md border border-input bg-card px-2.5 py-1.5 text-sm text-foreground";

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-border/60 bg-card/80 p-3",
        pending && "opacity-70",
      )}
    >
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          placeholder="Rechercher (domaine, cuvée, appellation…)"
          className={cn(field, "w-full pl-8")}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => setParam("q", value), 350);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={type}
          onChange={(e) => setParam("type", e.target.value)}
          className={field}
        >
          <option value="">Tous types</option>
          {WINE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={region}
          onChange={(e) => setParam("region", e.target.value)}
          className={field}
        >
          <option value="">Toutes régions</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={grape}
          onChange={(e) => setParam("grape", e.target.value)}
          className={field}
        >
          <option value="">Tous cépages</option>
          {grapes.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <select
          value={drink}
          onChange={(e) => setParam("drink", e.target.value)}
          className={field}
        >
          {DRINK_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => setParam("location", e.target.value)}
          className={field}
        >
          <option value="">Tous lieux</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className={field}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Tri : {o.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
