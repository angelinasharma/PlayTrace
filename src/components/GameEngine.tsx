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
import Player from "@/components/Player";

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime] = useState(Date.now());
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
      totalTimeSpentMs: Date.now() - sessionStartTime,
      riskyDecisions: metrics.risky,
      safeDecisions: metrics.safe,
      neutralDecisions: metrics.neutral
    };

    console.log("Player Results:", results);
    console.log("Player Type:", classifyPlayer(results));

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    if (sessionId) {
      fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endedAt: Date.now(),
          completed: failureType === null,
          failureType,
          finalResources: resources,
          finalRiskLevel: riskLevel,
          metrics: results
        })
      }).catch(err => console.error("Failed to update session:", err));
    }
  }, [gameOver, metrics, sessionId, failureType, resources, riskLevel]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    fetch(`${API_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileType, character: _character })
    })
    .then(res => res.json())
    .then(data => {
      if (data.sessionId) setSessionId(data.sessionId);
    })
    .catch(err => console.error("Failed to create session:", err));
  }, [profileType, _character]);

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

        // Save to backend
        if (sessionId) {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          fetch(`${API_URL}/api/sessions/${sessionId}/decisions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
          }).catch(err => console.error("Failed to save decision:", err));
        }

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
    [currentEvent, resources, decisions, eventIndex, profileType, riskLevel, processing, metrics.startTime, sessionId]
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
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/48" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, transparent 0%, hsl(222 47% 3% / 0.55) 72%, hsl(222 47% 3% / 0.88) 100%)",
        }}
        aria-hidden
      />
      <Player character={_character} />

      <div className="game-container flex flex-1 flex-col">
      {/* HUD Header */}
      <header
        className="relative z-20 border-b p-3 sm:p-4"
        style={{
          background: 'linear-gradient(180deg, hsl(222 47% 6% / 0.65), hsl(222 47% 4% / 0.35))',
          borderColor: 'hsl(var(--neon-cyan) / 0.22)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] space-y-2 px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="rec-dot" />
              <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-primary/85">
                PlayTrace
              </span>
              <div className="w-12 h-px ml-2" style={{ background: 'linear-gradient(90deg, hsl(var(--neon-cyan) / 0.5), transparent)' }} />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span
                className="text-[9px] font-display uppercase tracking-[0.15em] px-2.5 py-0.5 clip-corners opacity-75"
                style={{
                  background: 'hsl(var(--neon-magenta) / 0.15)',
                  border: '1px solid hsl(var(--neon-magenta) / 0.3)',
                  color: 'hsl(var(--neon-magenta))',
                }}
              >
                {profileType.replace("-", " ")}
              </span>
              <span
                className="text-[9px] font-display uppercase tracking-[0.15em] px-2.5 py-0.5 clip-corners opacity-75"
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

          {/* Resource bars: primary cluster + danger (risk) */}
          <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
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
            </div>
            <div
              className="shrink-0 border-t border-border/35 pt-3 md:w-[min(100%,240px)] md:border-l md:border-t-0 md:pl-3 md:pt-0"
              role="region"
              aria-label="Mission risk level"
            >
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
      <main className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center gap-6 px-4 py-4 sm:px-6 sm:py-6">
        <EventCard
          title={currentEvent.title}
          description={eventDescriptions[eventIndex]}
          currentEvent={eventIndex + 1}
          totalEvents={missionEvents.length}
          phase={currentPhase}
        />
        <StatusMessage message={statusMessage} />
        <div className="mt-6 pt-2">
          <DecisionButtons choices={currentEvent.choices} onChoose={handleChoice} disabled={processing} />
        </div>
      </main>

      {/* Bottom status bar */}
      <footer
        className="relative z-20 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 text-[8px] font-mono text-muted-foreground/45 tracking-wider sm:px-6"
        style={{
          background: "hsl(222 47% 5% / 0.9)",
          borderTop: "1px solid hsl(var(--neon-cyan) / 0.08)",
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <span>SYS.STATUS: {riskLevel > 60 ? "WARNING" : "NOMINAL"}</span>
        <span>RISK.LVL: {riskLevel}%</span>
        <span>PHASE: {currentPhase}/{3}</span>
        <span>MISSION CLOCK: ACTIVE</span>
      </footer>
      </div>
    </div>
  );
};

export default GameEngine;
