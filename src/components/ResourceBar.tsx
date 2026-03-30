import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  label: string;
  icon: ReactNode;
  value: number;
  maxValue: number;
  colorClass: string;
  prevValue?: number;
  invertCritical?: boolean; // true for risk bar where HIGH is bad
}

const TOTAL_SEGMENTS = 16;

const ResourceBar = ({ label, icon, value, maxValue, colorClass, prevValue, invertCritical }: Props) => {
  const [flash, setFlash] = useState<string | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));
  const filledSegments = Math.round((percentage / 100) * TOTAL_SEGMENTS);
  const isCritical = invertCritical ? percentage > 60 : percentage < 20;

  const colorVar = colorClass.replace("bg-", "");

  useEffect(() => {
    if (prevValue !== undefined && prevValue !== value) {
      const isPositiveChange = invertCritical ? value < prevValue : value > prevValue;
      setFlash(isPositiveChange ? "flash-positive" : "flash-negative");
      setDelta(value - prevValue);
      const t = setTimeout(() => { setFlash(null); setDelta(null); }, 1200);
      return () => clearTimeout(t);
    }
  }, [value, prevValue, invertCritical]);

  return (
    <div className={`relative hud-panel p-2.5 overflow-hidden ${flash ?? ""}`}>
      <div className="corner-deco corner-deco-tl" />
      <div className="corner-deco corner-deco-br" />

      {isCritical && (
        <div className="absolute inset-0 pulse-glow" style={{ background: `hsl(var(--critical) / 0.08)` }} />
      )}

      <div className="flex items-center gap-1.5 mb-1.5 relative z-10">
        <span className="text-[10px] flex items-center justify-center w-4 h-4">
          {icon}
        </span>
        <span className="text-[9px] uppercase tracking-[0.15em] font-mono" style={{ color: `hsl(var(--${colorVar}))` }}>
          {label}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <AnimatePresence>
            {delta !== null && (
              <motion.span
                initial={{ opacity: 0, y: 5, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                className={`text-[9px] font-mono font-bold ${
                  (invertCritical ? delta < 0 : delta > 0) ? "text-morale" : "text-critical"
                }`}
              >
                {delta > 0 ? "+" : ""}{delta}
              </motion.span>
            )}
          </AnimatePresence>
          <span
            className={`font-display text-xs font-bold tabular-nums ${isCritical ? "text-critical" : ""}`}
            style={!isCritical ? { color: `hsl(var(--${colorVar}))` } : undefined}
          >
            {value}
          </span>
        </div>
      </div>

      <div className="flex gap-[2px] h-2 relative z-10">
        {Array.from({ length: TOTAL_SEGMENTS }, (_, i) => {
          const filled = i < filledSegments;
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-[1px]"
              initial={false}
              animate={{
                backgroundColor: filled
                  ? isCritical
                    ? `hsl(var(--critical))`
                    : `hsl(var(--${colorVar}))`
                  : `hsl(215 28% 14%)`,
                opacity: filled ? 1 : 0.3,
              }}
              transition={{ duration: 0.3, delay: i * 0.01 }}
              style={filled ? {
                boxShadow: isCritical
                  ? `0 0 3px hsl(var(--critical) / 0.5)`
                  : `0 0 3px hsl(var(--${colorVar}) / 0.4)`,
              } : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ResourceBar;
