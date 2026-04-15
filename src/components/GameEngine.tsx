import { useState, useCallback, useEffect } from "react";
import { missionEvents, getEventDescription, phaseLabels, RISK_THRESHOLD, type DecisionType } from "@/data/events";
import ResourceBar from "./ResourceBar";
import EventCard from "./EventCard";
import DecisionButtons from "./DecisionButtons";
import MissionResult from "./MissionResult";
import StatusMessage from "./StatusMessage";
import ProgressBar from "./ProgressBar";
import ScanlineOverlay from "./ScanlineOverlay";
import HexGrid from "./HexGrid";

export interface DecisionRecord {
  profileType: string;
  levelId: string;
  phase: number;
  decision: string;
  decisionType: DecisionType;
  decisionTime: number;
  energy: number;
  supplies: number;
  morale: number;
  riskLevel: number;
  timestamp: number;
}

interface Props {
  profile: string;
  character: string;
  onRestart: () => void;
}

type FailureType = "resource" | "risk" | null;

interface BehavioralDecision {
  eventId: string;
  choiceType: DecisionType;
  decisionTime: number;
  timestamp: number;
}

function getAvgDecisionTime(decisions: BehavioralDecision[]) {
  if (!decisions.length) return 0;
  return decisions.reduce((sum, d) => sum + d.decisionTime, 0) / decisions.length;
}

function getConsistency(decisions: BehavioralDecision[]) {
  let count = 0;
  for (let i = 1; i < decisions.length; i++) {
    if (decisions[i].choiceType === decisions[i - 1].choiceType) {
      count++;
    }
  }
  return decisions.length ? count / decisions.length : 0;
}

function getExploration(decisions: BehavioralDecision[]) {
  const unique = new Set(decisions.map((d) => d.choiceType));
  return unique.size / 3;
}

function classifyPlayer(results: {
  avgDecisionTime: number;
  riskRatio: number;
  consistency: number;
  exploration: number;
}) {
  if (results.riskRatio > 0.7) return "Risk Taker";
  if (results.riskRatio < 0.3) return "Cautious";
  return "Balanced";
}

