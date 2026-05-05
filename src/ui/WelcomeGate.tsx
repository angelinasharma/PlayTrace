/**
 * WelcomeGate.tsx
 * Entry point screen — hook first, friction last.
 */

interface Props {
  onBegin: () => void;
}

export function WelcomeGate({ onBegin }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-4xl w-full text-center">

        {/* Hook */}
        <h1 className="font-display text-[44px] md:text-[52px] font-[300] leading-[1.25] tracking-[-1.5px] text-white mb-5">
          Ever wondered how <br />you actually make decisions?
        </h1>

        {/* Curiosity hook */}
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
          Most People get it wrong.<br />
          Make a few decisions. See what patterns show up.
        </p>

        {/* Minimal details */}
        <p className="text-[11px] tracking-[0.3em] text-muted-foreground/70 font-mono-tabular uppercase mb-10">
          10 decisions &nbsp;·&nbsp; ~8 minutes &nbsp;·&nbsp; No right answers
        </p>

        {/* CTA */}
        <button
          onClick={onBegin}
          className="inline-flex items-center justify-center bg-destructive hover:bg-destructive/90 text-destructive-foreground px-12 py-4 text-xs tracking-[0.35em] font-medium font-mono-tabular transition-colors mb-5"
        >
          SEE HOW YOU REACT
        </button>

        {/* Reassurance */}
        <p className="text-[11px] text-muted-foreground/50 tracking-wide">
          No prep needed. Just respond instinctively.
        </p>

      </div>
    </div>
  );
}
