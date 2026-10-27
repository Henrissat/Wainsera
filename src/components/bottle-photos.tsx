"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Loader2,
  Trash2,
  ExternalLink,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from "@/lib/cloudinary";

export type MediaItem = {
  id: string;
  url: string;
  kind: string;
};

const KIND_LABELS: Record<string, string> = {
  etiquette: "Étiquette",
  bouteille: "Bouteille",
  autre: "Autre",
};

export function BottlePhotos({
  bottleId,
  wineId,
  media,
  canEdit = true,
}: {
  bottleId: string;
  wineId: string;
  media: MediaItem[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cloudinaryReady = isCloudinaryConfigured();

  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("etiquette");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(!cloudinaryReady);

  async function saveMediaUrl(imageUrl: string) {
    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        kind,
        bottleId,
        wineId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Erreur");
    router.refresh();
  }

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const secureUrl = await uploadImageToCloudinary(file);
      await saveMediaUrl(secureUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function onAddUrl(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveMediaUrl(url.trim());
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer cette photo ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/media?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(null);
    }
  }

  const onPaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (!cloudinaryReady || loading) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await handleFile(file);
          return;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleFile closes over kind/loading
    [cloudinaryReady, loading, kind],
  );

  const field =
    "mt-1 block w-full rounded-md border border-input bg-card px-3 py-2 text-sm";

  return (
    <div
      className="rounded-lg border border-border/60 bg-card px-5 py-4"
      onPaste={onPaste}
    >
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-display text-base font-semibold">Photos</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {cloudinaryReady
          ? "Envoie une image vers Cloudinary (fichier, glisser-déposer ou Ctrl+V), ou colle une URL."
          : "Configure Cloudinary dans .env, ou colle une URL d’image publique."}
      </p>

      {media.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => (
            <li
              key={m.id}
              className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={KIND_LABELS[m.kind] ?? m.kind}
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                <span className="truncate text-[11px] font-medium text-white">
                  {KIND_LABELS[m.kind] ?? m.kind}
                </span>
                <div className="flex gap-1">
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-white/20 p-1 text-white hover:bg-white/30"
                    title="Ouvrir"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onDelete(m.id)}
                      disabled={deleting === m.id}
                      className="rounded bg-white/20 p-1 text-white hover:bg-rose-500/80"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune photo pour l&apos;instant.
        </div>
      )}

      {canEdit && (
      <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
        <div>
          <label className="text-sm font-medium">Type</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={field}
          >
            <option value="etiquette">Étiquette</option>
            <option value="bouteille">Bouteille</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        {cloudinaryReady && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20",
            )}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Glisse une image, colle (Ctrl+V), ou choisis un fichier
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Choisir une image
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowUrlForm((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          {showUrlForm ? "Masquer l’ajout par URL" : "Ajouter via une URL"}
        </button>

        {showUrlForm && (
          <form onSubmit={onAddUrl} className="space-y-3">
            <div>
              <label className="text-sm font-medium">URL de l&apos;image</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                required
                className={field}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-muted/40 disabled:opacity-50",
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer l&apos;URL
            </button>
          </form>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      )}
    </div>
  );
}
