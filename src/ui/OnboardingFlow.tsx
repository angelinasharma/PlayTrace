/**
 * OnboardingFlow.tsx
 * Refined 3-screen narrative onboarding with interactive tutorial.
 */

import { useState } from "react";

interface Props {
  onComplete: () => void;
}

const SCREENS = [
  {
    eyebrow: "ARRIVAL",
    headline: "Your first day.",
    body: "You’ve just arrived. The air is still, but the desk is crowded. This is where it begins. Take a moment to settle in.",
  },
  {
    eyebrow: "NAVIGATION",
    headline: "Choice. Not solution.",
    body: "The day will unfold through the decisions you make. There are no right paths, only the ones you take. Move with your own rhythm.",
  },
  {
    eyebrow: "CALIBRATION",
    headline: "Intent. Weight. Commitment.",
    body: "Some moments require weight. Others need speed. Adjust the dial below to find the tension, then seal your choice.",
  },
];

export function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [tutorialValue, setTutorialValue] = useState(50);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isLast = step === SCREENS.length - 1;
  const current = SCREENS[step];

  const handleNext = () => {
    if (isLast) {
      if (hasInteracted) onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTutorialValue(parseInt(e.target.value));
    if (!hasInteracted) setHasInteracted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-background transition-colors duration-1000">
      <div className="max-w-xl w-full text-center">
        <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-8 font-mono-tabular uppercase">
          {current.eyebrow}
        </div>
        
        <h2 className="font-display text-4xl md:text-5xl font-[300] leading-[1.3] tracking-[-0.03em] text-white mb-8">
          {current.headline}
        </h2>
        
        <p className="text-sm md:text-base text-muted-foreground/80 leading-relaxed max-w-md mx-auto mb-12">
          {current.body}
        </p>

        {/* INTERACTIVE TUTORIAL ELEMENT (Screen 3 only) */}
        {isLast && (
          <div className="mb-16 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between text-[10px] tracking-[0.2em] text-muted-foreground/60 mb-4 font-mono-tabular">
              <span>CONSERVATIVE</span>
              <span className={hasInteracted ? "text-primary animate-pulse" : ""}>
                {hasInteracted ? "DIAL ENGAGED" : "ADJUST TO CONTINUE"}
              </span>
              <span>AGGRESSIVE</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={tutorialValue}
              onChange={handleSliderChange}
              className="w-full h-1 bg-white/10 appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/20 [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6)] [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/20 [&::-moz-range-thumb]:transition-transform hover:[&::-moz-range-thumb]:scale-110"
            />
            <div className="mt-6 text-[10px] tracking-[0.3em] text-muted-foreground/40 font-mono-tabular">
              VALUE: {tutorialValue.toString().padStart(3, '0')}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleNext}
            disabled={isLast && !hasInteracted}
            className={`
              inline-flex items-center justify-center border px-12 py-3.5 text-xs tracking-[0.35em] font-medium font-mono-tabular transition-all
              ${isLast && !hasInteracted 
                ? "border-white/5 text-white/10 cursor-not-allowed" 
                : "border-foreground/25 hover:border-primary hover:text-primary text-foreground/80"}
            `}
          >
            {isLast ? "START SESSION" : "CONTINUE"}
          </button>
          
          <div className="flex gap-2">
            {SCREENS.map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-1 rounded-full transition-colors duration-500 ${i === step ? "bg-primary" : "bg-muted-foreground/20"}`} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
