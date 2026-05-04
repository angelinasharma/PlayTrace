import { useState } from "react";
import { Welcome } from "@/components/screens/Welcome";
import { Consent } from "@/components/screens/Consent";
import { Classify } from "@/components/screens/Classify";
import { Session } from "@/components/screens/Session";
import { Dashboard } from "@/components/screens/Dashboard";
import { classify, computeMetrics } from "@/lib/state";
import { UserType } from "@/lib/scenarios";
import type { DecisionRecord } from "@/lib/state";

type Stage = "welcome" | "consent" | "classify" | "session" | "dashboard";

const Index = () => {
  const [stage, setStage] = useState<Stage>("welcome");
  const [userType, setUserType] = useState<UserType>("General");
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const [consent, setConsent] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const startSession = async (type: UserType) => {
    setUserType(type);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileType: type, 
          character: "default", 
          consentToDataCollection: consent 
        })
      });
      const data = await res.json();
      setSessionId(data.sessionId);
    } catch(e) { console.error(e) }
    setStage("session");
  };

  const finishSession = (r: DecisionRecord[]) => {
    setRecords(r);
    setStage("dashboard");
    if (sessionId) {
      const metrics = computeMetrics(r);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endedAt: Date.now(),
          completed: true,
          failureType: null,
          finalResources: {
            energy: r[r.length-1]?.stateAfter.stability || 0,
            supplies: r[r.length-1]?.stateAfter.trust || 0,
            morale: r[r.length-1]?.stateAfter.time || 0
          },
          finalRiskLevel: r[r.length-1]?.risk ? r[r.length-1].risk * 100 : 0,
          metrics: {
            avgDecisionTime: metrics.avgDecisionTimeMs,
            riskRatio: metrics.riskPreference,
            consistency: metrics.consistency,
            exploration: metrics.adaptability,
            playerType: metrics.strategy,
            totalTimeSpentMs: r.reduce((acc, rec) => acc + rec.decisionTimeMs, 0),
            riskyDecisions: r.filter(x => x.risk > 0.6).length,
            safeDecisions: r.filter(x => x.risk < 0.4).length,
            neutralDecisions: r.filter(x => x.risk >= 0.4 && x.risk <= 0.6).length
          }
        })
      }).catch(console.error);
    }
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {stage === "welcome" && <Welcome onBegin={() => setStage("consent")} />}
      {stage === "consent" && <Consent onContinue={(agreed) => { setConsent(agreed); setStage("classify"); }} />}
      {stage === "classify" && (
        <Classify onDone={startSession} />
      )}
      {stage === "session" && (
        <Session sessionId={sessionId} profileType={userType} onDone={finishSession} />
      )}
      {stage === "dashboard" && (
        <Dashboard records={records} userType={userType} onRestart={() => { setRecords([]); setStage("welcome"); }} />
      )}
    </div>
  );
};

export default Index;
