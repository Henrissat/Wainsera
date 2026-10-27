import type { DrinkWindow, DrinkWindowStatus } from "@/lib/drink-status";
import { drinkStatus, drinkStatusLabel } from "@/lib/drink-status";
import { cn } from "@/lib/utils";

type Props = {
  wine: DrinkWindow & { vintage?: number | null };
  currentYear?: number;
  className?: string;
};

const ZONE_FILL: Record<DrinkWindowStatus, string> = {
  TROP_JEUNE: "fill-sky-500/15 dark:fill-sky-400/10",
  PRET: "fill-emerald-500/20 dark:fill-emerald-400/12",
  OPTIMUM: "fill-success/30 dark:fill-success/25",
  URGENT: "fill-warning/25 dark:fill-warning/18",
  DEPASSE: "fill-destructive/15 dark:fill-destructive/12",
};

const ZONE_DOT: Record<DrinkWindowStatus, string> = {
  TROP_JEUNE: "bg-sky-500",
  PRET: "bg-emerald-500",
  OPTIMUM: "bg-success",
  URGENT: "bg-warning",
  DEPASSE: "bg-destructive",
};

/** Hauteur relative (0–1) de la « maturité » pour une année donnée. */
function maturityAt(
  year: number,
  w: DrinkWindow,
): number {
  const { drinkFrom, peakStart, peakEnd, drinkTo } = w;
  if (year < drinkFrom) {
    const span = Math.max(1, drinkFrom - (drinkFrom - 4));
    const t = Math.max(0, (year - (drinkFrom - 4)) / span);
    return 0.12 + 0.18 * t * t;
  }
  if (year < peakStart) {
    const t = (year - drinkFrom) / Math.max(1, peakStart - drinkFrom);
    // ease-in-out vers le plateau
    const s = t * t * (3 - 2 * t);
    return 0.3 + 0.7 * s;
  }
  if (year <= peakEnd) return 1;
  if (year <= drinkTo) {
    const t = (year - peakEnd) / Math.max(1, drinkTo - peakEnd);
    const s = t * t * (3 - 2 * t);
    return 1 - 0.72 * s;
  }
  const over = year - drinkTo;
  return Math.max(0.05, 0.28 * Math.exp(-over / 3));
}

