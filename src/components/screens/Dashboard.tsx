import { computeMetrics, DecisionRecord } from "@/lib/state";
import { UserType } from "@/lib/scenarios";

interface Props {
  records: DecisionRecord[];
  userType: UserType;
  onRestart: () => void;
}

export function Dashboard({ records, userType, onRestart }: Props) {
  const m = computeMetrics(records);
  const scenarioRecs = records.filter(r => !r.isInterrupt);

  return (
    <div className="min-h-screen px-6 py-12 max-w-5xl mx-auto">
      <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-2">SESSION REPORT</div>
      <h1 className="text-3xl md:text-4xl font-light mb-1">{m.strategy}</h1>
      <div className="text-sm text-muted-foreground mb-12">Profile: {userType}</div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border mb-12">
        <Metric label="Avg Decision Time" value={`${(m.avgDecisionTimeMs / 1000).toFixed(1)}s`} />
        <Metric label="Risk Preference" value={`${Math.round(m.riskPreference * 100)}%`} />
        <Metric label="Consistency" value={`${Math.round(m.consistency * 100)}%`} />
        <Metric label="Adaptability" value={`${Math.round(m.adaptability * 100)}%`} />
        <Metric label="Confidence Gap" value={`${Math.round(m.confidenceGap * 100)}%`} />
        <Metric label="Decision Conflict" value={`${Math.round(m.conflict * 100)}%`} />
      </div>

      {/* Insight */}
      <div className="border-l-2 border-primary pl-4 mb-12">
        <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-2">INSIGHT</div>
        <p className="text-lg font-light text-foreground">{m.insight}</p>
      </div>

      {/* Risk over time */}
      <Section title="Risk Trend Over Time">
        <RiskTrend records={scenarioRecs} />
      </Section>

      {/* Early vs late */}
      <Section title="Early vs Late Decisions">
        <EarlyLate records={scenarioRecs} />
      </Section>

      {/* Consistency */}
      <Section title="Decision Time Variation">
        <TimeVariation records={scenarioRecs} />
      </Section>

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-5">
      <div className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-2">{label}</div>
      <div className="text-2xl font-light font-mono-tabular text-foreground">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-4">{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

function RiskTrend({ records }: { records: DecisionRecord[] }) {
  if (!records.length) return null;
  const w = 600, h = 120, pad = 10;
  const step = (w - pad * 2) / Math.max(1, records.length - 1);
  const pts = records.map((r, i) => `${pad + i * step},${pad + (1 - r.risk) * (h - pad * 2)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 border border-border bg-card/50">
      <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="hsl(var(--border))" strokeDasharray="2 4" />
      <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      {records.map((r, i) => (
        <circle key={i} cx={pad + i * step} cy={pad + (1 - r.risk) * (h - pad * 2)} r="2.5" fill="hsl(var(--primary))" />
      ))}
    </svg>
  );
}

function EarlyLate({ records }: { records: DecisionRecord[] }) {
  const half = Math.ceil(records.length / 2);
  const early = records.slice(0, half);
  const late = records.slice(half);
  const avg = (rs: DecisionRecord[]) => ({
    risk: rs.reduce((a, r) => a + r.risk, 0) / Math.max(1, rs.length),
    time: rs.reduce((a, r) => a + r.decisionTimeMs, 0) / Math.max(1, rs.length),
  });
  const e = avg(early), l = avg(late);
  return (
    <div className="grid grid-cols-2 gap-px bg-border">
      <Compare title="Early" risk={e.risk} time={e.time} />
      <Compare title="Late" risk={l.risk} time={l.time} />
    </div>
  );
}

function Compare({ title, risk, time }: { title: string; risk: number; time: number }) {
  return (
    <div className="bg-background p-5">
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-3">{title.toUpperCase()}</div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>RISK</span><span className="font-mono-tabular">{Math.round(risk * 100)}%</span></div>
          <div className="h-1 bg-secondary"><div className="h-full bg-primary" style={{ width: `${risk * 100}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>TIME</span><span className="font-mono-tabular">{(time / 1000).toFixed(1)}s</span></div>
          <div className="h-1 bg-secondary"><div className="h-full bg-accent" style={{ width: `${Math.min(100, time / 100)}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

function TimeVariation({ records }: { records: DecisionRecord[] }) {
  if (!records.length) return null;
  const max = Math.max(...records.map(r => r.decisionTimeMs), 1);
  return (
    <div className="flex items-end gap-1 h-24 border border-border bg-card/50 p-3">
      {records.map((r, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/70 hover:bg-primary transition-colors"
          style={{ height: `${(r.decisionTimeMs / max) * 100}%` }}
          title={`${(r.decisionTimeMs / 1000).toFixed(1)}s`}
        />
      ))}
    </div>
  );
}
