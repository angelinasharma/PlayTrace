import { useState } from "react";

interface Props { onDone: (hours: string, background: string) => void }

const BG = [
  { id: "creative", label: "Creative" },
  { id: "analytical", label: "Analytical" },
  { id: "none", label: "Neither" },
  { id: "both", label: "Both" },
];

export function Classify({ onDone }: Props) {
  const [hours, setHours] = useState<string>("0");
  const [bg, setBg] = useState<string>("");
  const ready = hours !== "" && bg;

  const hoursBucket = (h: string) => {
    const n = Number(h) || 0;
    if (n <= 2) return "0-2";
    if (n <= 5) return "2-5";
    return "5+";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full">
        <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-4 font-mono-tabular">PARTICIPANT PROFILE</div>
        <h2 className="font-display text-4xl md:text-5xl text-foreground mb-3">Two quick questions</h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-md leading-relaxed">
          Used to contextualize your responses. Not shown during the session.
        </p>

        <div className="mb-10 pb-10 border-b border-border/60">
          <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-mono-tabular mb-4">
            Hours per week spent on games or simulations
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={168}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-24 bg-card border border-border px-4 py-2.5 text-foreground font-mono-tabular text-base focus:outline-none focus:border-foreground/50"
            />
            <span className="text-xs text-muted-foreground font-mono-tabular tracking-wider">hrs / week</span>
          </div>
        </div>

        <div className="mb-12">
          <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-mono-tabular mb-4">
            Primary professional or academic background
          </div>
          <div className="flex flex-wrap gap-2">
            {BG.map(b => (
              <button
                key={b.id}
                onClick={() => setBg(b.id)}
                className={`px-5 py-2.5 text-xs font-mono-tabular tracking-wider border transition-colors ${
                  bg === b.id
                    ? "border-foreground text-foreground bg-foreground/5"
                    : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground/80"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onDone(hoursBucket(hours), bg === "both" ? "analytical" : bg)}
          disabled={!ready}
          className="inline-flex items-center justify-center border border-foreground/30 px-10 py-3 text-xs tracking-[0.35em] font-mono-tabular text-foreground disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:bg-foreground enabled:hover:text-background transition-colors"
        >
          BEGIN SESSION
        </button>
      </div>
    </div>
  );
}