function buildPath(
  years: number[],
  values: number[],
  xOf: (y: number) => number,
  yOf: (v: number) => number,
): string {
  if (years.length === 0) return "";
  const pts = years.map((yr, i) => [xOf(yr), yOf(values[i]!)] as const);
  let d = `M ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export function GardeCurve({
  wine,
  currentYear = new Date().getFullYear(),
  className,
}: Props) {
  const status = drinkStatus(wine, currentYear);
  const vintage = wine.vintage ?? wine.drinkFrom - 2;

  // Plage affichée : un peu avant le millésime / drinkFrom jusqu’après drinkTo
  const domainStart = Math.min(vintage, wine.drinkFrom - 1, currentYear - 1);
  const domainEnd = Math.max(wine.drinkTo + 2, currentYear + 1, wine.peakEnd + 1);
  const span = Math.max(1, domainEnd - domainStart);

  const W = 640;
  const H = 200;
  const padL = 8;
  const padR = 8;
  const padT = 28;
  const padB = 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseline = padT + plotH;

  const xOf = (year: number) =>
    padL + ((year - domainStart) / span) * plotW;
  const yOf = (v: number) => padT + (1 - v) * plotH;

  // Échantillons pour une courbe lisse
  const sampleCount = Math.min(80, Math.max(24, span * 4));
  const samples: number[] = [];
  const values: number[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const yr = domainStart + (span * i) / sampleCount;
    samples.push(yr);
    values.push(maturityAt(yr, wine));
  }

  const linePath = buildPath(samples, values, xOf, yOf);
  const areaPath =
    linePath +
    ` L ${xOf(domainEnd)} ${baseline} L ${xOf(domainStart)} ${baseline} Z`;

  const markers: { year: number; label: string; emphasis?: boolean }[] = [
    { year: wine.drinkFrom, label: "Prêt" },
    { year: wine.peakStart, label: "Pic" },
    ...(wine.peakEnd !== wine.peakStart
      ? [{ year: wine.peakEnd, label: "Fin pic" }]
      : []),
    { year: wine.drinkTo, label: "Limite" },
  ];

  // Zones colorées sous la courbe (rectangles découpés)
  const zones = (
    [
      { from: domainStart, to: wine.drinkFrom, kind: "TROP_JEUNE" },
      { from: wine.drinkFrom, to: wine.peakStart, kind: "PRET" },
      { from: wine.peakStart, to: wine.peakEnd, kind: "OPTIMUM" },
      { from: wine.peakEnd, to: wine.drinkTo, kind: "URGENT" },
      { from: wine.drinkTo, to: domainEnd, kind: "DEPASSE" },
    ] as const satisfies ReadonlyArray<{
      from: number;
      to: number;
      kind: DrinkWindowStatus;
    }>
  ).filter((z) => z.to > z.from);

  const nowX = xOf(
    Math.min(domainEnd, Math.max(domainStart, currentYear)),
  );
  const nowY = yOf(maturityAt(currentYear, wine));

  const tickYears = new Set<number>();
  tickYears.add(domainStart);
  tickYears.add(domainEnd);
  for (const m of markers) tickYears.add(m.year);
  if (currentYear >= domainStart && currentYear <= domainEnd) {
    tickYears.add(currentYear);
  }
  const ticks = [...tickYears].sort((a, b) => a - b);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card px-4 py-4 sm:px-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold">
            Courbe de garde
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Potentiel estimé selon ta fenêtre —{" "}
            <span className="font-medium text-foreground">
              {drinkStatusLabel[status]}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          {(
            [
              ["TROP_JEUNE", "Jeune"],
              ["PRET", "Prêt"],
              ["OPTIMUM", "Optimum"],
              ["URGENT", "Urgent"],
              ["DEPASSE", "Dépassé"],
            ] as const
          ).map(([k, label]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span
                className={cn("h-2 w-2 rounded-full", ZONE_DOT[k])}
                aria-hidden
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[280px]"
          role="img"
          aria-label={`Courbe de garde de ${wine.drinkFrom} à ${wine.drinkTo}, aujourd’hui ${currentYear}`}
        >
          {/* Zones */}
          {zones.map((z) => (
            <rect
              key={`${z.kind}-${z.from}`}
              x={xOf(z.from)}
              y={padT}
              width={Math.max(0, xOf(z.to) - xOf(z.from))}
              height={plotH}
              className={ZONE_FILL[z.kind]}
            />
          ))}

          {/* Plateau optimum highlight */}
          <rect
            x={xOf(wine.peakStart)}
            y={padT}
            width={Math.max(0, xOf(wine.peakEnd) - xOf(wine.peakStart))}
            height={plotH}
            className="fill-success/10"
          />

          {/* Area under curve */}
          <path d={areaPath} className="fill-primary/10" />

          {/* Curve */}
          <path
            d={linePath}
            fill="none"
            className="stroke-primary"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Marker labels above chart */}
          {markers.map((m) => {
            const x = xOf(m.year);
            return (
              <g key={`${m.label}-${m.year}`}>
                <line
                  x1={x}
                  y1={padT}
                  x2={x}
                  y2={baseline}
                  className="stroke-border/60"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                <text
                  x={x}
                  y={padT - 10}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 11 }}
                >
                  {m.label}
                </text>
              </g>
            );
          })}

          {/* Today marker */}
          <line
            x1={nowX}
            y1={padT}
            x2={nowX}
            y2={baseline}
            className="stroke-accent"
            strokeWidth={1.5}
          />
          <circle
            cx={nowX}
            cy={nowY}
            r={6}
            className="fill-accent stroke-card"
            strokeWidth={2}
          />
          <text
            x={nowX}
            y={Math.max(14, nowY - 14)}
            textAnchor="middle"
            className="fill-accent"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            Aujourd&apos;hui
          </text>

          {/* Year axis */}
          <line
            x1={padL}
            y1={baseline}
            x2={W - padR}
            y2={baseline}
            className="stroke-border"
            strokeWidth={1}
          />
          {ticks.map((yr) => (
            <text
              key={yr}
              x={xOf(yr)}
              y={baseline + 18}
              textAnchor="middle"
              className={
                yr === currentYear
                  ? "fill-accent"
                  : "fill-muted-foreground"
              }
              style={{
                fontSize: 11,
                fontWeight: yr === currentYear ? 600 : 400,
              }}
            >
              {yr}
            </text>
          ))}
        </svg>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {(
          [
            ["À partir de", wine.drinkFrom],
            ["Début pic", wine.peakStart],
            ["Fin pic", wine.peakEnd],
            ["Avant", wine.drinkTo],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl bg-muted/40 px-3 py-2"
          >
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {label}
            </dt>
            <dd
              className={cn(
                "mt-0.5 font-display text-lg font-semibold tabular-nums",
                value === currentYear && "text-accent",
                value < currentYear && "text-muted-foreground",
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
