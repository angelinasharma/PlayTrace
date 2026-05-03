import { useState } from "react";
import { Welcome } from "@/components/screens/Welcome";
import { Consent } from "@/components/screens/Consent";
import { Classify } from "@/components/screens/Classify";
import { Session } from "@/components/screens/Session";
import { Dashboard } from "@/components/screens/Dashboard";
import { classify } from "@/lib/state";
import { UserType } from "@/lib/scenarios";
import type { DecisionRecord } from "@/lib/state";

type Stage = "welcome" | "consent" | "classify" | "session" | "dashboard";

const Index = () => {
  const [stage, setStage] = useState<Stage>("welcome");
  const [userType, setUserType] = useState<UserType>("General");
  const [records, setRecords] = useState<DecisionRecord[]>([]);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {stage === "welcome" && <Welcome onBegin={() => setStage("consent")} />}
      {stage === "consent" && <Consent onContinue={() => setStage("classify")} />}
      {stage === "classify" && (
        <Classify onDone={(h, b) => { setUserType(classify(h, b)); setStage("session"); }} />
      )}
      {stage === "session" && (
        <Session onDone={(r) => { setRecords(r); setStage("dashboard"); }} />
      )}
      {stage === "dashboard" && (
        <Dashboard records={records} userType={userType} onRestart={() => { setRecords([]); setStage("welcome"); }} />
      )}
    </div>
  );
};

export default Index;
