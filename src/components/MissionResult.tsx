import { motion } from "framer-motion";
import { DecisionRecord } from "@/components/GameEngine";
import { missionEvents, phaseLabels, TOTAL_PHASES } from "@/data/events";
import ScanlineOverlay from "./ScanlineOverlay";

interface Props {
  decisions: DecisionRecord[];
  resources: { energy: number; supplies: number; morale: number };
  riskLevel: number;
  failureType: "resource" | "risk" | null;
  onRestart: () => void;
}

const MissionResult = ({ decisions, resources, riskLevel, failureType, onRestart }: Props) => {
  const avgTime =
    decisions.length > 0
      ? (decisions.reduce((s, d) => s + d.decisionTime, 0) / decisions.length / 1000).toFixed(1)
      : "0";

  const riskyCount = decisions.filter((d) => d.decisionType === "risky").length;
  const safeCount = decisions.filter((d) => d.decisionType === "safe").length;
  const neutralCount = decisions.filter((d) => d.decisionType === "neutral").length;
  const totalResources = resources.energy + resources.supplies + resources.morale;
  const levelsCompleted = decisions.length;
  const phasesReached = decisions.length > 0 ? decisions[decisions.length - 1].phase : 1;

  // Mission outcome
  const outcome = failureType === "risk"
    ? "Critical Failure"
    : failureType === "resource"
      ? "Mission Failed"
      : "Mission Complete";

  // Grade
  const grade = failureType
    ? failureType === "risk" ? "D" : "D"
    : totalResources > 220 ? "S" : totalResources > 170 ? "A" : totalResources > 120 ? "B" : totalResources > 70 ? "C" : "D";

  // Behavioral pattern
  const riskRatio = decisions.length > 0 ? riskyCount / decisions.length : 0;
  const pattern = riskRatio > 0.6
    ? "Risk-Taker"
    : riskRatio < 0.25
      ? "Cautious Operator"
      : "Balanced Strategist";

  const patternDesc = riskRatio > 0.6
    ? "You consistently chose high-risk actions, prioritizing potential gains over safety."
    : riskRatio < 0.25
      ? "You favored safe and measured responses, minimizing exposure to danger."
      : "You balanced risk and caution, adapting your approach to each situation.";

  const gradeColors: Record<string, string> = {
    S: "hsl(var(--neon-cyan))",
    A: "hsl(var(--morale))",
    B: "hsl(var(--neon-yellow))",
    C: "hsl(var(--energy))",
    D: "hsl(var(--critical))",
  };
  const gradeColor = gradeColors[grade] || "hsl(var(--neon-cyan))";

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative z-10 grid-lines">
      <ScanlineOverlay />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl space-y-4 relative z-10"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="rec-dot" />
          <span className="text-[10px] font-display uppercase tracking-[0.2em] text-primary">
            After-Action Report
          </span>
        </div>

        {/* Title + Grade */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-4xl font-bold tracking-wider uppercase neon-text">
              {outcome}
            </h1>
            {failureType === "risk" && (
              <p className="text-[10px] font-mono text-critical mt-1">
                ⚠ MISSION TERMINATED — RISK THRESHOLD EXCEEDED
              </p>
            )}
          </div>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <div
              className="w-16 h-16 flex items-center justify-center rotate-45"
              style={{
                border: `2px solid ${gradeColor}`,
                boxShadow: `0 0 20px ${gradeColor.replace(')', ' / 0.4)')}, inset 0 0 15px ${gradeColor.replace(')', ' / 0.1)')}`,
                background: `${gradeColor.replace(')', ' / 0.08)')}`,
              }}
            >
              <span
                className="font-display text-3xl font-black -rotate-45"
                style={{ color: gradeColor, textShadow: `0 0 20px ${gradeColor.replace(')', ' / 0.6)')}` }}
              >
                {grade}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Avg Response", value: `${avgTime}s` },
            { label: "Levels Done", value: String(levelsCompleted) },
            { label: "Phases Reached", value: `${phasesReached}/${TOTAL_PHASES}` },
            { label: "Risk Ratio", value: decisions.length > 0 ? `${Math.round(riskRatio * 100)}%` : "0%" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.1 }}
              className="hud-panel p-3 text-center relative overflow-hidden clip-corners"
            >
              <div className="font-display text-lg font-bold text-primary">{stat.value}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] mt-1 font-display">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Behavioral Pattern */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="hud-panel p-5 relative overflow-hidden"
          style={{ borderColor: 'hsl(var(--neon-magenta) / 0.3)' }}
        >
          <div className="corner-deco corner-deco-tl" style={{ borderColor: 'hsl(var(--neon-magenta) / 0.7)' }} />
          <div className="corner-deco corner-deco-br" style={{ borderColor: 'hsl(var(--neon-magenta) / 0.7)' }} />
          <h3 className="font-display text-[10px] uppercase tracking-[0.2em] text-neon-magenta mb-2">
            Behavioral Pattern Summary
          </h3>
          <p className="font-display text-lg text-foreground uppercase tracking-wider mb-1">{pattern}</p>
          <p className="text-xs font-mono text-muted-foreground leading-relaxed">{patternDesc}</p>
          <div className="flex gap-4 mt-3">
            <span className="text-[10px] font-mono"><span className="text-critical">▲ Risky:</span> {riskyCount}</span>
            <span className="text-[10px] font-mono"><span className="text-morale">● Safe:</span> {safeCount}</span>
            <span className="text-[10px] font-mono"><span className="text-neon-yellow">◆ Neutral:</span> {neutralCount}</span>
          </div>
        </motion.div>

        {/* Resources */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="hud-panel p-5 relative overflow-hidden"
        >
          <div className="corner-deco corner-deco-tl" />
          <div className="corner-deco corner-deco-br" />
          <h3 className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Final Resource State
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: "Energy",
                icon: (
                  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                    <path d="M7 1L3 9h3v6l4-8H7V1z" fill="currentColor" />
                  </svg>
                ),
                value: resources.energy,
                colorVar: "energy",
              },
              {
                label: "Supplies",
                icon: (
                  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                    <rect x="3" y="4" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M3 7h10" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                ),
                value: resources.supplies,
                colorVar: "supplies",
              },
              {
                label: "Morale",
                icon: (
                  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                    <path
                      d="M8 13s-4-2.4-4-5.2C4 5.2 5.2 4 6.6 4c.7 0 1.3.3 1.4.9C8.1 4.3 8.7 4 9.4 4 10.8 4 12 5.2 12 7.8 12 10.6 8 13 8 13z"
                      fill="currentColor"
                    />
                  </svg>
                ),
                value: resources.morale,
                colorVar: "morale",
              },
              {
                label: "Risk",
                icon: (
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
                ),
                value: riskLevel,
                colorVar: "critical",
              },
            ].map((r) => (
              <div key={r.label} className="text-center">
                <div className="relative w-14 h-14 mx-auto mb-2">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(215 28% 14%)" strokeWidth="2.5" />
                    <motion.circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke={`hsl(var(--${r.colorVar}))`}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="97.4"
                      initial={{ strokeDashoffset: 97.4 }}
                      animate={{ strokeDashoffset: 97.4 - (r.value / 100) * 97.4 }}
                      transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
                      style={{ filter: `drop-shadow(0 0 4px hsl(var(--${r.colorVar}) / 0.5))` }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-display text-xs font-bold" style={{ color: `hsl(var(--${r.colorVar}))` }}>
                    {r.value}
                  </span>
                </div>
                <div className="text-[9px] text-muted-foreground font-display tracking-wider flex items-center justify-center gap-1">
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    {r.icon}
                  </span>
                  <span>{r.label}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Decision Log */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="hud-panel p-5 relative overflow-hidden max-h-64 overflow-y-auto"
        >
          <div className="corner-deco corner-deco-tl" />
          <h3 className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Decision Log
          </h3>
          <div className="space-y-2">
            {decisions.map((d, i) => {
              const event = missionEvents.find((e) => e.id === d.levelId);
              const typeColor = d.decisionType === "risky" ? "critical" : d.decisionType === "neutral" ? "neon-yellow" : "morale";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.05 }}
                  className="flex items-start gap-3 text-xs font-mono py-1.5 pl-3"
                  style={{
                    borderLeft: `2px solid hsl(var(--${typeColor}) / 0.5)`,
                  }}
                >
                  <span className="text-muted-foreground shrink-0 font-display">
                    [{String(i + 1).padStart(2, "0")}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-display uppercase tracking-wider text-muted-foreground">
                      P{d.phase}
                    </span>
                    <span className="text-foreground ml-2">{event?.title}:</span>{" "}
                    <span className="text-primary">{d.decision}</span>
                    <span className="text-muted-foreground ml-2">
                      ({(d.decisionTime / 1000).toFixed(1)}s)
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase font-display tracking-wider text-${typeColor}`}>
                    {d.decisionType === "risky" ? "▲ RSK" : d.decisionType === "neutral" ? "◆ NTL" : "● SFE"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Restart button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRestart}
          className="game-btn clip-corners-lg w-full text-center group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.06] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <span className="font-display text-sm uppercase tracking-[0.2em] text-foreground relative z-10">
            New Mission
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default MissionResult;
