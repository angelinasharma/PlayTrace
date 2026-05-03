interface Props {
  ratio: number; // 1 -> 0
}

export function TimerBar({ ratio }: Props) {
  const r = Math.max(0, Math.min(1, ratio));
  const tone = r > 0.5 ? "bg-primary" : r > 0.25 ? "bg-accent" : "bg-destructive";
  return (
    <div className="h-0.5 w-full bg-secondary overflow-hidden">
      <div
        className={`h-full ${tone} transition-[width] duration-100 ease-linear ${r < 0.25 ? "animate-pulse-warn" : ""}`}
        style={{ width: `${r * 100}%` }}
      />
    </div>
  );
}
