/**
 * metricsCalculator.ts
 * Computes behavioral profile metrics from the full decision history.
 * All classification logic lives here — UI only receives structured results.
 */

import type { DecisionRecord } from "@/core/types";

export interface BehaviorProfile {
  avgDecisionTimeMs: number;
  riskPreference: number;   // 0..1
  consistency: number;      // 0..1
  adaptability: number;     // 0..1
  confidenceGap: number;    // 0..1 (high = long hesitation relative to decision)
  decisionConflict: number; // 0..1
  strategyLabel: string;
  behaviorInsight: string;
}

export function computeBehaviorProfile(records: DecisionRecord[]): BehaviorProfile {
  const scenarioRecords = records.filter((r) => !r.isInterrupt);
  const count = Math.max(1, scenarioRecords.length);

  const avgDecisionTimeMs =
    scenarioRecords.reduce((acc, r) => acc + r.decisionTimeMs, 0) / count;

  const risks = scenarioRecords.map((r) => r.risk);
  const riskPreference = risks.reduce((acc, r) => acc + r, 0) / count;

  const riskVariance =
    risks.reduce((acc, r) => acc + (r - riskPreference) ** 2, 0) / count;
  const consistency = Math.max(0, 1 - Math.sqrt(riskVariance) * 2);

  // Adaptability: correlation between escalating pressure and risk level
  const pressures = scenarioRecords.map((r) => 1 - r.pressure);
  const pressureRiskCorrelation = pearsonCorrelation(pressures, risks);
  const adaptability = Math.max(0, Math.min(1, (pressureRiskCorrelation + 1) / 2));

  const confidenceGap = Math.min(
    1,
    scenarioRecords.reduce((acc, r) => acc + r.hesitationMs, 0) / count / 4000
  );

  const decisionConflict = Math.min(1, riskVariance * 4);

  const strategyLabel = classifyStrategy(riskPreference, avgDecisionTimeMs, consistency, adaptability);
  const behaviorInsight = generateInsight(riskPreference, avgDecisionTimeMs, consistency, adaptability);

  return {
    avgDecisionTimeMs,
    riskPreference,
    consistency,
    adaptability,
    confidenceGap,
    decisionConflict,
    strategyLabel,
    behaviorInsight,
  };
}

function classifyStrategy(
  risk: number,
  avgTime: number,
  consistency: number,
  adaptability: number
): string {
  if (risk > 0.65 && avgTime < 4000) return "Aggressive Decider";
  if (risk < 0.35 && avgTime > 6000) return "Cautious Analyst";
  if (consistency > 0.75) return "Steady Strategist";
  if (adaptability > 0.7) return "Adaptive Operator";
  return "Balanced Operator";
}

function generateInsight(
  risk: number,
  avgTime: number,
  consistency: number,
  adaptability: number
): string {
  const parts: string[] = [];

  if (risk > 0.6) parts.push("You favor higher-risk execution");
  else if (risk < 0.4) parts.push("You favor conservative execution");
  else parts.push("You balance risk and caution");

  if (avgTime < 4000) parts.push("and decide quickly under pressure");
  else parts.push("and deliberate before committing");

  if (consistency < 0.5)
    parts.push("Your decisions vary considerably across similar contexts");
  else parts.push("Your decisions remain consistent across similar contexts");

  if (adaptability > 0.6) parts.push("You adapt strategy as pressure rises");

  return parts.join(". ") + ".";
}

function pearsonCorrelation(a: number[], b: number[]): number {
  if (a.length < 2) return 0;
  const meanA = a.reduce((x, y) => x + y, 0) / a.length;
  const meanB = b.reduce((x, y) => x + y, 0) / b.length;
  let numerator = 0, devA = 0, devB = 0;
  for (let i = 0; i < a.length; i++) {
    numerator += (a[i] - meanA) * (b[i] - meanB);
    devA += (a[i] - meanA) ** 2;
    devB += (b[i] - meanB) ** 2;
  }
  const denominator = Math.sqrt(devA * devB);
  return denominator === 0 ? 0 : numerator / denominator;
}
