/**
 * FeedbackInline.tsx
 * Low-friction behavioral feedback component.
 * Integrated directly into the dashboard flow.
 */

import { useState } from "react";

interface Props {
  sessionId: string;
}

export function FeedbackInline({ sessionId }: Props) {
  const [rating, setRating] = useState(3);
  const [touched, setTouched] = useState(false);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!touched) return;
    
    // Prepare payload
    const payload = {
      sessionId,
      rating,
      feedback: comment.trim(),
      timestamp: new Date().toISOString(),
    };
    
    console.log("Feedback Submitted:", payload);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="py-8 border-t border-border/40 animate-in fade-in duration-500">
        <p className="text-sm text-muted-foreground italic">Thanks — that helps.</p>
      </div>
    );
  }

  return (
    <div className="py-12 border-t border-border/40">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h3 className="text-lg font-light text-foreground mb-1">How does this feel?</h3>
          <p className="text-sm text-muted-foreground">Does this reflect your decisions?</p>
        </div>

        <div className="mb-10">
          <div className="relative pt-2 pb-6">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/10 rounded-full" />
            
            {/* Midpoint Tick */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[1px] h-3 transition-opacity duration-300
                ${rating === 3 ? "bg-white opacity-60" : "bg-white opacity-20"}`} 
            />

            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={rating}
              onChange={(e) => {
                setRating(parseInt(e.target.value));
                setTouched(true);
              }}
              className="relative w-full appearance-none bg-transparent h-6 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/20 [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-110
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6)] [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/20 [&::-moz-range-thumb]:transition-transform hover:[&::-moz-range-thumb]:scale-110"
            />
          </div>
          <div className="flex justify-between text-[10px] tracking-[0.2em] text-muted-foreground/60 font-mono-tabular px-1">
            <span>NOT REALLY</span>
            <span className="opacity-40">NEUTRAL</span>
            <span>VERY MUCH</span>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-3">
            Anything that felt off?
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional context..."
            className="w-full bg-background border border-border/60 p-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-colors min-h-[100px] resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!touched}
          className="inline-flex items-center justify-center border border-foreground/25 hover:border-primary hover:text-primary px-10 py-3 text-xs tracking-[0.35em] font-mono-tabular transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          SUBMIT FEEDBACK
        </button>
      </div>
    </div>
  );
}
