import { motion } from "framer-motion";
import { GameEvent } from "@/data/events";
import { ReactNode } from "react";

interface Props {
  choices: GameEvent["choices"];
  onChoose: (index: number) => void;
  disabled?: boolean;
}

const DecisionButtons = ({ choices, onChoose, disabled }: Props) => {
  const effectIcons: Record<string, ReactNode> = {
    energy: (
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M7 1L3 9h3v6l4-8H7V1z" fill="currentColor" />
      </svg>
    ),
    supplies: (
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <rect x="3" y="4" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3 7h10" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    morale: (
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M8 13s-4-2.4-4-5.2C4 5.2 5.2 4 6.6 4c.7 0 1.3.3 1.4.9C8.1 4.3 8.7 4 9.4 4 10.8 4 12 5.2 12 7.8 12 10.6 8 13 8 13z" fill="currentColor" />
      </svg>
    ),
    risk: (
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M8 2l6 11H2L8 2z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 6v4" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="8" cy="11.2" r="0.8" fill="currentColor" />
      </svg>
    ),
  };

  return (
    <div className="grid gap-3">
      {choices.map((choice, i) => {
        const effects = Object.entries(choice.effects)
          .filter(([, v]) => v !== 0 && v !== undefined)
          .map(([k, v]) => {
            const val = v as number;
            return { key: k, icon: effectIcons[k], value: val };
          });

        const isRisky = choice.decisionType === "risky";
        const isNeutral = choice.decisionType === "neutral";

        return (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: disabled ? 0.4 : 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.12, duration: 0.4, ease: "easeOut" }}
            whileHover={disabled ? {} : { scale: 1.015, x: 6 }}
            whileTap={disabled ? {} : { scale: 0.97 }}
            onClick={() => !disabled && onChoose(i)}
            disabled={disabled}
            className={`game-btn clip-corners text-left w-full group ${isRisky ? "game-btn-danger" : ""} ${disabled ? "pointer-events-none" : ""}`}
          >
            {/* Top-left index tag */}
            <div
              className="absolute top-0 left-0 px-3 py-0.5 text-[9px] font-display font-bold tracking-widest clip-skew-right"
              style={{
                background: isRisky
                  ? `hsl(var(--critical) / 0.3)`
                  : isNeutral
                    ? `hsl(var(--neon-yellow) / 0.2)`
                    : `hsl(var(--neon-cyan) / 0.2)`,
                color: isRisky
                  ? `hsl(var(--critical))`
                  : isNeutral
                    ? `hsl(var(--neon-yellow))`
                    : `hsl(var(--neon-cyan))`,
              }}
            >
              {String.fromCharCode(65 + i)}
            </div>

            {/* Hover sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

            <div className="flex items-center justify-between relative z-10 mt-1">
              <div className="flex-1">
                <span className="font-heading text-sm md:text-base uppercase tracking-[0.16em] text-foreground block">
                  {choice.label}
                </span>
                <div className="flex items-center gap-3 mt-2">
                  {/* Decision type badge */}
                  <span
                    className="text-[9px] font-display uppercase tracking-[0.2em] px-2.5 py-0.5 clip-corners"
                    style={{
                      background: isRisky
                        ? `hsl(var(--critical) / 0.15)`
                        : isNeutral
                          ? `hsl(var(--neon-yellow) / 0.15)`
                          : `hsl(var(--morale) / 0.15)`,
                      border: `1px solid ${isRisky
                        ? `hsl(var(--critical) / 0.4)`
                        : isNeutral
                          ? `hsl(var(--neon-yellow) / 0.4)`
                          : `hsl(var(--morale) / 0.4)`}`,
                      color: isRisky
                        ? `hsl(var(--critical))`
                        : isNeutral
                          ? `hsl(var(--neon-yellow))`
                          : `hsl(var(--morale))`,
                    }}
                  >
                    {isRisky ? "VOLATILE" : isNeutral ? "NEUTRAL" : "STABLE"}
                  </span>

                  {/* Effects preview */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {effects.map((e) => (
                      <span
                        key={e.key}
                        className={`text-[10px] font-mono font-semibold inline-flex items-center gap-1 ${
                          e.key === "risk"
                            ? e.value > 0 ? "text-critical" : "text-morale"
                            : e.value > 0 ? "text-morale" : "text-critical"
                        }`}
                      >
                        <span className="inline-flex items-center justify-center w-3 h-3">
                          {e.icon}
                        </span>
                        <span>{e.value > 0 ? "+" : ""}{e.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div
                className="w-8 h-8 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-all duration-300"
                style={{
                  color: isRisky ? `hsl(var(--critical))` : `hsl(var(--neon-cyan))`,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default DecisionButtons;
