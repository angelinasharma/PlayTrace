import { useEffect, useRef, useState } from "react";

interface Props {
  onCommit: () => void;
  label?: string;
  duration?: number;
}

export function HoldButton({ onCommit, label = "HOLD TO COMMIT", duration = 900 }: Props) {
  const [progress, setProgress] = useState(0);
  const holdingRef = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef<number>();

  const stop = () => {
    holdingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(0);
  };

  const start = () => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    startRef.current = performance.now();
    const tick = () => {
      if (!holdingRef.current) return;
      const p = Math.min(1, (performance.now() - startRef.current) / duration);
      setProgress(p);
      if (p >= 1) {
        holdingRef.current = false;
        setProgress(0);
        onCommit();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stop(), []);

  const size = 132;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <button
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={(e) => { e.preventDefault(); start(); }}
      onTouchEnd={stop}
      className="relative select-none focus:outline-none group"
      style={{ width: size, height: size }}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="hsl(var(--secondary))" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
          style={{ transition: progress === 0 ? "stroke-dashoffset 200ms ease" : undefined }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[9px] tracking-[0.25em] text-muted-foreground group-active:text-primary">
          {progress > 0 ? "HOLDING" : "HOLD"}
        </span>
        <span className="text-[9px] tracking-[0.25em] text-muted-foreground group-active:text-primary">
          TO COMMIT
        </span>
      </div>
    </button>
  );
}
