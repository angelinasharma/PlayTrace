import { useState } from "react";

interface Props { onContinue: (agreed: boolean) => void }

const POINTS = [
  "Your response times, dial positions, and action choices will be recorded throughout the session.",
  "Data is used exclusively for behavioral research. No personal identifiers are collected.",
  "Results reflect session-based patterns, not definitive assessments of any kind.",
  "You may stop at any time. Partial sessions are still recorded.",
];

export function Consent({ onContinue }: Props) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full">
        <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-4 font-mono-tabular">DATA USAGE</div>
        <h2 className="font-display text-4xl md:text-5xl text-foreground mb-10">Before you begin</h2>

        <ul className="space-y-5 mb-10">
          {POINTS.map(p => (
            <li key={p} className="flex gap-4 text-sm md:text-[15px] text-foreground/75 leading-relaxed">
              <span className="mt-2 w-1 h-1 rounded-full bg-foreground/40 shrink-0" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <label className="flex items-center gap-3 cursor-pointer group mb-8 select-none">
          <span className={`w-4 h-4 border ${agreed ? "bg-primary border-primary" : "border-foreground/40 group-hover:border-foreground/70"} flex items-center justify-center transition-colors`}>
            {agreed && <span className="text-primary-foreground text-[10px] leading-none">✓</span>}
          </span>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only" />
          <span className="text-sm text-foreground/80">I understand and consent to participation</span>
        </label>

        <button
          onClick={() => onContinue(agreed)}
          className="inline-flex items-center justify-center border border-foreground/25 px-10 py-3 text-xs tracking-[0.35em] font-mono-tabular text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}
