/**
 * types.ts
 * Shared domain types for the PlayTrace behavioral engine.
 * These types form the contract between core logic, state, and UI layers.
 */

export type UserType = "Gaming" | "Creative" | "Analytical" | "General";

export interface SystemMetrics {
  stability: number;                // Structural integrity 0–100
  trust: number;                    // System coherence 0–100
  buffer: number;                   // Remaining time capital 0–100
  patternBreakersUsed: number;      // Number of unexpected reversals triggered
  delayedImpacts: {
    scenariosLeft: number;
    impact: { stability?: number; trust?: number; buffer?: number };
  }[];
}

export interface Action {
  id: string;
  label: string;
  hint?: string;
  base: { stability: number; trust: number; buffer: number };
  riskCurve: { stability: number; trust: number; buffer: number };
  next?: string;       // Target scenario ID — if absent, falls back to linear order
  tags?: string[];     // Behavioral labels: "risk", "ethical", "avoid", "cautious", etc.
}

export interface Scenario {
  id: string;
  eyebrow: string;
  text: string | ((metrics: SystemMetrics) => string);
  timeLimit: number;
  actions: Action[];
  tag?: "repeat" | "high-pressure" | "low-pressure";
  isInterrupt?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  mode?: "standard" | "interrupt" | "allocation" | "ordering" | "reversal" | "blind";
}

export interface DecisionRecord {
  scenarioId: string;
  actionId: string;
  risk: number;           // 0..1
  decisionTimeMs: number;
  hesitationMs: number;   // Time on calibration dial after first interaction
  committed: boolean;
  pressure: number;       // Remaining time ratio at moment of commit
  metricsBefore: SystemMetrics;
  metricsAfter: SystemMetrics;
  tag?: string;
  isInterrupt?: boolean;
  isPatternBreaker?: boolean;
  nextScenarioId?: string; // Where this decision routed the session
  tags?: string[];         // Behavioral tags from the chosen action
}

export interface InterruptEvent {
  id: string;
  text: string;
  timeLimit: number;
  options: {
    id: string;
    label: string;
    impact: { stability: number; trust: number; buffer: number };
  }[];
}

export type SessionStage = "welcome" | "consent" | "onboarding" | "classify" | "session" | "dashboard";

/**
 * DecisionLogEntry
 * Lightweight log of each decision — structured for future backend submission.
 * Maintained independently of DecisionRecord (which serves metric calculation).
 */
export interface DecisionLogEntry {
  stepId: string;      // Scenario ID
  choice: string;      // Action ID selected
  tags: string[];      // Behavioral tags from the action
  timestamp: number;   // Unix ms
  nextStepId: string | null; // Where the session routed after this choice
}
