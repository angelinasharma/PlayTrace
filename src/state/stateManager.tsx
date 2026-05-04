/**
 * stateManager.ts
 * Global system state — the single source of truth for the session.
 *
 * State shape:
 *   stability      → structural integrity of current decisions
 *   trust          → system coherence (renamed from "trust" in old lib)
 *   buffer         → remaining time capital (renamed from "time")
 *   history        → full record of all decisions made
 *   currentScenario → active scenario index
 */

import React, { createContext, useContext, useReducer } from "react";
import type { DecisionRecord, SystemMetrics } from "@/core/types";
import { clampMetrics } from "@/core/riskModel";

export interface EngineState {
  metrics: SystemMetrics;
  history: DecisionRecord[];
  currentScenario: number;
}

export const INITIAL_METRICS: SystemMetrics = {
  stability: 75,
  trust: 70,
  buffer: 65,
  patternBreakersUsed: 0,
  delayedImpacts: [],
};

const INITIAL_ENGINE_STATE: EngineState = {
  metrics: INITIAL_METRICS,
  history: [],
  currentScenario: 0,
};

type EngineAction =
  | { type: "RECORD_DECISION"; record: DecisionRecord; nextMetrics: SystemMetrics }
  | { type: "ADVANCE_SCENARIO" }
  | { type: "RESET" };

function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case "RECORD_DECISION":
      return {
        ...state,
        metrics: clampMetrics(action.nextMetrics),
        history: [...state.history, action.record],
      };
    case "ADVANCE_SCENARIO":
      return {
        ...state,
        currentScenario: state.currentScenario + 1,
      };
    case "RESET":
      return INITIAL_ENGINE_STATE;
    default:
      return state;
  }
}

interface EngineContextValue {
  state: EngineState;
  recordDecision: (record: DecisionRecord, nextMetrics: SystemMetrics) => void;
  advanceScenario: () => void;
  reset: () => void;
}

const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(engineReducer, INITIAL_ENGINE_STATE);

  const recordDecision = (record: DecisionRecord, nextMetrics: SystemMetrics) =>
    dispatch({ type: "RECORD_DECISION", record, nextMetrics });

  const advanceScenario = () => dispatch({ type: "ADVANCE_SCENARIO" });

  const reset = () => dispatch({ type: "RESET" });

  return (
    <EngineContext.Provider value={{ state, recordDecision, advanceScenario, reset }}>
      {children}
    </EngineContext.Provider>
  );
}

export function useEngineState(): EngineContextValue {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error("useEngineState must be used within EngineStateProvider");
  return ctx;
}
