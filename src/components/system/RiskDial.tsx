interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function RiskDial({ value, onChange }: Props) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
        <span>Safe</span>
        <span className="font-mono-tabular text-foreground/70">{Math.round(value * 100)}%</span>
        <span>Risky</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="w-full appearance-none bg-transparent h-6 cursor-pointer
            [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-secondary [&::-webkit-slider-runnable-track]:rounded-sm
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary
            [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-secondary
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0"
        />
        <div className="absolute top-2.5 left-0 right-0 h-1 pointer-events-none flex">
          <div className="flex-1 border-r border-background/50" />
          <div className="flex-1 border-r border-background/50" />
          <div className="flex-1 border-r border-background/50" />
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}
