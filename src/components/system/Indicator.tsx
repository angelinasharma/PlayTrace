interface Props {
  label: string;
  value: number;
  preview?: number;
  tone?: "primary" | "accent" | "warn";
}

export function Indicator({ label, value, preview, tone = "primary" }: Props) {
  const toneColor =
    tone === "accent" ? "bg-accent" : tone === "warn" ? "bg-destructive" : "bg-primary";
  const v = Math.max(0, Math.min(100, value));
  const p = preview !== undefined ? Math.max(0, Math.min(100, preview)) : undefined;
  const delta = p !== undefined ? p - v : 0;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{label}</span>
        <span className="font-mono-tabular text-xs text-foreground/80">
          {Math.round(v)}
          {p !== undefined && Math.abs(delta) > 0.5 && (
            <span className={delta > 0 ? "text-primary ml-1" : "text-destructive ml-1"}>
              {delta > 0 ? "+" : ""}{Math.round(delta)}
            </span>
          )}
        </span>
      </div>
      <div className="relative h-1.5 bg-secondary overflow-hidden rounded-sm">
        <div
          className={`absolute inset-y-0 left-0 ${toneColor} transition-all duration-200`}
          style={{ width: `${v}%` }}
        />
        {p !== undefined && (
          <div
            className="absolute inset-y-0 bg-foreground/30 transition-all duration-150"
            style={{ left: `${Math.min(v, p)}%`, width: `${Math.abs(delta)}%` }}
          />
        )}
      </div>
    </div>
  );
}
