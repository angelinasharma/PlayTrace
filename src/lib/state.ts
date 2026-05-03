import { Action, Scenario, UserType } from "./scenarios";

export interface SystemState {
  stability: number;
  trust: number;
  time: number;
  patternBreakersUsed: number;
  delayedImpacts: { scenariosLeft: number; impact: { stability?: number; trust?: number; time?: number } }[];
}

export const INITIAL_STATE: SystemState = { stability: 75, trust: 70, time: 65, patternBreakersUsed: 0, delayedImpacts: [] };

export interface DecisionRecord {
  scenarioId: string;
  actionId: string;
  risk: number; // 0..1
  decisionTimeMs: number;
  hesitationMs: number; // time spent on dial after first interaction
  committed: boolean;
  pressure: number; // remaining time ratio at commit
  stateBefore: SystemState;
  stateAfter: SystemState;
  tag?: string;
  isInterrupt?: boolean;
  isPatternBreaker?: boolean;
}

export function applyImpact(state: SystemState, action: Action, risk: number, idx: number, isPreview = false): { state: SystemState; isPatternBreaker: boolean } {
  const k = risk - 0.5;

  let ruleShiftMod = 1;
  let tradeOffMod = 1;
  if (idx >= 4) {
    if (risk < 0.4) ruleShiftMod = 0.5;
    tradeOffMod = 1.3;
  }

  let dStab = (action.base.stability * (action.base.stability > 0 ? ruleShiftMod : tradeOffMod)) + k * action.riskCurve.stability;
  let dTrust = (action.base.trust * (action.base.trust > 0 ? ruleShiftMod : tradeOffMod)) + k * action.riskCurve.trust;
  let dTime = (action.base.time * (action.base.time > 0 ? ruleShiftMod : tradeOffMod)) + k * action.riskCurve.time;

  let isPatternBreaker = false;
  if (!isPreview && state.patternBreakersUsed < 2 && Math.random() < 0.15) {
    isPatternBreaker = true;
    dStab *= -1.2;
    dTrust *= -1.2;
    dTime *= -1.2;
  }

  let sigCount = 0;
  if (Math.abs(dStab) > 2) sigCount++;
  if (Math.abs(dTrust) > 2) sigCount++;
  if (Math.abs(dTime) > 2) sigCount++;

  if (sigCount < 2) {
    if (Math.abs(dStab) <= 2) dStab -= 4;
    if (Math.abs(dTrust) <= 2) dTrust -= 4;
  }

  let delayedImpacts = state.delayedImpacts.map(di => ({ ...di, scenariosLeft: di.scenariosLeft - 1 }));
  
  let resolvedStab = 0;
  let resolvedTrust = 0;
  let resolvedTime = 0;

  if (!isPreview) {
    const ready = delayedImpacts.filter(di => di.scenariosLeft <= 0);
    ready.forEach(di => {
      resolvedStab += di.impact.stability || 0;
      resolvedTrust += di.impact.trust || 0;
      resolvedTime += di.impact.time || 0;
    });
    delayedImpacts = delayedImpacts.filter(di => di.scenariosLeft > 0);

    if (Math.random() < 0.25) {
      delayedImpacts.push({
        scenariosLeft: 2,
        impact: { stability: dStab * 0.5, trust: dTrust * 0.5, time: dTime * 0.5 }
      });
      dStab *= 0.5;
      dTrust *= 0.5;
      dTime *= 0.5;
    }
  }

  return {
    state: clampState({
      ...state,
      stability: state.stability + dStab + resolvedStab,
      trust: state.trust + dTrust + resolvedTrust,
      time: state.time + dTime + resolvedTime,
      patternBreakersUsed: state.patternBreakersUsed + (isPatternBreaker ? 1 : 0),
      delayedImpacts
    }),
    isPatternBreaker
  };
}

export function previewImpact(state: SystemState, action: Action, risk: number, idx: number): SystemState {
  return applyImpact(state, action, risk, idx, true).state;
}

