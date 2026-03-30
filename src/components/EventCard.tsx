import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { phaseLabels } from "@/data/events";

interface Props {
  title: string;
  description: string;
  currentEvent: number;
  totalEvents: number;
  phase: number;
}

const TypewriterLine = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 12);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  return <>{displayed}<span className="animate-pulse" style={{ color: 'hsl(var(--neon-cyan))' }}>▊</span></>;
};

const EventCard = ({ title, description, currentEvent, totalEvents, phase }: Props) => {
  const phaseColors: Record<number, string> = {
    1: 'var(--neon-cyan)',
    2: 'var(--neon-yellow)',
    3: 'var(--critical)',
  };
  const phaseColor = phaseColors[phase] || 'var(--neon-cyan)';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={title}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <div className="relative hud-panel p-5 md:p-7 overflow-hidden">
          <div className="corner-deco corner-deco-tl" />
          <div className="corner-deco corner-deco-tr" />
          <div className="corner-deco corner-deco-bl" />
          <div className="corner-deco corner-deco-br" />

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.03] to-transparent shimmer-slide" />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 80% 12%, hsl(var(--neon-cyan) / 0.08), transparent 45%)" }} />

          {/* Header bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="rec-dot" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-display text-primary">
                Incoming Transmission
              </span>
              <span
                className="text-[8px] font-display uppercase tracking-[0.15em] px-2 py-0.5 clip-corners ml-2"
                style={{
                  background: `hsl(${phaseColor} / 0.15)`,
                  border: `1px solid hsl(${phaseColor} / 0.4)`,
                  color: `hsl(${phaseColor})`,
                }}
              >
                {phaseLabels[phase]}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {Array.from({ length: totalEvents }, (_, i) => (
                  <div
                    key={i}
                    className="w-4 h-1 transition-all duration-300"
                    style={{
                      background: i < currentEvent
                        ? `hsl(${phaseColor})`
                        : `hsl(215 28% 14%)`,
                      boxShadow: i < currentEvent
                        ? `0 0 4px hsl(${phaseColor} / 0.5)`
                        : 'none',
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-display tracking-[0.15em]" style={{ color: `hsl(${phaseColor})` }}>
                {String(currentEvent).padStart(2, "0")}/{String(totalEvents).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="h-px mb-5" style={{ background: `linear-gradient(90deg, hsl(${phaseColor} / 0.4), transparent)` }} />

          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="font-display text-2xl md:text-4xl font-bold tracking-[0.12em] neon-text mb-4 uppercase"
          >
            {title}
          </motion.h2>

          <div className="space-y-3 relative hud-terminal p-3 md:p-4">
            {description.split("\n\n").map((paragraph, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.2 }}
                className="text-xs md:text-sm text-muted-foreground leading-relaxed font-mono"
              >
                <span className="text-primary/40 mr-1">&gt;</span>
                <TypewriterLine text={paragraph} delay={300 + i * 600} />
              </motion.p>
            ))}
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 h-px origin-left"
            style={{ background: `linear-gradient(90deg, transparent, hsl(${phaseColor} / 0.3), transparent)` }}
          />

          <div className="flex items-center justify-between mt-3 text-[9px] font-mono text-muted-foreground/50 tracking-wider">
            <span>SIG.FREQ: {(4.2 + currentEvent * 0.13).toFixed(2)}GHz</span>
            <span>PHASE: {phase} / {phaseLabels[phase]?.toUpperCase()}</span>
            <span>ENC: AES-256</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventCard;
