/**
 * InterruptOverlay.tsx
 * Full-screen interrupt overlay — triggered by high-pressure interrupt scenarios.
 * Auto-selects first option on timeout.
 */

import { useEffect, useState } from "react";
import type { InterruptEvent } from "@/core/types";

interface Props {
  event: InterruptEvent;
  onChoose: (optionId: string) => void;
}

export function InterruptOverlay({ event, onChoose }: Props) {
  const [remaining, setRemaining] = useState(event.timeLimit);
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((r) => {
        const next = Math.max(0, r - 0.1);
        if (next === 0 && !timerExpired) setTimerExpired(true);
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [event]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center px-6 animate-flash">
      <div className="max-w-xl w-full">
        <div className="text-[10px] tracking-[0.4em] text-destructive mb-4 animate-pulse-warn">
          ▌ DECISION NEEDED
        </div>
        <p className="text-2xl font-light mb-10 text-foreground">{event.text}</p>
        <div className="grid grid-cols-2 gap-3">
          {event.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onChoose(option.id)}
              className="border border-destructive/40 hover:bg-destructive/10 hover:text-destructive px-4 py-4 text-sm transition-colors"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-6 h-[3px] bg-secondary overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${(remaining / event.timeLimit) * 100}%`,
              backgroundColor: timerExpired
                ? "hsl(0 78% 58%)"
                : remaining / event.timeLimit < 0.3
                ? "hsl(38 92% 58%)"
                : "hsl(152 76% 52%)",
              opacity: timerExpired ? 0.5 : 1,
            }}
          />
        </div>
        {timerExpired && (
          <div className="mt-2 text-[9px] tracking-[0.2em] text-muted-foreground/40 font-mono-tabular text-right">
            take your time
          </div>
        )}
      </div>
    </div>
  );
}