const GameEngine = ({ profile, character: _character, onRestart }: Props) => {
  const profileType = profile;
  const [eventIndex, setEventIndex] = useState(0);
  const [resources, setResources] = useState({ energy: 100, supplies: 100, morale: 100 });
  const [prevResources, setPrevResources] = useState({ energy: 100, supplies: 100, morale: 100 });
  const [riskLevel, setRiskLevel] = useState(0);
  const [prevRisk, setPrevRisk] = useState(0);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [failureType, setFailureType] = useState<FailureType>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [metrics, setMetrics] = useState({
    decisions: [] as BehavioralDecision[],
    startTime: Date.now(),
    risky: 0,
    safe: 0,
    neutral: 0,
  });
  const [eventDescriptions] = useState(() =>
    missionEvents.map((e) => getEventDescription(e))
  );

  const currentEvent = missionEvents[eventIndex];
  const currentPhase = currentEvent?.phase ?? 3;

  useEffect(() => {
    if (!gameOver) return;
    const results = {
      avgDecisionTime: getAvgDecisionTime(metrics.decisions),
      riskRatio: metrics.risky / (metrics.decisions.length || 1),
      consistency: getConsistency(metrics.decisions),
      exploration: getExploration(metrics.decisions),
    };

    console.log("Player Results:", results);
    console.log("Player Type:", classifyPlayer(results));
  }, [gameOver, metrics]);

  // Calculate progress
  const phaseEvents = missionEvents.filter((e) => e.phase === currentPhase);
  const currentEventInPhase = currentEvent
    ? phaseEvents.indexOf(currentEvent) + 1
    : phaseEvents.length;
  const completedBefore = missionEvents.slice(0, eventIndex).length;

  const handleChoice = useCallback(
    (choiceIndex: number) => {
      if (!currentEvent || processing) return;

      const choice = currentEvent.choices[choiceIndex];
      const decisionTime = Date.now() - metrics.startTime;
      const choiceType = choice.decisionType || "neutral";
      const decision = {
        eventId: currentEvent.id,
        choiceType,
        decisionTime,
        timestamp: Date.now(),
      };

      setMetrics((prev) => ({
        ...prev,
        decisions: [...prev.decisions, decision],
        risky: prev.risky + (choiceType === "risky" ? 1 : 0),
        safe: prev.safe + (choiceType === "safe" ? 1 : 0),
        neutral: prev.neutral + (choiceType === "neutral" ? 1 : 0),
      }));

      // Show processing state
      setProcessing(true);
      setStatusMessage("Processing command...");

      // Delay for immersion
      setTimeout(() => {
        const newResources = {
          energy: Math.max(0, resources.energy + (choice.effects.energy ?? 0)),
          supplies: Math.max(0, resources.supplies + (choice.effects.supplies ?? 0)),
          morale: Math.max(0, resources.morale + (choice.effects.morale ?? 0)),
        };
        const newRisk = Math.max(0, Math.min(100, riskLevel + (choice.effects.risk ?? 0)));

        const record: DecisionRecord = {
          profileType,
          levelId: currentEvent.id,
          phase: currentEvent.phase,
          decision: choice.label,
          decisionType: choice.decisionType,
          decisionTime,
          ...newResources,
          riskLevel: newRisk,
          timestamp: Date.now(),
        };

        const newDecisions = [...decisions, record];
        setDecisions(newDecisions);
        setPrevResources(resources);
        setResources(newResources);
        setPrevRisk(riskLevel);
        setRiskLevel(newRisk);

        // Show outcome message
        setStatusMessage(choice.outcomeMessage);

        // Save to localStorage
        try {
          const existing = JSON.parse(localStorage.getItem("playtrace-log") || "[]");
          existing.push(record);
          localStorage.setItem("playtrace-log", JSON.stringify(existing));
        } catch { /* ignore */ }

        // Check failure
        if (newResources.energy <= 0 || newResources.supplies <= 0 || newResources.morale <= 0) {
          setTimeout(() => {
            setFailureType("resource");
            setGameOver(true);
            setProcessing(false);
          }, 1200);
          return;
        }

        if (newRisk >= RISK_THRESHOLD) {
          setTimeout(() => {
            setFailureType("risk");
            setGameOver(true);
            setProcessing(false);
          }, 1200);
          return;
        }

        // Next event after delay
        setTimeout(() => {
          if (eventIndex + 1 >= missionEvents.length) {
            setGameOver(true);
          } else {
            setEventIndex(eventIndex + 1);
            setMetrics((prev) => ({
              ...prev,
              startTime: Date.now(),
            }));
          }
          setStatusMessage(null);
          setProcessing(false);
        }, 1500);
      }, 700);
    },
    [currentEvent, resources, decisions, eventIndex, profileType, riskLevel, processing, metrics.startTime]
  );

  if (gameOver) {
    return (
      <>
        <ScanlineOverlay />
        <MissionResult
          decisions={decisions}
          resources={resources}
          riskLevel={riskLevel}
          failureType={failureType}
          onRestart={onRestart}
        />
      </>
    );
  }

  if (!currentEvent) return null;

  return (
    <div className="min-h-screen flex flex-col relative grid-lines">
      <ScanlineOverlay />
      <HexGrid />
      <div className="pointer-events-none absolute inset-0 z-[1]" style={{
        background: "radial-gradient(circle at 50% 45%, transparent 0%, hsl(222 47% 3% / 0.45) 75%, hsl(222 47% 3% / 0.8) 100%)",
      }} />

      {/* HUD Header */}
      <header
        className="sticky top-0 z-20 border-b p-3"
        style={{
          background: 'linear-gradient(180deg, hsl(222 47% 6% / 0.65), hsl(222 47% 4% / 0.35))',
          borderColor: 'hsl(var(--neon-cyan) / 0.22)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rec-dot" />
              <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-primary">
                PlayTrace
              </span>
              <div className="w-12 h-px ml-2" style={{ background: 'linear-gradient(90deg, hsl(var(--neon-cyan) / 0.5), transparent)' }} />
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-[9px] font-display uppercase tracking-[0.15em] px-2.5 py-0.5 clip-corners"
                style={{
                  background: 'hsl(var(--neon-magenta) / 0.15)',
                  border: '1px solid hsl(var(--neon-magenta) / 0.3)',
                  color: 'hsl(var(--neon-magenta))',
                }}
              >
                {profileType.replace("-", " ")}
              </span>
              <span
                className="text-[9px] font-display uppercase tracking-[0.15em] px-2.5 py-0.5 clip-corners"
                style={{
                  background: `hsl(var(--neon-yellow) / 0.15)`,
                  border: `1px solid hsl(var(--neon-yellow) / 0.3)`,
                  color: `hsl(var(--neon-yellow))`,
                }}
              >
                Phase {currentPhase}: {phaseLabels[currentPhase]}
              </span>
            </div>
          </div>

          {/* Resource bars */}
          <div className="grid grid-cols-4 gap-2">
            <ResourceBar
              label="Energy"
              icon={
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                  <path
                    d="M7 1L3 9h3v6l4-8H7V1z"
                    fill="currentColor"
                  />
                </svg>
              }
              value={resources.energy}
              maxValue={100}
              colorClass="bg-energy"
              prevValue={prevResources.energy}
            />
            <ResourceBar
              label="Supplies"
              icon={
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                  <rect x="3" y="4" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3 7h10" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              }
              value={resources.supplies}
              maxValue={100}
              colorClass="bg-supplies"
              prevValue={prevResources.supplies}
            />
            <ResourceBar
              label="Morale"
              icon={
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                  <path
                    d="M8 13s-4-2.4-4-5.2C4 5.2 5.2 4 6.6 4c.7 0 1.3.3 1.4.9C8.1 4.3 8.7 4 9.4 4 10.8 4 12 5.2 12 7.8 12 10.6 8 13 8 13z"
                    fill="currentColor"
                  />
                </svg>
              }
              value={resources.morale}
              maxValue={100}
              colorClass="bg-morale"
              prevValue={prevResources.morale}
            />
            <ResourceBar
              label="Risk"
              icon={
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                  <path
                    d="M8 2l6 11H2L8 2z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <path d="M8 6v4" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="8" cy="11.2" r="0.8" fill="currentColor" />
                </svg>
              }
              value={riskLevel}
              maxValue={100}
              colorClass="bg-critical"
              prevValue={prevRisk}
              invertCritical
            />
          </div>

          {/* Progress bar */}
          <ProgressBar
            currentPhase={currentPhase}
            currentEventInPhase={currentEventInPhase}
            totalEventsInPhase={phaseEvents.length}
            totalEventsCompleted={completedBefore}
            totalEvents={missionEvents.length}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full p-4 gap-4 relative z-10">
        <EventCard
          title={currentEvent.title}
          description={eventDescriptions[eventIndex]}
          currentEvent={eventIndex + 1}
          totalEvents={missionEvents.length}
          phase={currentPhase}
        />
        <StatusMessage message={statusMessage} />
        <DecisionButtons choices={currentEvent.choices} onChoose={handleChoice} disabled={processing} />
      </main>

      {/* Bottom status bar */}
      <footer className="sticky bottom-0 z-20 py-2 px-4 flex items-center justify-between text-[8px] font-mono text-muted-foreground/40 tracking-wider" style={{
        background: 'hsl(222 47% 5% / 0.9)',
        borderTop: '1px solid hsl(var(--neon-cyan) / 0.08)',
      }}>
        <span>SYS.STATUS: {riskLevel > 60 ? "WARNING" : "NOMINAL"}</span>
        <span>RISK.LVL: {riskLevel}%</span>
        <span>PHASE: {currentPhase}/{3}</span>
        <span>MISSION CLOCK: ACTIVE</span>
      </footer>
    </div>
  );
};

export default GameEngine;
