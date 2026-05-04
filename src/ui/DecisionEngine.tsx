/**
 * DecisionEngine.tsx
 * Root session orchestrator — manages stage transitions across the full session lifecycle.
 *
 * Stage flow: welcome → consent → classify → session → dashboard
 *
 * Stage transitions are centralized here. Each child screen receives only what it needs
 * to perform its role, and reports back via a single callback.
 */

import { useState } from "react";
import { WelcomeGate } from "@/ui/WelcomeGate";
import { ConsentGate } from "@/ui/ConsentGate";
import { OnboardingFlow } from "@/ui/OnboardingFlow";
import { ParticipantClassifier } from "@/ui/ParticipantClassifier";
import { ScenarioEngine } from "@/ui/ScenarioEngine";
import { BehaviorDashboard } from "@/ui/BehaviorDashboard";
import { startSession } from "@/lib/api";
import type { DecisionRecord, DecisionLogEntry, SessionStage, UserType } from "@/core/types";

function classifyUserType(hours: string, background: string): UserType {
  if (hours === "5+") return "Gaming";
  if (background === "creative") return "Creative";
  if (background === "analytical") return "Analytical";
  return "General";
}

export function DecisionEngine() {
  const [stage, setStage] = useState<SessionStage>("welcome");
  const [userType, setUserType] = useState<UserType>("General");
  const [sessionRecords, setSessionRecords] = useState<DecisionRecord[]>([]);
  const [sessionLog, setSessionLog] = useState<DecisionLogEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('playtrace_session_id'));

  const handleOnboardingComplete = async () => {
    setStage("classify");
    const id = await startSession();
    if (id) setSessionId(id);
  };

  const handleClassified = (hours: string, background: string) => {
    setUserType(classifyUserType(hours, background));
    setStage("session");
  };

  const handleSessionComplete = (records: DecisionRecord[], log: DecisionLogEntry[]) => {
    setSessionRecords(records);
    setSessionLog(log);
    setStage("dashboard");
  };

  const handleRestart = () => {
    setSessionRecords([]);
    setSessionLog([]);
    setStage("welcome");
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {stage === "welcome" && <WelcomeGate onBegin={() => setStage("consent")} />}
      {stage === "consent" && <ConsentGate onConsent={() => setStage("onboarding")} />}
      {stage === "onboarding" && <OnboardingFlow onComplete={handleOnboardingComplete} />}
      {stage === "classify" && <ParticipantClassifier onClassified={handleClassified} />}
      {stage === "session" && <ScenarioEngine sessionId={sessionId} onSessionComplete={handleSessionComplete} />}
      {stage === "dashboard" && (
        <BehaviorDashboard
          records={sessionRecords}
          decisionLog={sessionLog}
          sessionId={sessionId}
          userType={userType}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
