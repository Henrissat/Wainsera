import { cn } from "@/lib/utils";
import { formatRatingValue, starFill } from "@/lib/rating";

export function StarRating({
  value,
  size = "md",
  showValue = true,
  className,
  label,
  tone = "personal",
}: {
  value: number | null | undefined;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
  label?: string;
  tone?: "personal" | "external";
}) {
  if (value == null) return null;

  const px = size === "sm" ? 14 : 18;
  const fillClass =
    tone === "external" ? "text-sky-500" : "text-amber-500";
  const textClass =
    tone === "external" ? "text-sky-700" : "text-amber-600";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        textClass,
        className,
      )}
      title={`${formatRatingValue(value)}/5`}
    >
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = starFill(value, i);
          return (
            <span
              key={i}
              className="relative inline-block"
              style={{ width: px, height: px }}
            >
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 text-muted-foreground/30"
                width={px}
                height={px}
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {fill > 0 && (
                <span
                  className={cn("absolute inset-0 overflow-hidden", fillClass)}
                  style={{ width: `${fill * 100}%` }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={px}
                    height={px}
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span
          className={cn(
            "font-medium tabular-nums",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {formatRatingValue(value)}
          <span className="text-muted-foreground">/5</span>
        </span>
      )}
    </span>
  );
}
