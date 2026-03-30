import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScanlineOverlay from "./ScanlineOverlay";

interface Profile {
  id: string;
  label: string;
  desc: string;
  icon: ReactNode;
  stat: { atk: number; def: number; spd: number };
}

const profiles: Profile[] = [
  {
    id: "explorer-veteran",
    label: "Explorer Veteran",
    desc: "Frequent gamer — high adaptability under pressure",
    icon: (
      <svg viewBox="0 0 415.59 415.59" className="w-4 h-4" fill="none" aria-hidden>
        <path
          d="M207.795 0C93.217 0 0 93.216 0 207.793C0 322.372 93.217 415.59 207.795 415.59C322.374 415.59 415.59 322.372 415.59 207.793C415.59 93.216 322.374 0 207.795 0ZM207.795 391.59C106.451 391.59 24 309.139 24 207.793C24 106.45 106.451 24 207.795 24C309.139 24 391.59 106.45 391.59 207.793C391.59 309.139 309.139 391.59 207.795 391.59Z"
          fill="currentColor"
        />
        <polygon
          points="236.153,219.179 282.282,133.371 196.48,179.507"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M322.198 98.284C319.059 92.445 311.784 90.259 305.946 93.397L170.881 166.022C168.808 167.137 167.108 168.836 165.994 170.91L93.398 305.945C90.83 310.722 91.83 316.463 95.478 320.111C96.287 320.921 97.226 321.627 98.287 322.196C101.895 324.136 106.053 324.036 109.443 322.301L109.445 322.304L109.496 322.277C109.545 322.252 109.593 322.225 109.641 322.199L244.772 249.627C246.846 248.513 248.545 246.814 249.661 244.74L321.966 110.039C322.124 109.767 322.275 109.492 322.411 109.209L322.509 109.028L322.497 109.024C324.034 105.711 324.059 101.747 322.198 98.284ZM133.371 282.278L179.502 196.47L219.172 236.141L133.371 282.278ZM236.153 219.179L196.481 179.507L282.282 133.371L236.153 219.179Z"
          fill="currentColor"
        />
      </svg>
    ),
    stat: { atk: 7, def: 5, spd: 8 },
  },
  {
    id: "technical-specialist",
    label: "Technical Specialist",
    desc: "Designer / tool-heavy user — systematic thinker",
    icon: (
      <svg viewBox="5500 6400 4000 3300" className="w-5 h-5" fill="none" aria-hidden>
        <path
          d="M8440 9046 l-295 -211 -75 -213 -75 -212 -499 -499 -499 -499 43 -51c45 -53 257 -251 268 -251 12 0 345 330 666 661l317 326 226 74 226 74 69 100c39 55 131 191 205 302l136 201 -37 45c-31 38 -144 147 -331 319l-50 46 -295 -212z"
          fill="currentColor"
        />
        <path
          d="M6254 7666 l-89 -85 658 -658 658 -658 95 100 94 100 -82 81c-813 799 -1228 1204 -1235 1204 -5 0 -49 -38 -99 -84z"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>
    ),
    stat: { atk: 5, def: 8, spd: 6 },
  },
  {
    id: "field-analyst",
    label: "Field Analyst",
    desc: "Casual user — instinct-driven decisions",
    icon: (
      <svg viewBox="0 0 121.7 122.88" className="w-5 h-5" fill="none" aria-hidden>
        <path
          d="M53.62 0c14.81 0 28.21 6 37.91 15.71 9.7 9.7 15.71 23.11 15.71 37.91 0 10.83-3.21 20.91-8.74 29.35l23.21 25.29-16 14.63-22.39-24.63c-8.5 5.67-18.72 8.98-29.7 8.98-14.81 0-28.21-6-37.91-15.71C6 81.82 0 68.42 0 53.62 0 38.81 6 25.41 15.7 15.7 25.41 6 38.81 0 53.62 0Zm1.11 41.18 1.49-5.67-8.46-2.97 17.18-9.21 9.14 17.42-8.99-2.8-1.25 5.95-9.11-2.72Zm28.45 40.81H29.67a4.04 4.04 0 0 1-2.85-1.19 3.96 3.96 0 0 1-1.17-2.83L25.64 35.1h6.06v40.83h51.48v6.06Zm-13.26-28.67h7.75c.44 0 .79.36.79.79v16.14c0 .44-.36.79-.79.79h-7.75c-.44 0-.79-.36-.79-.79V54.12c0-.44.36-.79.79-.79Zm-30.54-9.88h7.75c.44 0 .79.36.79.79v26.03c0 .44-.36.79-.79.79h-7.75c-.44 0-.79-.36-.79-.79V44.24c0-.44.36-.79.79-.79Zm24.04 5.24v21.59c0 .44-.36.79-.79.79h-7.74c-.44 0-.79-.36-.79-.79V46.01l8.38 2.49c.13.04.26.07.39.1.17.03.36.06.55.08Zm23.88-28.75C78.68 11.31 66.77 5.98 53.62 5.98c-13.15 0-25.06 5.33-33.68 13.95C11.31 28.55 5.98 40.46 5.98 53.62c0 13.15 5.33 25.06 13.95 33.68 8.62 8.62 20.53 13.95 33.68 13.95 13.16 0 25.06-5.33 33.68-13.95 8.62-8.62 13.95-20.53 13.95-33.68 0-13.16-5.33-25.07-13.95-33.69Z"
          fill="currentColor"
        />
      </svg>
    ),
    stat: { atk: 6, def: 6, spd: 7 },
  },
  {
    id: "civilian-recruit",
    label: "Civilian Recruit",
    desc: "Non-gamer — fresh perspective, untested resolve",
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
        <path
          d="M4 3h8v5.5c0 1.4-0.7 2.7-2 3.5L8 14l-2-2c-1.3-0.8-2-2.1-2-3.5V3z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        <path d="M8 4v7" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    stat: { atk: 4, def: 4, spd: 9 },
  },
];

