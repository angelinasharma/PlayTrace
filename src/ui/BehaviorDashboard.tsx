/**
 * BehaviorDashboard.tsx
 * Post-session behavioral analysis report.
 * Renders computed profile metrics and visual decision traces.
 */

import React from "react";
import { computeBehaviorProfile } from "@/core/metricsCalculator";
import { FeedbackInline } from "@/ui/FeedbackInline";
import type { DecisionRecord, DecisionLogEntry, UserType } from "@/core/types";

interface Props {
  records: DecisionRecord[];
  decisionLog: DecisionLogEntry[]; // Full behavioral log — ready for backend submission
  sessionId: string;
  userType: UserType;
  onRestart: () => void;
}

export function BehaviorDashboard({ records, decisionLog: _decisionLog, sessionId, userType, onRestart }: Props) {
  const profile = computeBehaviorProfile(records);
  const scenarioRecords = records.filter((r) => !r.isInterrupt);

  return (
    <div className="min-h-screen px-6 py-12 max-w-5xl mx-auto">
      <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-2">SESSION REPORT</div>
      <h1 className="text-3xl md:text-4xl font-light mb-1">{profile.strategyLabel}</h1>
      <div className="text-sm text-muted-foreground mb-12">Profile: {userType}</div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border mb-12">
        <MetricCell label="Avg Decision Time" value={`${(profile.avgDecisionTimeMs / 1000).toFixed(1)}s`} />
        <MetricCell label="Risk Preference" value={`${Math.round(profile.riskPreference * 100)}%`} />
        <MetricCell label="Consistency" value={`${Math.round(profile.consistency * 100)}%`} />
        <MetricCell label="Adaptability" value={`${Math.round(profile.adaptability * 100)}%`} />
        <MetricCell label="Confidence Gap" value={`${Math.round(profile.confidenceGap * 100)}%`} />
        <MetricCell label="Decision Conflict" value={`${Math.round(profile.decisionConflict * 100)}%`} />
      </div>

      <div className="border-l-2 border-primary pl-4 mb-12">
        <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-2">INSIGHT</div>
        <p className="text-lg font-light text-foreground">{profile.behaviorInsight}</p>
      </div>

      <ReportSection title="Risk Trend Over Time">
        <RiskTrendChart records={scenarioRecords} />
      </ReportSection>

      <ReportSection title="Early vs Late Decisions">
        <EarlyLateComparison records={scenarioRecords} />
      </ReportSection>

      <ReportSection title="Decision Time Variation">
        <DecisionTimeChart records={scenarioRecords} />
      </ReportSection>

      <FeedbackInline sessionId={sessionId} />

      <button
        onClick={onRestart}
        className="mt-12 inline-flex items-center gap-3 border border-foreground/20 hover:border-primary px-8 py-3 transition-colors"
      >
        <span className="text-xs tracking-[0.3em]">RUN AGAIN</span>
        <span className="text-primary">↻</span>
      </button>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-5">
      <div className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-2">{label}</div>
      <div className="text-2xl font-light font-mono-tabular text-foreground">{value}</div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-4">{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

function RiskTrendChart({ records }: { records: DecisionRecord[] }) {
  if (!records.length) return null;
  const w = 600, h = 120, pad = 10;
  const step = (w - pad * 2) / Math.max(1, records.length - 1);
  const points = records
    .map((r, i) => `${pad + i * step},${pad + (1 - r.risk) * (h - pad * 2)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 border border-border bg-card/50">
      <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="hsl(var(--border))" strokeDasharray="2 4" />
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      {records.map((r, i) => (
        <circle
          key={i}
          cx={pad + i * step}
          cy={pad + (1 - r.risk) * (h - pad * 2)}
          r="2.5"
          fill="hsl(var(--primary))"
        />
      ))}
    </svg>
  );
}

function EarlyLateComparison({ records }: { records: DecisionRecord[] }) {
  const half = Math.ceil(records.length / 2);
  const early = records.slice(0, half);
  const late = records.slice(half);

  const avg = (rs: DecisionRecord[]) => ({
    risk: rs.reduce((a, r) => a + r.risk, 0) / Math.max(1, rs.length),
    time: rs.reduce((a, r) => a + r.decisionTimeMs, 0) / Math.max(1, rs.length),
  });

  const earlyAvg = avg(early);
  const lateAvg = avg(late);

  return (
    <div className="grid grid-cols-2 gap-px bg-border">
      <PhaseCompare label="Early" risk={earlyAvg.risk} time={earlyAvg.time} />
      <PhaseCompare label="Late" risk={lateAvg.risk} time={lateAvg.time} />
    </div>
  );
}

function PhaseCompare({ label, risk, time }: { label: string; risk: number; time: number }) {
  return (
    <div className="bg-background p-5">
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-3">{label.toUpperCase()}</div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>RISK</span>
            <span className="font-mono-tabular">{Math.round(risk * 100)}%</span>
          </div>
          <div className="h-1 bg-secondary">
            <div className="h-full bg-primary" style={{ width: `${risk * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>TIME</span>
            <span className="font-mono-tabular">{(time / 1000).toFixed(1)}s</span>
          </div>
          <div className="h-1 bg-secondary">
            <div className="h-full bg-accent" style={{ width: `${Math.min(100, time / 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionTimeChart({ records }: { records: DecisionRecord[] }) {
  if (!records.length) return null;
  const maxTime = Math.max(...records.map((r) => r.decisionTimeMs), 1);
  return (
    <div className="flex items-end gap-1 h-24 border border-border bg-card/50 p-3">
      {records.map((r, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/70 hover:bg-primary transition-colors"
          style={{ height: `${(r.decisionTimeMs / maxTime) * 100}%` }}
          title={`${(r.decisionTimeMs / 1000).toFixed(1)}s`}
        />
      ))}
    </div>
  );
}
