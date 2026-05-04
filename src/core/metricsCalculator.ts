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

  // Count behavioral tags across all chosen actions
  const tagCounts = countTags(scenarioRecords);

  const strategyLabel = classifyStrategy(
    riskPreference, avgDecisionTimeMs, consistency,
    adaptability, decisionConflict, tagCounts, count
  );
  const behaviorInsight = generateInsight(
    riskPreference, avgDecisionTimeMs, consistency,
    adaptability, tagCounts, count
  );

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

/** Tally all behavioral tags from chosen actions across the session. */
function countTags(records: DecisionRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of records) {
    for (const tag of r.tags ?? []) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

/** Returns the tag with the highest count if it appears in ≥30% of decisions. */
function dominantTag(counts: Record<string, number>, total: number): string | null {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  const [topTag, topCount] = entries[0];
  if (topCount / total < 0.3) return null;
  return topTag;
}

function classifyStrategy(
  risk: number,
  avgTime: number,
  consistency: number,
  adaptability: number,
  conflict: number,
  tags: Record<string, number>,
  total: number
): string {
  const riskCount     = tags["risk"]              ?? 0;
  const ethicalCount  = tags["ethical"]            ?? 0;
  const selfishCount  = tags["selfish"]            ?? 0;
  const avoidantCount = tags["avoidant"]           ?? 0;
  const pressureCount = tags["pressure_sensitive"] ?? 0;
  const cautiousCount = tags["cautious"]           ?? 0;
  const assertiveCount = tags["assertive"]         ?? 0;

  // Ratios relative to total decisions made
  const riskRatio     = (riskCount + selfishCount) / total;
  const ethicalRatio  = (ethicalCount + assertiveCount) / total;
  const avoidRatio    = (avoidantCount + pressureCount) / total;
  const cautiousRatio = cautiousCount / total;

  // 1. Risk Taker — risk/selfish choices dominate, or fast + high calibration
  if (riskRatio >= 0.4 || (risk > 0.58 && avgTime < 5000)) {
    return "Risk Taker";
  }

  // 2. Ethical Anchor — ethical/assertive choices dominate, not avoidant
  if (ethicalRatio >= 0.4 && avoidRatio < 0.25) {
    return "Ethical Anchor";
  }

  // 3. Pressure Avoider — avoidant + pressure_sensitive dominate
  if (avoidRatio >= 0.4) {
    return "Pressure Avoider";
  }

  // 4. Cautious Analyst — slow deliberation + cautious choices + low risk calibration
  if ((cautiousRatio >= 0.3 || risk < 0.42) && avgTime > 5500) {
    return "Cautious Analyst";
  }

  // 5. Steady Strategist — tight band: genuinely consistent, low conflict, no dominant extreme
  if (consistency > 0.72 && conflict < 0.25 && riskRatio < 0.35 && avoidRatio < 0.3) {
    return "Steady Strategist";
  }

  // 6. Adaptive Operator — risk level shifts meaningfully with pressure
  if (adaptability > 0.62) {
    return "Adaptive Operator";
  }

  // 7. Tag-based tiebreak — use the single most common tag
  const top = dominantTag(tags, total);
  if (top === "risk" || top === "selfish")               return "Risk Taker";
  if (top === "ethical" || top === "assertive")          return "Ethical Anchor";
  if (top === "avoidant" || top === "pressure_sensitive") return "Pressure Avoider";
  if (top === "cautious" || top === "methodical")        return "Cautious Analyst";

  // 8. Genuine fallback — signals are truly mixed
  return "Balanced Operator";
}

function generateInsight(
  risk: number,
  avgTime: number,
  consistency: number,
  adaptability: number,
  tags: Record<string, number>,
  total: number
): string {
  const parts: string[] = [];

  const riskRatio    = ((tags["risk"] ?? 0) + (tags["selfish"] ?? 0)) / total;
  const ethicalRatio = ((tags["ethical"] ?? 0) + (tags["assertive"] ?? 0)) / total;
  const avoidRatio   = ((tags["avoidant"] ?? 0) + (tags["pressure_sensitive"] ?? 0)) / total;

  if (riskRatio >= 0.4)
    parts.push("You lean toward higher-risk choices");
  else if (ethicalRatio >= 0.4)
    parts.push("You consistently prioritize doing the right thing");
  else if (avoidRatio >= 0.4)
    parts.push("You tend to avoid confrontation under pressure");
  else if (risk < 0.42)
    parts.push("You favor cautious, careful execution");
  else
    parts.push("You balance risk and caution across situations");

  if (avgTime < 4000)
    parts.push("and commit quickly when pressed");
  else if (avgTime > 7000)
    parts.push("and take time to think before committing");
  else
    parts.push("and deliberate at a measured pace");

  if (consistency < 0.45)
    parts.push("Your approach shifts considerably across different situations");
  else if (consistency > 0.72)
    parts.push("Your decisions are notably consistent across contexts");

  if (adaptability > 0.62)
    parts.push("You adjust your strategy as pressure builds");

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
