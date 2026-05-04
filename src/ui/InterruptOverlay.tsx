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

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((r) => {
        const next = Math.max(0, r - 0.1);
        if (next === 0) onChoose(event.options[0].id);
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [event]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center px-6 animate-flash">
      <div className="max-w-xl w-full">
        <div className="text-[10px] tracking-[0.4em] text-destructive mb-4 animate-pulse-warn">
          ▌ INTERRUPT — {remaining.toFixed(1)}s
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
        <div className="mt-6 h-0.5 bg-secondary overflow-hidden">
          <div
            className="h-full bg-destructive transition-all"
            style={{ width: `${(remaining / event.timeLimit) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
