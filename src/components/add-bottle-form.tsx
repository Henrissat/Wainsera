"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2, Info, Star, RefreshCw } from "lucide-react";
import { WINE_TYPES, BOTTLE_FORMATS, PROFILE_SCALES } from "@/lib/types";
import { suggestDrinkWindow } from "@/lib/drink-window-defaults";

export type CatalogRegion = {
  id: string;
  name: string;
  appellations: { id: string; name: string }[];
};

export type CatalogGrape = { id: string; name: string };
export type CatalogMerchant = { id: string; name: string };

export type BottleFormInitial = {
  producer?: string | null;
  cuvee?: string | null;
  vintage?: number | null;
  locationId?: string;
  wineType?: string;
  regionId?: string | null;
  appellationId?: string | null;
  grapeIds?: string[];
  alcoholAbv?: number | null;
  quantity?: number;
  format?: string;
  purchasePrice?: number | null;
  purchaseDate?: string | null; // YYYY-MM-DD
  merchantId?: string | null;
  purchaseNotes?: string | null;
  rating?: number | null;
  notes?: string | null;
  scaleDouxAcide?: number | null;
  scaleSecMoelleux?: number | null;
  scaleSoupleTannique?: number | null;
  scaleLegerPuissant?: number | null;
  drinkFrom?: number;
  peakStart?: number;
  peakEnd?: number;
  drinkTo?: number;
};

export interface AddBottleFormProps {
  locations: { id: string; name: string; type: string }[];
  regions: CatalogRegion[];
  grapes: CatalogGrape[];
  merchants?: CatalogMerchant[];
  /** Mode édition */
  bottleId?: string;
  initial?: BottleFormInitial;
}

interface FormErrors {
  producer?: string;
  locationId?: string;
  regionId?: string;
  vintage?: string;
  drinkFrom?: string;
  peakStart?: string;
  peakEnd?: string;
  drinkTo?: string;
  alcoholAbv?: string;
  quantity?: string;
  general?: string;
}

