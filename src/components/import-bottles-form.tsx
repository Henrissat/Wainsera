"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  buildCsvTemplate,
  mapHeaders,
  parseSheetMatrix,
} from "@/lib/import-bottles";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type PreviewRow = {
  row: number;
  errors: string[];
  warnings: string[];
  summary: {
    producer: string;
    cuvee: string | null;
    vintage: number | null;
    region: string;
    location: string;
    quantity: number;
    drinkWindowAuto: boolean;
  } | null;
};

type PreviewResult = {
  mode: "preview";
  mapping: Record<string, string>;
  unknownHeaders: string[];
  total: number;
  validCount: number;
  errorCount: number;
  rows: PreviewRow[];
};

type CommitResult = {
  mode: "commit";
  imported: number;
  skipped: number;
  createdLocations: string[];
  failures: { row: number; message: string }[];
};

export function ImportBottlesForm({
  locations,
}: {
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [defaultLocation, setDefaultLocation] = useState(
    locations[0]?.name ?? "",
  );
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [commit, setCommit] = useState<CommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const headerInfo = useMemo(
    () => (headers.length ? mapHeaders(headers) : null),
    [headers],
  );

  const onFile = useCallback(async (file: File) => {
    setError(null);
    setPreview(null);
    setCommit(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        setError("Fichier vide");
        return;
      }
      const sheet = wb.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(
        sheet,
        {
          header: 1,
          defval: "",
          raw: false,
        },
      );
      const normalized = matrix.map((line) =>
        (line ?? []).map((cell) => {
          if (cell instanceof Date) {
            return cell.toISOString().slice(0, 10);
          }
          return cell;
        }),
      );
      const parsed = parseSheetMatrix(normalized);
      if (!parsed.headers.length || !parsed.rows.length) {
        setError("Aucune donnée trouvée (en-têtes + au moins 1 ligne)");
        setHeaders([]);
        setRows([]);
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
    } catch {
      setError("Impossible de lire ce fichier. Utilise .xlsx, .xls ou .csv.");
    }
  }, []);

  function downloadTemplate() {
    const csv = buildCsvTemplate();
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wainsera-import-bouteilles.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function runPreview() {
    startTransition(async () => {
      setError(null);
      setCommit(null);
      const res = await fetch("/api/bottles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "preview",
          headers,
          rows,
          defaultLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l’analyse");
        setPreview(null);
        return;
      }
      setPreview(data as PreviewResult);
    });
  }

  function runCommit() {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/bottles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "commit",
          headers,
          rows,
          defaultLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l’import");
        return;
      }
      setCommit(data as CommitResult);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Télécharger le modèle CSV
        </button>
        <p className="text-sm text-muted-foreground">
          Les colonnes sont reconnues par leur <strong>en-tête</strong>, pas par
          leur ordre.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-card px-6 py-10 transition-colors hover:border-primary/40 hover:bg-muted/30">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileSpreadsheet className="h-6 w-6" />
        </span>
        <span className="text-center">
          <span className="block font-display text-base font-semibold">
            Déposer un fichier Excel / CSV
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            .xlsx, .xls, .csv — 1re feuille, 1re ligne = en-têtes
          </span>
        </span>
        {fileName && (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            {fileName} · {rows.length} ligne{rows.length > 1 ? "s" : ""}
          </span>
        )}
        <input
          type="file"
          accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
      </label>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {headerInfo && rows.length > 0 && (
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <h3 className="font-display text-base font-semibold">
            Colonnes détectées
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(headerInfo.mapping).map(([field, header]) => (
              <span
                key={field}
                className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
              >
                {header} → {field}
              </span>
            ))}
            {headerInfo.unknown.map((h) => (
              <span
                key={h}
                className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                Ignoré : {h}
              </span>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground">
                Emplacement par défaut (si colonne absente)
              </span>
              {locations.length > 0 ? (
                <select
                  value={defaultLocation}
                  onChange={(e) => setDefaultLocation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                  <option value="">— saisir un nom —</option>
                </select>
              ) : (
                <input
                  value={defaultLocation}
                  onChange={(e) => setDefaultLocation(e.target.value)}
                  placeholder="Cave principale"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2"
                />
              )}
            </label>
            {!locations.length && (
              <p className="self-end text-xs text-muted-foreground">
                Les emplacements inconnus seront créés automatiquement.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={runPreview}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Analyser le fichier
          </button>
        </div>
      )}

      {preview && (
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold">
                Aperçu avant import
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {preview.validCount} valide
                {preview.validCount > 1 ? "s" : ""} · {preview.errorCount} en
                erreur · {preview.total} au total
              </p>
            </div>
            <button
              type="button"
              disabled={pending || preview.validCount === 0}
              onClick={runCommit}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Importer {preview.validCount} bouteille
              {preview.validCount > 1 ? "s" : ""}
            </button>
          </div>

          <div className="max-h-80 overflow-auto rounded-xl border border-border/50">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
                <tr>
                  <th className="px-3 py-2 font-medium">Ligne</th>
                  <th className="px-3 py-2 font-medium">Vin</th>
                  <th className="px-3 py-2 font-medium">Lieu</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr
                    key={r.row}
                    className="border-t border-border/40 align-top"
                  >
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {r.row}
                    </td>
                    <td className="px-3 py-2">
                      {r.summary ? (
                        <>
                          <span className="font-medium">
                            {r.summary.producer}
                          </span>
                          {r.summary.cuvee ? ` — ${r.summary.cuvee}` : ""}
                          {r.summary.vintage != null
                            ? ` (${r.summary.vintage})`
                            : ""}
                          <span className="block text-xs text-muted-foreground">
                            {r.summary.region}
                            {r.summary.drinkWindowAuto
                              ? " · garde auto"
                              : ""}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.summary?.location ?? "—"}
                      {r.summary && r.summary.quantity > 1
                        ? ` ×${r.summary.quantity}`
                        : ""}
                    </td>
                    <td className="px-3 py-2">
                      {r.errors.length > 0 ? (
                        <span className="inline-flex items-start gap-1.5 text-destructive">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{r.errors.join(" · ")}</span>
                        </span>
                      ) : (
                        <span className="text-success">OK</span>
                      )}
                      {r.warnings.length > 0 && (
                        <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">
                          {r.warnings.join(" · ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {commit && (
        <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <p className="font-display text-base font-semibold text-foreground">
                Import terminé : {commit.imported} bouteille
                {commit.imported > 1 ? "s" : ""}
              </p>
              {commit.skipped > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {commit.skipped} ligne{commit.skipped > 1 ? "s" : ""}{" "}
                  ignorée{commit.skipped > 1 ? "s" : ""}
                </p>
              )}
              {commit.createdLocations.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Emplacements créés : {commit.createdLocations.join(", ")}
                </p>
              )}
              {commit.failures.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-sm text-destructive">
                  {commit.failures.map((f) => (
                    <li key={`${f.row}-${f.message}`}>
                      Ligne {f.row} : {f.message}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/inventaire"
                className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              >
                Voir l’inventaire →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