interface Props {
  onSelect: (profileType: string) => void;
}

const StatBar = ({ label, value, max = 10, color }: { label: string; value: number; max?: number; color: string }) => (
  <div className="flex items-center gap-2 text-[9px] font-mono">
    <span className="w-6 text-muted-foreground uppercase">{label}</span>
    <div className="flex gap-[2px] flex-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className="h-1.5 flex-1 rounded-[1px]"
          style={{
            background: i < value ? color : `hsl(215 28% 14%)`,
            boxShadow: i < value ? `0 0 3px ${color}` : 'none',
          }}
        />
      ))}
    </div>
  </div>
);

const ProfileSelection = ({ onSelect }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  const handleSelect = (id: string) => {
    setSelected(id);
    setInitializing(true);
    setTimeout(() => onSelect(id), 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 grid-lines">
      <ScanlineOverlay />

      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          {!initializing ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              {/* Title section */}
              <div className="mb-2 flex items-center gap-2">
                <span className="rec-dot" />
                <span className="text-[10px] font-display uppercase tracking-[0.2em] text-primary">
                  Mission Briefing
                </span>
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wider neon-text mb-1 uppercase">
                Select Operative
              </h1>
              <p className="text-muted-foreground text-xs mb-8 max-w-lg font-mono">
                <span className="text-primary/40">&gt;</span> Assign your operational profile before deployment
              </p>

              <div className="grid gap-3">
                {profiles.map((p, i) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(p.id)}
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="game-btn clip-corners text-left w-full group"
                  >
                    {/* Index tag */}
                    <div
                      className="absolute top-0 left-0 px-3 py-0.5 text-[9px] font-display font-bold tracking-widest clip-skew-right"
                      style={{
                        background: `hsl(var(--neon-cyan) / 0.15)`,
                        color: `hsl(var(--neon-cyan))`,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    <div className="flex items-center gap-4 relative z-10 mt-1">
                      {/* Diamond icon */}
                      <div className="diamond-frame" style={{ borderColor: hovered === p.id ? `hsl(var(--neon-cyan) / 0.8)` : undefined }}>
                        <span className="text-xl" style={{ color: `hsl(var(--neon-cyan))` }}>
                          {p.icon}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-heading text-base md:text-lg uppercase tracking-wider text-foreground block">
                          {p.label}
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {p.desc}
                        </span>
                        {/* Mini stat bars */}
                        <div className="mt-2 space-y-1 max-w-[200px]">
                          <StatBar label="ATK" value={p.stat.atk} color="hsl(var(--critical))" />
                          <StatBar label="DEF" value={p.stat.def} color="hsl(var(--neon-cyan))" />
                          <StatBar label="SPD" value={p.stat.spd} color="hsl(var(--neon-yellow))" />
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: `hsl(var(--neon-cyan))` }}>
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="init"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              {/* Loading HUD */}
              <div className="inline-block mb-6 relative">
                <svg width="120" height="120" viewBox="0 0 120 120" className="animate-spin" style={{ animationDuration: '3s' }}>
                  <circle cx="60" cy="60" r="55" fill="none" stroke="hsl(215 28% 14%)" strokeWidth="2" />
                  <circle cx="60" cy="60" r="55" fill="none" stroke="hsl(var(--neon-cyan))" strokeWidth="2"
                    strokeDasharray="100 245" strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px hsl(var(--neon-cyan) / 0.5))' }}
                  />
                  <circle cx="60" cy="60" r="45" fill="none" stroke="hsl(var(--neon-magenta) / 0.3)" strokeWidth="1"
                    strokeDasharray="50 233" strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-4xl" style={{ color: 'hsl(var(--neon-cyan))' }}>
                  {profiles.find(p => p.id === selected)?.icon}
                </span>
              </div>

              <p className="font-display text-xs tracking-[0.3em] uppercase mb-2" style={{ color: 'hsl(var(--neon-cyan))' }}>
                Profile Registered
              </p>
              <p className="neon-text font-display text-xl tracking-wider uppercase">
                {profiles.find(p => p.id === selected)?.label}
              </p>
              <p className="text-muted-foreground text-[10px] font-mono mt-2 tracking-wider">
                INITIALIZING MISSION SEQUENCE...
              </p>

              {/* Loading bar */}
              <div className="mt-6 mx-auto max-w-[240px] h-2 bg-secondary overflow-hidden clip-corners relative">
                <motion.div
                  className="h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  style={{
                    background: `linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-magenta)))`,
                    boxShadow: `0 0 10px hsl(var(--neon-cyan) / 0.5)`,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileSelection;
