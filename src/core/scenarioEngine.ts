/**
 * scenarioEngine.ts
 * Handles scenario sequence flow, mode transitions, and interrupt logic.
 * This is the authoritative source of truth for what happens next in the session.
 */

import { SCENARIOS } from "@/scenarios/scenarioRegistry";
import type { Scenario, Action, SystemMetrics } from "@/core/types";

export function getScenario(index: number): Scenario {
  return SCENARIOS[index];
}

export function totalScenarios(): number {
  return SCENARIOS.length;
}

export function isLastScenario(index: number): boolean {
  return index >= SCENARIOS.length - 1;
}

/**
 * Resolve which action to fall back to on timeout.
 * For ordered/allocation modes without a selected action, use last in list.
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
