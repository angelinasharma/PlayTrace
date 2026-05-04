/**
 * WelcomeGate.tsx
 * Entry point screen — establishes context before the session begins.
 */

interface Props {
  onBegin: () => void;
}

const SESSION_METADATA = [
  ["Duration", "10 scenarios · ~8 minutes"],
  ["Stages", "Intent → Calibrate → Commit"],
  ["Consequences", "Carry forward mechanically"],
  ["Interrupts", "Unpredictable, time-limited"],
  ["Analysis", "Full behavioral report on completion"],
];

export function WelcomeGate({ onBegin }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center">
        <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-8 font-mono-tabular">
          BEHAVIORAL RESEARCH SYSTEM · V4.0
        </div>
        <h1 className="font-display text-[42px] font-[300] leading-[1.4] tracking-[-1.26px] text-white mb-6">
          PlayTrace
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto mb-14">
          You will manage a fragile system under sustained pressure. Every decision carries
          consequence. Every delay is recorded. The system state persists across the entire session.
        </p>

        <div className="text-left max-w-md mx-auto mb-12 divide-y divide-border/60 border-y border-border/60">
          {SESSION_METADATA.map(([key, description]) => (
            <div key={key} className="grid grid-cols-[120px_1fr] gap-4 py-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-mono-tabular pt-0.5">
                {key}
              </div>
              <div className="text-sm text-foreground/90">{description}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onBegin}
          className="inline-flex items-center justify-center bg-destructive hover:bg-destructive/90 text-destructive-foreground px-12 py-3.5 text-xs tracking-[0.35em] font-medium font-mono-tabular transition-colors"
        >
          BEGIN
        </button>
      </div>
    </div>
  );
}