export function AddBottleForm({
  locations,
  regions,
  grapes,
  merchants = [],
  bottleId,
  initial,
}: AddBottleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(bottleId);
  const [producer, setProducer] = useState(initial?.producer ?? "");
  const [cuvee, setCuvee] = useState(initial?.cuvee ?? "");
  const [isNV, setIsNV] = useState(
    initial ? initial.vintage == null : false,
  );
  const [vintage, setVintage] = useState(
    initial?.vintage != null ? String(initial.vintage) : "",
  );
  const [locationId, setLocationId] = useState(initial?.locationId ?? "");
  const [wineType, setWineType] = useState(initial?.wineType ?? "ROUGE");
  const [regionId, setRegionId] = useState(initial?.regionId ?? "");
  const [appellationId, setAppellationId] = useState(
    initial?.appellationId ?? "",
  );
  const [grapeIds, setGrapeIds] = useState<string[]>(initial?.grapeIds ?? []);
  const [alcoholAbv, setAlcoholAbv] = useState(
    initial?.alcoholAbv != null ? String(initial.alcoholAbv) : "",
  );
  const [quantity, setQuantity] = useState(
    String(initial?.quantity ?? 1),
  );
  const [format, setFormat] = useState(initial?.format ?? "STANDARD_75");
  const [purchasePrice, setPurchasePrice] = useState(
    initial?.purchasePrice != null ? String(initial.purchasePrice) : "",
  );
  const [purchaseDate, setPurchaseDate] = useState(
    initial?.purchaseDate ?? "",
  );
  const [merchantId, setMerchantId] = useState(initial?.merchantId ?? "");
  const [newMerchant, setNewMerchant] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState(
    initial?.purchaseNotes ?? "",
  );
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [scales, setScales] = useState<Record<string, number | null>>({
    scaleDouxAcide: initial?.scaleDouxAcide ?? null,
    scaleSecMoelleux: initial?.scaleSecMoelleux ?? null,
    scaleSoupleTannique: initial?.scaleSoupleTannique ?? null,
    scaleLegerPuissant: initial?.scaleLegerPuissant ?? null,
  });
  const [drinkFrom, setDrinkFrom] = useState(
    initial?.drinkFrom != null ? String(initial.drinkFrom) : "",
  );
  const [peakStart, setPeakStart] = useState(
    initial?.peakStart != null ? String(initial.peakStart) : "",
  );
  const [peakEnd, setPeakEnd] = useState(
    initial?.peakEnd != null ? String(initial.peakEnd) : "",
  );
  const [drinkTo, setDrinkTo] = useState(
    initial?.drinkTo != null ? String(initial.drinkTo) : "",
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  /** Si true, l’utilisateur a modifié la garde à la main → on ne réécrit plus auto */
  const [gardeLocked, setGardeLocked] = useState(Boolean(isEdit));
  const [gardeHint, setGardeHint] = useState<string | null>(null);

  const year = new Date().getFullYear();

  const appellations = useMemo(() => {
    const region = regions.find((r) => r.id === regionId);
    return region?.appellations ?? [];
  }, [regions, regionId]);

  const selectedRegion = regions.find((r) => r.id === regionId);
  const selectedAppellation = appellations.find((a) => a.id === appellationId);

  function applyGardeSuggestion(force = false) {
    if (isNV || !vintage.trim()) return;
    const v = parseInt(vintage, 10);
    if (Number.isNaN(v)) return;
    if (gardeLocked && !force) return;

    const suggestion = suggestDrinkWindow({
      vintage: v,
      wineType,
      regionName: selectedRegion?.name,
      appellationName: selectedAppellation?.name,
    });
    setDrinkFrom(String(suggestion.drinkFrom));
    setPeakStart(String(suggestion.peakStart));
    setPeakEnd(String(suggestion.peakEnd));
    setDrinkTo(String(suggestion.drinkTo));
    setGardeHint(suggestion.label);
    if (force) setGardeLocked(false);
  }

  useEffect(() => {
    applyGardeSuggestion(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- suggestion pilotée par type / région / appellation / millésime
  }, [wineType, regionId, appellationId, vintage, isNV]);

  function onGardeChange(
    setter: (v: string) => void,
    value: string,
  ) {
    setGardeLocked(true);
    setter(value);
  }

  function toggleGrape(id: string) {
    setGrapeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!producer.trim()) e.producer = "Domaine / château requis";
    if (!locationId) e.locationId = "Choisissez un emplacement";
    if (!regionId) e.regionId = "Choisissez une région";

    if (!isNV && vintage.trim()) {
      const vintageNum = parseInt(vintage, 10);
      if (Number.isNaN(vintageNum) || vintageNum < 1800 || vintageNum > 2100) {
        e.vintage = "Année entre 1800 et 2100";
      }
    }

    if (alcoholAbv.trim()) {
      const a = Number(alcoholAbv);
      if (Number.isNaN(a) || a < 0 || a > 30) e.alcoholAbv = "0–30 %";
    }

    const q = parseInt(quantity, 10);
    if (Number.isNaN(q) || q < 1) e.quantity = "Au moins 1";

    const df = parseInt(drinkFrom, 10);
    const ps = parseInt(peakStart, 10);
    const pe = parseInt(peakEnd, 10);
    const dt = parseInt(drinkTo, 10);

    if (!drinkFrom.trim() || Number.isNaN(df)) e.drinkFrom = "Requis";
    if (!peakStart.trim() || Number.isNaN(ps)) e.peakStart = "Requis";
    if (!peakEnd.trim() || Number.isNaN(pe)) e.peakEnd = "Requis";
    if (!drinkTo.trim() || Number.isNaN(dt)) e.drinkTo = "Requis";

    if (
      !e.drinkFrom &&
      !e.peakStart &&
      !e.peakEnd &&
      !e.drinkTo &&
      !(df <= ps && ps <= pe && pe <= dt)
    ) {
      e.general = "Ordre invalide pour la fenêtre de garde";
    }

    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const body = {
        producer: producer.trim(),
        cuvee: cuvee.trim() || null,
        vintage: isNV ? null : vintage.trim() ? parseInt(vintage, 10) : null,
        locationId,
        wineType,
        regionId,
        appellationId: appellationId || null,
        grapeIds,
        alcoholAbv: alcoholAbv.trim() ? Number(alcoholAbv) : null,
        quantity: parseInt(quantity, 10),
        format,
        purchasePrice: purchasePrice.trim() ? Number(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
        merchantId: merchantId || null,
        newMerchant: newMerchant.trim() || null,
        purchaseNotes: purchaseNotes.trim() || null,
        rating,
        notes: notes.trim() || null,
        ...scales,
        drinkFrom: parseInt(drinkFrom, 10),
        peakStart: parseInt(peakStart, 10),
        peakEnd: parseInt(peakEnd, 10),
        drinkTo: parseInt(drinkTo, 10),
      };
      const res = await fetch(
        isEdit ? `/api/bottles/${bottleId}` : "/api/bottles",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEdit ? { mode: "update", ...body } : body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || (isEdit ? "Erreur lors de la mise à jour" : "Erreur lors de l'ajout"),
        );
      }
      router.push(`/bouteilles/${isEdit ? bottleId : data.id}`);
      router.refresh();
    } catch (err) {
      setErrors({
        general:
          err instanceof Error ? err.message : "Une erreur est survenue",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "mt-1 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  const preview = [
    WINE_TYPES.find((t) => t.value === wineType)?.label,
    producer.trim() || "…",
    appellations.find((a) => a.id === appellationId)?.name,
    isNV ? "NV" : vintage || "…",
    regions.find((r) => r.id === regionId)?.name,
    grapeIds
      .map((id) => grapes.find((g) => g.id === id)?.name)
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errors.general}
        </div>
      )}

      <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Aperçu : </span>
        {preview || "Remplissez les champs…"}
      </div>

      <section className="space-y-4">
        <h3 className="font-display text-base font-semibold">Identité</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Type <span className="text-destructive">*</span>
            </label>
            <select
              value={wineType}
              onChange={(e) => setWineType(e.target.value)}
              className={field}
            >
              {WINE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Quantité <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={cn(field, "w-28", errors.quantity && "border-destructive")}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Domaine / château <span className="text-destructive">*</span>
          </label>
          <input
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
            placeholder="Ex. Château de Croizille"
            className={cn(field, errors.producer && "border-destructive")}
          />
          {errors.producer && (
            <p className="mt-1 text-xs text-destructive">{errors.producer}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Cuvée (optionnel)</label>
          <input
            value={cuvee}
            onChange={(e) => setCuvee(e.target.value)}
            placeholder="Ex. Cuvée Prestige"
            className={field}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Région <span className="text-destructive">*</span>
            </label>
            <select
              value={regionId}
              onChange={(e) => {
                setRegionId(e.target.value);
                setAppellationId("");
              }}
              className={cn(field, errors.regionId && "border-destructive")}
            >
              <option value="">— Choisir —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.regionId && (
              <p className="mt-1 text-xs text-destructive">{errors.regionId}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">
              Appellation (AOP / AOC)
            </label>
            <select
              value={appellationId}
              onChange={(e) => setAppellationId(e.target.value)}
              disabled={!regionId}
              className={cn(field, !regionId && "opacity-50")}
            >
              <option value="">— Aucune / autre —</option>
              {appellations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Millésime</label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <input
              type="number"
              value={vintage}
              onChange={(e) => setVintage(e.target.value)}
              disabled={isNV}
              placeholder={String(year - 5)}
              className={cn(
                "w-32 rounded-md border bg-card px-3 py-2 text-sm",
                isNV && "opacity-40",
              )}
            />
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={isNV}
                onChange={(e) => {
                  setIsNV(e.target.checked);
                  if (e.target.checked) setVintage("");
                }}
                className="h-4 w-4 accent-primary"
              />
              NV (non millésimé)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Cépages</label>
          <p className="text-xs text-muted-foreground">
            Sélection multiple dans la liste (en base).
          </p>
          {grapes.length === 0 ? (
            <p className="mt-2 text-sm text-amber-800">
              Aucun cépage en base — lance <code>npm run db:seed</code>.
            </p>
          ) : (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border p-2">
              <div className="flex flex-wrap gap-1.5">
                {grapes.map((g) => {
                  const active = grapeIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGrape(g.id)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">
            Degré d&apos;alcool (% vol.)
          </label>
          <input
            type="number"
            step="0.1"
            min={0}
            max={30}
            value={alcoholAbv}
            onChange={(e) => setAlcoholAbv(e.target.value)}
            placeholder="13.5"
            className={cn(field, "w-32")}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-base font-semibold">
          Note & commentaire
        </h3>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(rating === n ? null : n)}
              className={cn(
                "rounded-md p-1.5",
                rating != null && rating >= n && n > 0
                  ? "text-amber-500"
                  : "text-muted-foreground/40",
              )}
            >
              {n === 0 ? (
                <span className="px-1 text-xs">0</span>
              ) : (
                <Star
                  className={cn(
                    "h-6 w-6",
                    rating != null && rating >= n && "fill-current",
                  )}
                />
              )}
            </button>
          ))}
          {rating != null && (
            <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Commentaire…"
          className={field}
        />
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-base font-semibold">
          Caractéristiques (1–5)
        </h3>
        {PROFILE_SCALES.map((s) => (
          <div key={s.key}>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{s.left}</span>
              <span>{s.right}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setScales((prev) => ({
                      ...prev,
                      [s.key]: prev[s.key] === n ? null : n,
                    }))
                  }
                  className={cn(
                    "flex-1 rounded-md border py-2 text-sm",
                    scales[s.key] === n
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-base font-semibold">Stockage</h3>
        {locations.length === 0 ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
            <Link href="/emplacements" className="underline">
              Créer un emplacement
            </Link>{" "}
            d&apos;abord.
          </div>
        ) : (
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className={cn(field, errors.locationId && "border-destructive")}
          >
            <option value="">— Choisir —</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-base font-semibold">
          Format & achat
        </h3>
        <div>
          <label className="block text-sm font-medium">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className={field}
          >
            {BOTTLE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Prix d&apos;achat (€)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="24.90"
              className={field}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Date d&apos;achat</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={field}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Lieu d&apos;achat</label>
          <select
            value={merchantId}
            onChange={(e) => {
              setMerchantId(e.target.value);
              if (e.target.value) setNewMerchant("");
            }}
            className={field}
          >
            <option value="">— Choisir —</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            value={newMerchant}
            onChange={(e) => {
              setNewMerchant(e.target.value);
              if (e.target.value) setMerchantId("");
            }}
            placeholder="Ou saisir un nouveau lieu…"
            className={cn(field, "mt-2")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Notes d&apos;achat (optionnel)
          </label>
          <input
            value={purchaseNotes}
            onChange={(e) => setPurchaseNotes(e.target.value)}
            placeholder="Promo, lot, facture…"
            className={field}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-display text-base font-semibold">
            Fenêtre de garde <span className="text-destructive">*</span>
          </h3>
          <button
            type="button"
            onClick={() => applyGardeSuggestion(true)}
            disabled={isNV || !vintage.trim()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recalculer selon le vin
          </button>
        </div>
        <div className="flex items-start gap-1.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Prérempli selon type, région et appellation (ex. Bordeaux classique
            2–6 ans, Saint-Émilion 5–15 ans, grands crus plus long). Tu peux
            tout modifier.
            {gardeHint && (
              <>
                {" "}
                <span className="font-medium text-foreground">
                  Suggestion : {gardeHint}
                </span>
                {gardeLocked ? " (modifiée à la main)" : ""}.
              </>
            )}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["Boire dès", drinkFrom, setDrinkFrom, String(year)],
              ["Début pic", peakStart, setPeakStart, String(year + 2)],
              ["Fin pic", peakEnd, setPeakEnd, String(year + 6)],
              ["Limite", drinkTo, setDrinkTo, String(year + 10)],
            ] as const
          ).map(([label, value, setter, ph]) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => onGardeChange(setter, e.target.value)}
                placeholder={ph}
                className={cn(field, "mt-1")}
              />
            </div>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting || locations.length === 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isEdit ? "Enregistrer les modifications" : "Ajouter à la cave"}
      </button>
    </form>
  );
}
