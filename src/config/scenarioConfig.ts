/**
 * scenarioConfig.ts
 * Central lookup map for human-readable scenario and action text.
 *
 * Auto-derived from the authoritative scenarioRegistry — no duplication.
 * Used by the frontend to enrich decision payloads before sending to the backend.
 *
 * Shape:
 *   { [scenarioId]: { text: string, options: { [actionId]: string } } }
 *
 * Scenarios with dynamic (function-based) text store "[dynamic]" as a placeholder;
 * the actual resolved text is passed at decision time from ScenarioEngine.
 */

import { ALL_SCENARIOS } from "@/scenarios/scenarioRegistry";

export const SCENARIOS_CONFIG: Record<
  string,
  { text: string; options: Record<string, string> }
> = Object.fromEntries(
  ALL_SCENARIOS.map((s) => [
    s.id,
    {
      text: typeof s.text === "function" ? "[dynamic]" : s.text,
      options: Object.fromEntries(s.actions.map((a) => [a.id, a.label])),
    },
  ])
);
