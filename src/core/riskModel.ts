/**
 * riskModel.ts
 * Maps selected actions and calibration risk values to concrete system metric impacts.
 * Contains all pressure modifiers, delayed-impact mechanics, and pattern-breaker logic.
 */

import type { Action, SystemMetrics } from "@/core/types";

export const INITIAL_METRICS: SystemMetrics = {
  stability: 75,
  trust: 70,
  buffer: 65,
  patternBreakersUsed: 0,
  delayedImpacts: [],
};

interface ImpactResult {
  metrics: SystemMetrics;
  isPatternBreaker: boolean;
}

/**
 * Apply an action's impact to the current system state, factoring in
 * the risk calibration (0..1) and the scenario index (for escalating pressure).
 */
export function applyImpact(
  current: SystemMetrics,
  action: Action,
  risk: number,
  scenarioIndex: number,
  isPreview = false
): ImpactResult {
  const k = risk - 0.5;

  let ruleShiftMod = 1;
  let tradeOffMod = 1;
  if (scenarioIndex >= 4) {
    if (risk < 0.4) ruleShiftMod = 0.5;
    tradeOffMod = 1.3;
  }

  let dStability =
    action.base.stability * (action.base.stability > 0 ? ruleShiftMod : tradeOffMod) +
    k * action.riskCurve.stability;
  let dTrust =
    action.base.trust * (action.base.trust > 0 ? ruleShiftMod : tradeOffMod) +
    k * action.riskCurve.trust;
  let dBuffer =
    action.base.buffer * (action.base.buffer > 0 ? ruleShiftMod : tradeOffMod) +
    k * action.riskCurve.buffer;

  // Pattern breaker: occasional unexpected reversal of outcomes
  let isPatternBreaker = false;
  if (!isPreview && current.patternBreakersUsed < 2 && Math.random() < 0.15) {
    isPatternBreaker = true;
    dStability *= -1.2;
    dTrust *= -1.2;
    dBuffer *= -1.2;
  }

  // Enforce minimum significant impact — at least 2 dimensions must show meaningful change
  let significantCount = 0;
  if (Math.abs(dStability) > 2) significantCount++;
  if (Math.abs(dTrust) > 2) significantCount++;
  if (Math.abs(dBuffer) > 2) significantCount++;

  if (significantCount < 2) {
    if (Math.abs(dStability) <= 2) dStability -= 4;
    if (Math.abs(dTrust) <= 2) dTrust -= 4;
  }

  // Advance and resolve delayed impacts
  let pending = current.delayedImpacts.map((d) => ({ ...d, scenariosLeft: d.scenariosLeft - 1 }));

  let resolvedStability = 0;
  let resolvedTrust = 0;
  let resolvedBuffer = 0;

  if (!isPreview) {
    const ready = pending.filter((d) => d.scenariosLeft <= 0);
    ready.forEach((d) => {
      resolvedStability += d.impact.stability ?? 0;
      resolvedTrust += d.impact.trust ?? 0;
      resolvedBuffer += d.impact.buffer ?? 0;
    });
    pending = pending.filter((d) => d.scenariosLeft > 0);

    // 25% chance to split this impact — defer half to 2 scenarios ahead
    if (Math.random() < 0.25) {
      pending.push({
        scenariosLeft: 2,
        impact: { stability: dStability * 0.5, trust: dTrust * 0.5, buffer: dBuffer * 0.5 },
      });
      dStability *= 0.5;
      dTrust *= 0.5;
      dBuffer *= 0.5;
    }
  }

  return {
    metrics: clampMetrics({
      ...current,
      stability: current.stability + dStability + resolvedStability,
      trust: current.trust + dTrust + resolvedTrust,
      buffer: current.buffer + dBuffer + resolvedBuffer,
      patternBreakersUsed: current.patternBreakersUsed + (isPatternBreaker ? 1 : 0),
      delayedImpacts: pending,
    }),
    isPatternBreaker,
  };
}

/**
 * Preview the result of an action without triggering stochastic side effects.
 */
export function previewImpact(
  current: SystemMetrics,
  action: Action,
  risk: number,
  scenarioIndex: number
): SystemMetrics {
  return applyImpact(current, action, risk, scenarioIndex, true).metrics;
}

/**
 * Adapt scenario time limit based on buffer pressure.
 * Higher pressure → less time granted per scenario.
 */
export function adaptTimeLimit(baseSeconds: number, current: SystemMetrics): number {
  const pressure = (100 - current.buffer) / 100;
  return Math.max(5, Math.round(baseSeconds * (1 - pressure * 0.4)));
}

export function clampMetrics(metrics: SystemMetrics): SystemMetrics {
  return {
    ...metrics,
    stability: Math.max(0, Math.min(100, metrics.stability)),
    trust: Math.max(0, Math.min(100, metrics.trust)),
    buffer: Math.max(0, Math.min(100, metrics.buffer)),
  };
}
