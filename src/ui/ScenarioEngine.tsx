/**
 * ScenarioEngine.tsx
 * Core interactive session — drives the full scenario sequence.
 *
 * Data flow:
 *   User Action → selectIntent / setRisk → commit()
 *   commit() → riskModel.applyImpact → stateManager.recordDecision → advance or complete
 *
 * UI components in this file are intentionally co-located (Stat, DeltaIndicator)
 * as they are tightly coupled to scenario rendering and have no standalone use.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_SCENARIOS } from "@/scenarios/scenarioRegistry";
import { applyImpact, adaptTimeLimit, previewImpact, INITIAL_METRICS } from "@/core/riskModel";
import {
  calibrationLabel,
  calibrationTone,
  resolveDefaultAction,
  resolveScenarioText,
  resolveTimeoutAction,
  getNextScenarioId,
  SCENARIO_MAP,
  ORDERED_IDS,
} from "@/core/scenarioEngine";
import { InterruptOverlay } from "@/ui/InterruptOverlay";
import { logDecision } from "@/lib/api";
import type { Action, DecisionRecord, DecisionLogEntry, SystemMetrics, InterruptEvent } from "@/core/types";

const METRIC_LABELS: Record<keyof Pick<SystemMetrics, "stability" | "trust" | "buffer">, string> = {
  stability: "STABILITY",
  trust: "COHERENCE",
  buffer: "BUFFER",
};

interface Props {
  sessionId: string | null;
  onSessionComplete: (records: DecisionRecord[], log: DecisionLogEntry[]) => void;
}

export function ScenarioEngine({ sessionId, onSessionComplete }: Props) {
  const [metrics, setMetrics] = useState<SystemMetrics>(INITIAL_METRICS);
  const [currentScenarioId, setCurrentScenarioId] = useState("s1");
  const [riskLevel, setRiskLevel] = useState(0.5);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<DecisionRecord[]>([]);
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([]);
  const [activeInterrupt, setActiveInterrupt] = useState<typeof ALL_SCENARIOS[number] | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [reversalBlockedId, setReversalBlockedId] = useState<string | null>(null);
  const [priorityOrdering, setPriorityOrdering] = useState<Action[]>([]);
  const [timerExpired, setTimerExpired] = useState(false);

  const scenario = SCENARIO_MAP.get(currentScenarioId)!;
  const timeLimit = useMemo(() => adaptTimeLimit(scenario.timeLimit, metrics), [scenario, currentScenarioId]);
  const [remainingTime, setRemainingTime] = useState(timeLimit);

  const sessionStartRef = useRef<number>(performance.now());
  const dialEngagedRef = useRef<number>(0);

  // Reset per scenario
  useEffect(() => {
    setRiskLevel(0.5);
    setRemainingTime(timeLimit);
    setTimerExpired(false);
    sessionStartRef.current = performance.now();
    dialEngagedRef.current = 0;
    setReversalBlockedId(null);
    setPriorityOrdering(scenario.actions);
    setSelectedAction(resolveDefaultAction(scenario));
    setIsCommitting(false);
  }, [currentScenarioId, timeLimit, scenario]);

  // Passive decay timer
  useEffect(() => {
    if (activeInterrupt || isCommitting) return;
    const decayTimer = setInterval(() => {
      setRemainingTime((t) => Math.max(0, t - 0.1));
      setMetrics((m) => ({ ...m, stability: Math.max(0, m.stability - 0.05) }));
    }, 100);
    return () => clearInterval(decayTimer);
  }, [activeInterrupt, isCommitting]);

  // Soft timeout — mark expired, do NOT force a selection
  useEffect(() => {
    if (remainingTime === 0 && !isCommitting && !timerExpired) {
      setTimerExpired(true);
    }
  }, [remainingTime, isCommitting, timerExpired]);

  const selectIntent = (action: Action) => {
    if (scenario.mode === "reversal" && !reversalBlockedId) {
      setReversalBlockedId(action.id);
      return;
    }
    if (action.id === reversalBlockedId) return;
    setSelectedAction(action);
    if (!dialEngagedRef.current) dialEngagedRef.current = performance.now();
  };

  const commitDecision = (action: Action, risk: number, timedOut = false) => {
    if (isCommitting) return;
    setIsCommitting(true);

    const { metrics: nextMetrics, isPatternBreaker } = applyImpact(metrics, action, risk, ORDERED_IDS.indexOf(currentScenarioId));
    const nextId = getNextScenarioId(scenario, action);

    const record: DecisionRecord = {
      scenarioId: scenario.id,
      actionId: action.id,
      risk,
      decisionTimeMs: performance.now() - sessionStartRef.current,
      hesitationMs: dialEngagedRef.current ? performance.now() - dialEngagedRef.current : 0,
      committed: !timedOut,
      pressure: remainingTime / timeLimit,
      metricsBefore: metrics,
      metricsAfter: nextMetrics,
      tag: scenario.tag,
      isPatternBreaker,
      nextScenarioId: nextId ?? undefined,
      tags: action.tags,
    };

    const logEntry: DecisionLogEntry = {
      stepId: scenario.id,
      choice: action.id,
      tags: action.tags ?? [],
      timestamp: Date.now(),
      nextStepId: nextId,
    };

    const updatedHistory = [...decisionHistory, record];
    const updatedLog = [...decisionLog, logEntry];
    setDecisionHistory(updatedHistory);
    setDecisionLog(updatedLog);
    setMetrics(nextMetrics);

    // Backend logging
    if (sessionId) {
      logDecision({
        sessionId,
        stepId: scenario.id,
        decision: action.id,
        tags: action.tags,
        scenarioText: scenarioText,
        decisionText: action.label,
        hesitationMs: record.hesitationMs,
        decisionTimeMs: record.decisionTimeMs,
      });
    }

    setTimeout(() => {
      if (!nextId) {
        onSessionComplete(updatedHistory, updatedLog);
      } else {
        setCurrentScenarioId(nextId);
      }
    }, 350);
  };

  const handleInterruptChoice = (optionId: string) => {
    if (!activeInterrupt) return;
    const interrupt = activeInterrupt as unknown as InterruptEvent;
    const chosen = (interrupt as any).options?.find((o: any) => o.id === optionId);
    if (!chosen) return;

    const nextMetrics: SystemMetrics = {
      ...metrics,
      stability: Math.max(0, Math.min(100, metrics.stability + (chosen.impact?.stability ?? 0))),
      trust: Math.max(0, Math.min(100, metrics.trust + (chosen.impact?.trust ?? 0))),
      buffer: Math.max(0, Math.min(100, metrics.buffer + (chosen.impact?.buffer ?? 0))),
      patternBreakersUsed: metrics.patternBreakersUsed,
      delayedImpacts: metrics.delayedImpacts,
    };

    const record: DecisionRecord = {
      scenarioId: scenario.id,
      actionId: optionId,
      risk: 0.5,
      decisionTimeMs: 0,
      hesitationMs: 0,
      committed: true,
      pressure: 0,
      metricsBefore: metrics,
      metricsAfter: nextMetrics,
      isInterrupt: true,
    };

    setDecisionHistory((h) => [...h, record]);
    setMetrics(nextMetrics);
    setActiveInterrupt(null);
  };

  const preview = selectedAction
    ? previewImpact(metrics, selectedAction, riskLevel, ORDERED_IDS.indexOf(currentScenarioId))
    : undefined;

  const deltas = preview
    ? {
        stability: Math.round(preview.stability - metrics.stability),
        trust: Math.round(preview.trust - metrics.trust),
        buffer: Math.round(preview.buffer - metrics.buffer),
      }
    : undefined;

  const calibLabel = calibrationLabel(riskLevel);
  const calibTone = calibrationTone(riskLevel);
  const scenarioText = resolveScenarioText(scenario, metrics);

  return (
    <div className="min-h-screen flex flex-col">
      {/* SYSTEM STATUS BAR */}
      <div className="border-b border-border/60">
        <div className="px-6 py-4 grid grid-cols-3 items-center gap-6">
          <div className="text-[10px] tracking-[0.35em] font-mono-tabular text-muted-foreground">
            SESSION <span className="text-foreground/80 ml-3">{decisionHistory.filter(r => !r.isInterrupt).length + 1}</span>
          </div>
          <div className="flex justify-center gap-10">
            <SystemMetricDisplay label={METRIC_LABELS.stability} value={metrics.stability} delta={deltas?.stability} />
            <SystemMetricDisplay label={METRIC_LABELS.trust} value={metrics.trust} delta={deltas?.trust} />
            <SystemMetricDisplay label={METRIC_LABELS.buffer} value={metrics.buffer} delta={deltas?.buffer} />
          </div>
          <div className="flex items-center justify-end gap-4 font-mono-tabular text-[10px] tracking-[0.3em]">
            <div className="flex gap-2 text-muted-foreground/50">
              {ORDERED_IDS.map((id, i) => (
                <span
                  key={id}
                  className={
                    id === currentScenarioId
                      ? "text-foreground"
                      : decisionHistory.some(r => r.scenarioId === id)
                      ? "text-foreground/50"
                      : ""
                  }
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              ))}
            </div>
            {/* Timer: text countdown + color bar */}
            <div className="flex flex-col items-end gap-1.5">
              {timerExpired ? (
                <div className="text-[9px] tracking-[0.2em] text-muted-foreground/40 font-mono-tabular">
                  take your time
                </div>
              ) : (
                <div
                  className="text-base font-medium tabular-nums font-mono-tabular transition-colors"
                  style={{
                    color: remainingTime / timeLimit < 0.25
                      ? "hsl(0 78% 58%)"
                      : remainingTime / timeLimit < 0.5
                      ? "hsl(38 92% 58%)"
                      : "hsl(var(--foreground))",
                  }}
                >
                  {Math.ceil(remainingTime)}s
                </div>
              )}
              <div className="w-20 h-[3px] bg-secondary overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${(remainingTime / timeLimit) * 100}%`,
                    backgroundColor: timerExpired
                      ? "hsl(0 78% 58%)"
                      : remainingTime / timeLimit < 0.25
                      ? `hsl(${Math.round((remainingTime / timeLimit) * 4 * 38)} 90% 58%)`
                      : remainingTime / timeLimit < 0.5
                      ? "hsl(38 92% 58%)"
                      : "hsl(152 76% 52%)",
                    opacity: timerExpired ? 0.4 : 1,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SCENARIO BODY */}
      {!scenario.isInterrupt && (
        <div className="flex-1 px-8 md:px-12 py-12 max-w-6xl w-full mx-auto">
          <div className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground font-mono-tabular mb-5">
            {scenario.eyebrow}
          </div>
          <p className="font-display text-3xl md:text-[40px] leading-[1.15] whitespace-pre-wrap text-foreground max-w-4xl mb-14">
            {scenarioText}
          </p>

          {/* STEP 01 — INTENT SELECTION */}
          {scenario.mode !== "allocation" &&
            scenario.mode !== "ordering" &&
            scenario.mode !== "interrupt" && (
              <div className="mb-10">
                <div className="text-[10px] tracking-[0.35em] text-muted-foreground font-mono-tabular mb-4">
                  01 — SELECT INTENT
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scenario.actions.map((action) => {
                    const isSelected = selectedAction?.id === action.id;
                    const isBlocked = action.id === reversalBlockedId;
                    return (
                      <button
                        key={action.id}
                        onClick={() => selectIntent(action)}
                        disabled={isBlocked}
                        className={`relative text-left px-5 py-5 border transition-colors ${
                          isBlocked
                            ? "border-destructive/30 bg-destructive/10 opacity-50 cursor-not-allowed"
                            : isSelected
                            ? "border-destructive/70 bg-destructive/5"
                            : "border-border hover:border-foreground/40 bg-card/40"
                        }`}
                      >
                        <div className={`text-base text-foreground font-light ${isBlocked ? "line-through text-destructive" : ""}`}>
                          {action.label}
                        </div>
                        {isBlocked && (
                          <div className="text-[11px] text-destructive font-mono-tabular tracking-wide mt-1 uppercase">
                            Path Invalidated
                          </div>
                        )}
                        {action.hint && isSelected && (
                          <div className="text-[11px] text-destructive/80 font-mono-tabular tracking-wide mt-1">
                            {action.hint}
                          </div>
                        )}
                        {isSelected && (
                          <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-destructive" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {/* PRIORITY ORDERING MODE */}
          {scenario.mode === "ordering" && (
            <div className="mb-10 animate-in fade-in">
              <div className="text-[10px] tracking-[0.35em] text-muted-foreground font-mono-tabular mb-4 uppercase">
                Priority Ordering (Top Item Dictates Execution)
              </div>
              <div className="flex flex-col gap-2">
                {priorityOrdering.map((action, i) => (
                  <div key={action.id} className="flex items-center gap-3 border border-border bg-card/40 px-4 py-3">
                    <div className="text-xs text-muted-foreground font-mono-tabular w-6">{i + 1}</div>
                    <div className="text-base font-light text-foreground flex-1">{action.label}</div>
                    <div className="flex gap-1">
                      <button
                        disabled={i === 0}
                        onClick={() => {
                          const next = [...priorityOrdering];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          setPriorityOrdering(next);
                        }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 px-3 py-1 border border-border/50 text-xs"
                      >▲</button>
                      <button
                        disabled={i === priorityOrdering.length - 1}
                        onClick={() => {
                          const next = [...priorityOrdering];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          setPriorityOrdering(next);
                        }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 px-3 py-1 border border-border/50 text-xs"
                      >▼</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-3">
                <button
                  onClick={() => commitDecision(priorityOrdering[0], 0.5)}
                  className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3 text-xs tracking-[0.35em] font-mono-tabular transition-colors uppercase"
                >
                  Commit Order
                </button>
              </div>
            </div>
          )}

          {/* INTERRUPT INLINE MODE */}
          {scenario.mode === "interrupt" && (
            <div className="mb-10 animate-in zoom-in-95 duration-200">
              <div className="text-[10px] tracking-[0.35em] text-destructive font-mono-tabular mb-4 animate-pulse uppercase">
                Critical Intervention Required
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenario.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => commitDecision(action, 0.5)}
                    className="bg-destructive/10 hover:bg-destructive/20 border border-destructive/50 text-foreground py-6 px-4 text-center transition-colors"
                  >
                    <span className="text-lg tracking-wide uppercase">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 02 — RISK CALIBRATION */}
          {selectedAction &&
            scenario.mode !== "ordering" &&
            scenario.mode !== "interrupt" && (
              <div className="mb-10 animate-in fade-in duration-200">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-[10px] tracking-[0.35em] text-muted-foreground font-mono-tabular uppercase">
                    {scenario.mode === "allocation" ? "01 — ALLOCATE RESOURCES" : "02 — CALIBRATE"}
                  </div>
                  <div className={`text-xs font-mono-tabular ${calibTone}`}>{calibLabel}</div>
                </div>
                {scenario.mode !== "allocation" && (
                  <div className="text-sm text-muted-foreground mb-4">
                    Execution intensity —{" "}
                    <span className="text-foreground/80">{selectedAction.label}</span>
                  </div>
                )}

                {deltas && scenario.mode !== "blind" && (
                  <div className="flex gap-5 px-4 py-3 border border-border bg-card/40 mb-5 font-mono-tabular text-xs">
                    <DeltaIndicator label="STAB" value={deltas.stability} />
                    <DeltaIndicator label="COHE" value={deltas.trust} />
                    <DeltaIndicator label="BUFF" value={deltas.buffer} />
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
                    value={Math.round(riskLevel * 100)}
                    onChange={(e) => setRiskLevel(Number(e.target.value) / 100)}
                    className="relative w-full appearance-none bg-transparent h-6 cursor-pointer
                      [&::-webkit-slider-runnable-track]:h-6 [&::-webkit-slider-runnable-track]:bg-transparent
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/20 [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110
                      [&::-moz-range-track]:h-6 [&::-moz-range-track]:bg-transparent
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6)] [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/20 [&::-moz-range-thumb]:transition-transform hover:[&::-moz-range-thumb]:scale-110"
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] tracking-[0.35em] font-mono-tabular">
                  {scenario.mode === "allocation" ? (
                    <>
                      <span className="text-primary/80">{Math.round((1 - riskLevel) * 100)}% {scenario.leftLabel ?? "TASK A"}</span>
                      <span className="text-destructive/80">{Math.round(riskLevel * 100)}% {scenario.rightLabel ?? "TASK B"}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-primary/80">{scenario.leftLabel ?? "CONSERVATIVE"}</span>
                      <span className="text-destructive/80">{scenario.rightLabel ?? "AGGRESSIVE"}</span>
                    </>
                  )}
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <button
                    onClick={() => commitDecision(selectedAction, riskLevel)}
                    className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3 text-xs tracking-[0.35em] font-mono-tabular transition-colors"
                  >
                    COMMIT
                  </button>
                  {scenario.mode !== "allocation" && (
                    <button
                      onClick={() => { setSelectedAction(null); setReversalBlockedId(null); }}
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

      {/* INTERRUPT OVERLAY */}
      {(activeInterrupt || scenario.isInterrupt) && (
        <InterruptOverlay
          event={
            (activeInterrupt as unknown as Parameters<typeof InterruptOverlay>[0]["event"]) ?? {
              id: scenario.id,
              text: scenarioText,
              timeLimit: scenario.timeLimit,
              options: scenario.actions.map((a) => ({ id: a.id, label: a.label, impact: a.base })),
            }
          }
          onChoose={
            activeInterrupt
              ? handleInterruptChoice
              : (id) => {
                  const action = scenario.actions.find((a) => a.id === id)!;
                  commitDecision(action, 0.5);
                }
          }
        />
      )}
    </div>
  );
}

// ——— Co-located display atoms ———

function SystemMetricDisplay({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  delta?: number;
}) {
  const rounded = Math.round(value);
  const showDelta = delta !== undefined && Math.abs(delta) > 0;
  const deltaTone = (delta ?? 0) >= 0 ? "text-primary" : "text-destructive";
  return (
    <div className="flex flex-col items-center min-w-[110px]">
      <div className="flex items-baseline gap-1.5 font-mono-tabular text-[10px] tracking-[0.3em]">
        <span className="text-muted-foreground">{label}</span>
        {showDelta && (
          <span className={`${deltaTone} text-[10px]`}>
            {delta! > 0 ? "+" : ""}{delta}
          </span>
        )}
        <span className="text-foreground tabular-nums">{rounded}</span>
      </div>
      <div className="mt-1.5 h-[2px] w-24 bg-secondary overflow-hidden">
        <div className="h-full bg-primary transition-all duration-200" style={{ width: `${rounded}%` }} />
      </div>
    </div>
  );
}

function DeltaIndicator({ label, value }: { label: string; value: number }) {
  const tone = value > 0 ? "text-primary" : value < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={tone}>{value > 0 ? "+" : ""}{value}</span>
    </span>
  );
}
