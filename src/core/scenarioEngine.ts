/**
 * scenarioEngine.ts
 * Navigation engine for the branching scenario graph.
 *
 * Key exports:
 *   SCENARIO_MAP     → O(1) lookup of any scenario by ID
 *   ORDERED_IDS      → Default linear fallback order (used when action.next is absent)
 *   getNextScenarioId → Generic navigation function — no hardcoded if/else per step
 */

import { ALL_SCENARIOS } from "@/scenarios/scenarioRegistry";
import type { Scenario, Action, SystemMetrics } from "@/core/types";

// ─── SCENARIO LOOKUP MAP ──────────────────────────────────────────────────────

/** O(1) lookup by scenario ID. Covers all base + branch variant scenarios. */
export const SCENARIO_MAP: Map<string, Scenario> = new Map(
  ALL_SCENARIOS.map((s) => [s.id, s])
);

/**
 * Default linear order — defines the fallback sequence for actions that
 * do not specify a `next` ID. Branch variant IDs are not listed here;
 * they always declare explicit `next` values on their actions.
 */
export const ORDERED_IDS: string[] = [
  "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10",
];

// ─── NAVIGATION ENGINE ────────────────────────────────────────────────────────

/**
 * Generic navigation function — the single source of routing truth.
 *
 * Priority:
 *   1. action.next (explicit branch target)
 *   2. Next ID in ORDERED_IDS (linear fallback)
 *   3. null → session is complete
 *
 * No if/else chains per step. Adding a new branch = add action.next to the registry.
 */
export function getNextScenarioId(
  currentScenario: Scenario,
  chosenAction: Action
): string | null {
  // Explicit branch wins
  if (chosenAction.next) return chosenAction.next;

  // Linear fallback via ORDERED_IDS
  const pos = ORDERED_IDS.indexOf(currentScenario.id);
  if (pos >= 0 && pos < ORDERED_IDS.length - 1) {
    return ORDERED_IDS[pos + 1];
  }

  // At s10 or unknown — session ends
  return null;
}

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Resolve which action to fall back to on timeout.
 */
export function resolveTimeoutAction(scenario: Scenario, selectedAction: Action | null): Action {
  if (selectedAction) return selectedAction;
  return scenario.actions[scenario.actions.length - 1];
}

/**
 * Resolve scenario text — handles both static strings and dynamic metric-dependent text.
 */
export function resolveScenarioText(scenario: Scenario, metrics: SystemMetrics): string {
  return typeof scenario.text === "function" ? scenario.text(metrics) : scenario.text;
}

/**
 * Determine the default selected action for allocation-mode scenarios.
 */
export function resolveDefaultAction(scenario: Scenario): Action | null {
  if (scenario.mode === "allocation") {
    return (
      scenario.actions.find((a) => a.label.toLowerCase().includes("balance")) ??
      scenario.actions[0]
    );
  }
  return null;
}

/**
 * Returns the calibration label based on a risk value (0..1).
 */
export function calibrationLabel(risk: number): string {
  if (risk < 0.2) return "Conservative";
  if (risk < 0.45) return "Cautious";
  if (risk < 0.55) return "Balanced";
  if (risk < 0.8) return "Assertive";
  return "Aggressive";
}

/**
 * Returns the Tailwind tone class for a given risk value.
 */
export function calibrationTone(risk: number): string {
  if (risk < 0.35) return "text-primary";
  if (risk < 0.65) return "text-accent";
  return "text-destructive";
}