export function clampState(s: SystemState): SystemState {
  return {
    ...s,
    stability: Math.max(0, Math.min(100, s.stability)),
    trust: Math.max(0, Math.min(100, s.trust)),
    time: Math.max(0, Math.min(100, s.time)),
  };
}

// adapt scenario time based on current state pressure
export function adaptTimeLimit(base: number, state: SystemState): number {
  const pressure = (100 - state.time) / 100; // higher pressure -> less time
  return Math.max(5, Math.round(base * (1 - pressure * 0.4)));
}

export function classify(hours: string, background: string): UserType {
  if (hours === "5+") return "Gaming";
  if (background === "creative") return "Creative";
  if (background === "analytical") return "Analytical";
  return "General";
}

export interface Metrics {
  avgDecisionTimeMs: number;
  riskPreference: number; // 0..1
  consistency: number; // 0..1
  adaptability: number; // 0..1
  confidenceGap: number; // 0..1
  conflict: number; // 0..1
  strategy: string;
  insight: string;
}

export function computeMetrics(records: DecisionRecord[]): Metrics {
  const scenarioRecs = records.filter(r => !r.isInterrupt);
  const avg = scenarioRecs.reduce((a, r) => a + r.decisionTimeMs, 0) / Math.max(1, scenarioRecs.length);
  const risks = scenarioRecs.map(r => r.risk);
  const meanRisk = risks.reduce((a, b) => a + b, 0) / Math.max(1, risks.length);
  const variance = risks.reduce((a, b) => a + (b - meanRisk) ** 2, 0) / Math.max(1, risks.length);
  const consistency = Math.max(0, 1 - Math.sqrt(variance) * 2);

  // adaptability: how much risk shifted relative to pressure
  const pressureCorr = correlate(scenarioRecs.map(r => 1 - r.pressure), risks);
  const adaptability = Math.max(0, Math.min(1, (pressureCorr + 1) / 2));

  const confidenceGap = Math.min(1, scenarioRecs.reduce((a, r) => a + r.hesitationMs, 0) / Math.max(1, scenarioRecs.length) / 4000);

  // repeated scenarios — measure conflict
  const groups = new Map<string, DecisionRecord[]>();
  for (const r of scenarioRecs) {
    const key = r.scenarioId.replace(/\d+$/, "");
    if (!groups.has(r.actionId)) groups.set(r.actionId, []);
    groups.get(r.actionId)!.push(r);
  }
  const conflict = Math.min(1, variance * 4);

  let strategy = "Balanced Operator";
  if (meanRisk > 0.65 && avg < 4000) strategy = "Aggressive Decider";
  else if (meanRisk < 0.35 && avg > 6000) strategy = "Cautious Analyst";
  else if (consistency > 0.75) strategy = "Steady Strategist";
  else if (adaptability > 0.7) strategy = "Adaptive Operator";

  const insight = generateInsight(meanRisk, avg, consistency, adaptability);

  return {
    avgDecisionTimeMs: avg,
    riskPreference: meanRisk,
    consistency,
    adaptability,
    confidenceGap,
    conflict,
    strategy,
    insight,
  };
}

function correlate(a: number[], b: number[]): number {
  if (a.length < 2) return 0;
  const ma = a.reduce((x, y) => x + y, 0) / a.length;
  const mb = b.reduce((x, y) => x + y, 0) / b.length;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

function generateInsight(risk: number, avg: number, cons: number, adapt: number): string {
  const parts: string[] = [];
  if (risk > 0.6) parts.push("You favor higher-risk execution");
  else if (risk < 0.4) parts.push("You favor conservative execution");
  else parts.push("You balance risk and caution");
  if (avg < 4000) parts.push("and decide quickly under pressure");
  else parts.push("and deliberate before committing");
  if (cons < 0.5) parts.push("Your decisions vary considerably across similar contexts");
  else parts.push("Your decisions remain consistent across similar contexts");
  if (adapt > 0.6) parts.push("You adapt strategy as pressure rises");
  return parts.join(". ") + ".";
}
