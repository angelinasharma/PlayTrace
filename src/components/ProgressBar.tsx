import { motion } from "framer-motion";
import { phaseLabels, TOTAL_PHASES } from "@/data/events";

interface Props {
  currentPhase: number;
  currentEventInPhase: number;
  totalEventsInPhase: number;
  totalEventsCompleted: number;
  totalEvents: number;
}

const ProgressBar = ({ currentPhase, currentEventInPhase, totalEventsInPhase, totalEventsCompleted, totalEvents }: Props) => {
  const overallProgress = (totalEventsCompleted / totalEvents) * 100;

  return (
    <div className="relative hud-panel p-3 overflow-hidden">
      <div className="corner-deco corner-deco-tl" />
      <div className="corner-deco corner-deco-br" />

      {/* Phase indicators */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((phase) => (
            <div key={phase} className="flex items-center gap-1">
              <span
                className="text-[8px] font-display uppercase tracking-[0.15em] px-2 py-0.5 clip-corners"
                style={{
                  background: phase === currentPhase
                    ? 'hsl(var(--neon-cyan) / 0.2)'
                    : phase < currentPhase
                      ? 'hsl(var(--morale) / 0.15)'
                      : 'hsl(215 28% 14% / 0.5)',
                  border: `1px solid ${phase === currentPhase
                    ? 'hsl(var(--neon-cyan) / 0.5)'
                    : phase < currentPhase
                      ? 'hsl(var(--morale) / 0.3)'
                      : 'hsl(215 28% 14%)'}`,
                  color: phase === currentPhase
                    ? 'hsl(var(--neon-cyan))'
                    : phase < currentPhase
                      ? 'hsl(var(--morale))'
                      : 'hsl(215 20% 40%)',
                }}
              >
                {phase <= currentPhase ? phaseLabels[phase] : `Phase ${phase}`}
              </span>
              {phase < TOTAL_PHASES && (
                <div className="w-3 h-px mx-0.5" style={{
                  background: phase < currentPhase ? 'hsl(var(--morale) / 0.5)' : 'hsl(215 28% 18%)',
                }} />
              )}
            </div>
          ))}
        </div>
        <span className="text-[9px] font-mono" style={{ color: 'hsl(var(--neon-cyan))' }}>
          {Math.round(overallProgress)}%
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-2 bg-secondary overflow-hidden clip-corners relative">
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            background: `linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-magenta)))`,
            boxShadow: '0 0 8px hsl(var(--neon-cyan) / 0.4)',
          }}
        />
        {/* Phase dividers */}
        {[1, 2].map((i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${(i / 3) * 100}%`,
              background: 'hsl(222 47% 5% / 0.8)',
            }}
          />
        ))}
      </div>

      {/* Sub-progress label */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[8px] font-mono text-muted-foreground">
          PHASE {currentPhase}: EVENT {currentEventInPhase}/{totalEventsInPhase}
        </span>
        <span className="text-[8px] font-mono text-muted-foreground">
          {totalEventsCompleted}/{totalEvents} TOTAL
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
