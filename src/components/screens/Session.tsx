import { useEffect, useMemo, useRef, useState } from "react";
import { Action, INTERRUPTS, SCENARIOS } from "@/lib/scenarios";
import { adaptTimeLimit, applyImpact, DecisionRecord, INITIAL_STATE, previewImpact, SystemState } from "@/lib/state";
import { InterruptOverlay } from "./InterruptOverlay";

interface Props {
  onDone: (records: DecisionRecord[]) => void;
}

const LABELS: Record<keyof SystemState, string> = {
  stability: "STABILITY",
  trust: "COHERENCE",
  time: "BUFFER",
};

export function Session({ onDone }: Props) {
  const [state, setState] = useState<SystemState>(INITIAL_STATE);
  const [idx, setIdx] = useState(0);
  const [risk, setRisk] = useState(0.5);
  const [action, setAction] = useState<Action | null>(null);
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const [interrupt, setInterrupt] = useState<typeof INTERRUPTS[number] | null>(null);
  const [committing, setCommitting] = useState(false);
  const [reversalFired, setReversalFired] = useState<string | null>(null);
  const [ordering, setOrdering] = useState<Action[]>([]);

  const scenario = SCENARIOS[idx];
  const limit = useMemo(() => adaptTimeLimit(scenario.timeLimit, state), [scenario, idx]);
  const [remaining, setRemaining] = useState(limit);
  const startRef = useRef<number>(performance.now());
  const dialStartRef = useRef<number>(0);

  useEffect(() => {
    setRisk(0.5);
    setRemaining(limit);
    startRef.current = performance.now();
    dialStartRef.current = 0;
    setReversalFired(null);
    setOrdering(scenario.actions);

    if (scenario.mode === "allocation") {
      setAction(scenario.actions.find(a => a.label.toLowerCase().includes("balance")) || scenario.actions[0]);
    } else {
      setAction(null);
    }
    
    setCommitting(false);
  }, [idx, limit, scenario]);

  useEffect(() => {
    if (interrupt || committing) return;
    const id = setInterval(() => {
      setRemaining(r => Math.max(0, r - 0.1));
      setState(s => ({ ...s, stability: Math.max(0, s.stability - 0.05) }));
    }, 100);
    return () => clearInterval(id);
  }, [interrupt, action, risk, committing]);

  useEffect(() => {
    if (remaining === 0 && !committing) {
      handleTimeout();
    }
  }, [remaining, committing]);

  const handleTimeout = () => {
    if (committing) return;
    const a = action ?? scenario.actions[scenario.actions.length - 1];
    commit(a, action ? risk : 0.5, true);
  };

  const selectIntent = (a: Action) => {
    if (scenario.mode === "reversal" && !reversalFired) {
      setReversalFired(a.id);
      return;
    }
    if (a.id === reversalFired) return;
    setAction(a);
    if (!dialStartRef.current) dialStartRef.current = performance.now();
  };

  const commit = (a: Action, r: number, timedOut = false) => {
    if (committing) return;
    setCommitting(true);
    const before = state;
    const { state: after, isPatternBreaker } = applyImpact(before, a, r, idx);
    const rec: DecisionRecord = {
      scenarioId: scenario.id,
      actionId: a.id,
      risk: r,
      decisionTimeMs: performance.now() - startRef.current,
      hesitationMs: dialStartRef.current ? performance.now() - dialStartRef.current : 0,
      committed: !timedOut,
      pressure: remaining / limit,
      stateBefore: before,
      stateAfter: after,
      tag: scenario.tag,
      isPatternBreaker,
    };
    setRecords(rs => [...rs, rec]);
    setState(after);
    setTimeout(() => {
      if (idx + 1 >= SCENARIOS.length) onDone([...records, rec]);
      else { setIdx(i => i + 1); }
    }, 350);
  };

  const handleInterrupt = (optionId: string) => {
    if (!interrupt) return;
    const opt = interrupt.options.find(o => o.id === optionId)!;
    const before = state;
    const after = {
      stability: clamp(before.stability + opt.impact.stability),
      trust: clamp(before.trust + opt.impact.trust),
      time: clamp(before.time + opt.impact.time),
    };
    setState(after);
    setRecords(rs => [...rs, {
      scenarioId: interrupt.id, actionId: opt.id, risk: 0.5,
      decisionTimeMs: 0, hesitationMs: 0, committed: true, pressure: 0,
      stateBefore: before, stateAfter: after, isInterrupt: true,
    }]);
    setInterrupt(null);
  };

  const preview = action ? previewImpact(state, action, risk, idx) : undefined;
  const deltas = preview ? {
    stability: Math.round(preview.stability - state.stability),
    trust: Math.round(preview.trust - state.trust),
    time: Math.round(preview.time - state.time),
  } : undefined;

  const calibrationLabel =
    risk < 0.2 ? "Conservative" :
    risk < 0.45 ? "Cautious" :
    risk < 0.55 ? "Balanced" :
    risk < 0.8 ? "Assertive" : "Aggressive";
  const calibrationTone =
    risk < 0.35 ? "text-primary" :
    risk < 0.65 ? "text-accent" : "text-destructive";

  return (
    <div className="min-h-screen flex flex-col">
      {/* TOP BAR */}
      <div className="border-b border-border/60">
        <div className="px-6 py-4 grid grid-cols-3 items-center gap-6">
          <div className="text-[10px] tracking-[0.35em] font-mono-tabular text-muted-foreground">
            SESSION <span className="text-foreground/80 ml-3">{idx + 1}/{SCENARIOS.length}</span>
          </div>
          <div className="flex justify-center gap-10">
            <Stat label={LABELS.stability} value={state.stability} delta={deltas?.stability} />
            <Stat label={LABELS.trust} value={state.trust} delta={deltas?.trust} />
            <Stat label={LABELS.time} value={state.time} delta={deltas?.time} />
          </div>
          <div className="flex items-center justify-end gap-4 font-mono-tabular text-[10px] tracking-[0.3em]">
            <div className="flex gap-2 text-muted-foreground/50">
              {SCENARIOS.map((_, i) => (
                <span key={i} className={i === idx ? "text-foreground" : i < idx ? "text-foreground/50" : ""}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              ))}
            </div>
            <div className="text-base text-foreground font-medium tabular-nums w-12 text-right">
              {Math.ceil(remaining)}s
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      {!scenario.isInterrupt && (
      <div className="flex-1 px-8 md:px-12 py-12 max-w-6xl w-full mx-auto">
        <div className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground font-mono-tabular mb-5">
          {scenario.eyebrow}
        </div>
        <p className="font-display text-3xl md:text-[40px] leading-[1.15] whitespace-pre-wrap text-foreground max-w-4xl mb-14">
          {typeof scenario.text === 'function' ? scenario.text(state) : scenario.text}
        </p>

        {/* STEP 01 — INTENT */}
        {scenario.mode !== "allocation" && scenario.mode !== "ordering" && scenario.mode !== "interrupt" && (
        <div className="mb-10">
          <div className="text-[10px] tracking-[0.35em] text-muted-foreground font-mono-tabular mb-4">
            01 — SELECT INTENT
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenario.actions.map(a => {
              const selected = action?.id === a.id;
              const isReversed = a.id === reversalFired;
              return (
                <button
                  key={a.id}
                  onClick={() => selectIntent(a)}
                  disabled={isReversed}
                  className={`relative text-left px-5 py-5 border transition-colors ${
                    isReversed ? "border-destructive/30 bg-destructive/10 opacity-50 cursor-not-allowed" :
                    selected
                      ? "border-destructive/70 bg-destructive/5"
                      : "border-border hover:border-foreground/40 bg-card/40"
                  }`}
                >
                  <div className={`text-base text-foreground font-light ${isReversed ? "line-through text-destructive" : ""}`}>{a.label}</div>
                  {isReversed && (
                    <div className="text-[11px] text-destructive font-mono-tabular tracking-wide mt-1 uppercase">
                      Path Invalidated
                    </div>
                  )}
                  {a.hint && selected && (
                    <div className="text-[11px] text-destructive/80 font-mono-tabular tracking-wide mt-1">
                      {a.hint}
                    </div>
                  )}
                  {selected && (
                    <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-destructive" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* ORDERING MODE */}
        {scenario.mode === "ordering" && (
          <div className="mb-10 animate-in fade-in">
            <div className="text-[10px] tracking-[0.35em] text-muted-foreground font-mono-tabular mb-4 uppercase">
              Priority Ordering (Top Item Dictates Execution)
            </div>
            <div className="flex flex-col gap-2">
              {ordering.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 border border-border bg-card/40 px-4 py-3">
                  <div className="text-xs text-muted-foreground font-mono-tabular w-6">{i + 1}</div>
                  <div className="text-base font-light text-foreground flex-1">{a.label}</div>
                  <div className="flex gap-1">
                    <button disabled={i === 0} onClick={() => {
                      const newOrd = [...ordering];
                      [newOrd[i - 1], newOrd[i]] = [newOrd[i], newOrd[i - 1]];
                      setOrdering(newOrd);
                    }} className="text-muted-foreground hover:text-foreground disabled:opacity-20 px-3 py-1 border border-border/50 text-xs">▲</button>
                    <button disabled={i === ordering.length - 1} onClick={() => {
                      const newOrd = [...ordering];
                      [newOrd[i + 1], newOrd[i]] = [newOrd[i], newOrd[i + 1]];
                      setOrdering(newOrd);
                    }} className="text-muted-foreground hover:text-foreground disabled:opacity-20 px-3 py-1 border border-border/50 text-xs">▼</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={() => commit(ordering[0], 0.5)}
                className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3 text-xs tracking-[0.35em] font-mono-tabular transition-colors uppercase"
              >
                Commit Order
              </button>
            </div>
          </div>
        )}

        {/* INTERRUPT MODE (INLINE) */}
        {scenario.mode === "interrupt" && (
          <div className="mb-10 animate-in zoom-in-95 duration-200">
            <div className="text-[10px] tracking-[0.35em] text-destructive font-mono-tabular mb-4 animate-pulse uppercase">
              Critical Intervention Required
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {scenario.actions.map(a => (
                 <button
                   key={a.id}
                   onClick={() => commit(a, 0.5)}
                   className="bg-destructive/10 hover:bg-destructive/20 border border-destructive/50 text-foreground py-6 px-4 text-center transition-colors"
                 >
                   <span className="text-lg tracking-wide uppercase">{a.label}</span>
                 </button>
               ))}
            </div>
          </div>
        )}

        {/* STEP 02 — CALIBRATE */}
        {action && scenario.mode !== "ordering" && scenario.mode !== "interrupt" && (
          <div className="mb-10 animate-in fade-in duration-200">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-[10px] tracking-[0.35em] text-muted-foreground font-mono-tabular uppercase">
                {scenario.mode === "allocation" ? "01 — ALLOCATE RESOURCES" : "02 — CALIBRATE"}
              </div>
              <div className={`text-xs font-mono-tabular ${calibrationTone}`}>{calibrationLabel}</div>
            </div>
            {scenario.mode !== "allocation" && (
              <div className="text-sm text-muted-foreground mb-4">
                Execution intensity — <span className="text-foreground/80">{action.label}</span>
              </div>
            )}

            {deltas && scenario.mode !== "blind" && (
              <div className="flex gap-5 px-4 py-3 border border-border bg-card/40 mb-5 font-mono-tabular text-xs">
                <Delta label="STAB" v={deltas.stability} />
                <Delta label="COHE" v={deltas.trust} />
                <Delta label="BUFF" v={deltas.time} />
              </div>
            )}
            {scenario.mode === "blind" && (
              <div className="flex gap-5 px-4 py-3 border border-destructive/20 bg-destructive/5 mb-5 font-mono-tabular text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5"><span className="text-destructive/80">STAB</span> ???</span>
                <span className="text-muted-foreground flex items-center gap-1.5"><span className="text-destructive/80">COHE</span> ???</span>
                <span className="text-muted-foreground flex items-center gap-1.5"><span className="text-destructive/80">BUFF</span> ???</span>
              </div>
            )}

            <div className="relative pt-1 pb-2">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] calibrate-track rounded-full" />
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(risk * 100)}
                onChange={(e) => setRisk(Number(e.target.value) / 100)}
                className="relative w-full appearance-none bg-transparent h-6 cursor-pointer
                  [&::-webkit-slider-runnable-track]:h-6 [&::-webkit-slider-runnable-track]:bg-transparent
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground/80
                  [&::-moz-range-track]:h-6 [&::-moz-range-track]:bg-transparent
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-foreground/80"
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] tracking-[0.35em] font-mono-tabular">
              {scenario.mode === "allocation" ? (
                <>
                  <span className="text-primary/80">{Math.round((1 - risk) * 100)}% {scenario.leftLabel || "TASK A"}</span>
                  <span className="text-destructive/80">{Math.round(risk * 100)}% {scenario.rightLabel || "TASK B"}</span>
                </>
              ) : (
                <>
                  <span className="text-primary/80">{scenario.leftLabel || "CONSERVATIVE"}</span>
                  <span className="text-destructive/80">{scenario.rightLabel || "AGGRESSIVE"}</span>
                </>
              )}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={() => commit(action, risk)}
                className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3 text-xs tracking-[0.35em] font-mono-tabular transition-colors"
              >
                COMMIT
              </button>
              {scenario.mode !== "allocation" && (
                <button
                  onClick={() => { setAction(null); setReversalFired(null); }}
                  className="text-muted-foreground hover:text-foreground px-4 py-3 text-xs tracking-[0.35em] font-mono-tabular"
                >
                  REVISE
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {(interrupt || scenario.isInterrupt) && (
        <InterruptOverlay 
          event={interrupt || {
            id: scenario.id,
            text: typeof scenario.text === 'function' ? scenario.text(state) : scenario.text,
            timeLimit: scenario.timeLimit,
            options: scenario.actions.map(a => ({ id: a.id, label: a.label, impact: a.base }))
          }}
          onChoose={interrupt ? handleInterrupt : (id) => {
            const a = scenario.actions.find(act => act.id === id)!;
            commit(a, 0.5);
          }}
        />
      )}
    </div>
  );
}

function clamp(n: number) { return Math.max(0, Math.min(100, n)); }

function Stat({ label, value, delta }: { label: string; value: number; delta?: number }) {
  const v = Math.round(value);
  const showDelta = delta !== undefined && Math.abs(delta) > 0;
  const tone = (delta ?? 0) >= 0 ? "text-primary" : "text-destructive";
  return (
    <div className="flex flex-col items-center min-w-[110px]">
      <div className="flex items-baseline gap-1.5 font-mono-tabular text-[10px] tracking-[0.3em]">
        <span className="text-muted-foreground">{label}</span>
        {showDelta && (
          <span className={`${tone} text-[10px]`}>
            {delta! > 0 ? "+" : ""}{delta}
          </span>
        )}
        <span className="text-foreground tabular-nums">{v}</span>
      </div>
      <div className="mt-1.5 h-[2px] w-24 bg-secondary overflow-hidden">
        <div className="h-full bg-primary transition-all duration-200" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function Delta({ label, v }: { label: string; v: number }) {
  const tone = v > 0 ? "text-primary" : v < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={tone}>{v > 0 ? "+" : ""}{v}</span>
    </span>
  );
}
