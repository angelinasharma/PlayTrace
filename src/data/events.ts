export type DecisionType = "safe" | "risky" | "neutral";

export interface GameEvent {
  id: string;
  phase: 1 | 2 | 3;
  title: string;
  descriptions: string[]; // multiple variants for replayability
  choices: {
    label: string;
    effects: {
      energy?: number;
      supplies?: number;
      morale?: number;
      risk?: number;
    };
    decisionType: DecisionType;
    outcomeMessage: string;
  }[];
}

export const phaseLabels: Record<number, string> = {
  1: "Exploration",
  2: "Survival",
  3: "Critical Decisions",
};

export const missionEvents: GameEvent[] = [
  // ═══════════════════════════════════════════
  // PHASE 1 — EXPLORATION (Intro)
  // ═══════════════════════════════════════════
  {
    id: "p1-signal",
    phase: 1,
    title: "Strange Signal Detected",
    descriptions: [
      "Your rover detects an unusual signal coming from underground. The signal could be a natural phenomenon — or something far more valuable.\n\nFrequency analysis suggests a non-random pattern. The source is 2.3 km below the surface.",
      "An anomalous frequency pings from beneath the crust. Pattern recognition flags it as structured — possibly artificial.\n\nDepth estimate: 2.3 km. Origin unknown.",
      "Ground-penetrating radar picks up rhythmic pulses from deep underground. Your AI labels them 'potentially structured.'\n\nNo geological explanation found. Depth: 2.3 km.",
    ],
    choices: [
      {
        label: "Investigate immediately",
        effects: { energy: -10, morale: 5, risk: 10 },
        decisionType: "risky",
        outcomeMessage: "Deploying deep-scan probes. Energy reserves committed. The signal grows stronger as you approach.",
      },
      {
        label: "Scan remotely first",
        effects: { energy: -5, risk: 0 },
        decisionType: "safe",
        outcomeMessage: "Remote scans initiated. Partial data acquired — signal origin remains ambiguous but no resources risked.",
      },
      {
        label: "Log and continue mission",
        effects: { morale: -5 },
        decisionType: "neutral",
        outcomeMessage: "Signal logged for future analysis. Crew morale dips slightly from the missed opportunity.",
      },
    ],
  },
  {
    id: "p1-terrain",
    phase: 1,
    title: "Unstable Terrain Ahead",
    descriptions: [
      "The planned route cuts through a canyon with active seismic readings. Alternative routes add 12 hours to the journey.\n\nGeological surveys show a 30% chance of rockslide activity in the next 6 hours.",
      "Tremor sensors are lighting up along the primary route. A detour through the plateau would be safer but burns more fuel.\n\nSeismic risk: moderate to high. Window of safe passage: uncertain.",
      "Your path forward crosses a geologically active rift. The ground trembles every few minutes.\n\nA longer but stable route exists. Your call, Commander.",
    ],
    choices: [
      {
        label: "Push through the canyon",
        effects: { energy: -8, supplies: -5, risk: 15 },
        decisionType: "risky",
        outcomeMessage: "Navigating through unstable terrain. Hull stress increasing. Speed maintained but at a cost.",
      },
      {
        label: "Take the safe detour",
        effects: { energy: -15, morale: -3 },
        decisionType: "safe",
        outcomeMessage: "Rerouting through stable terrain. Extra fuel consumed but the crew is safe.",
      },
    ],
  },
  {
    id: "p1-artifact",
    phase: 1,
    title: "Ancient Artifact Site",
    descriptions: [
      "Surface scans reveal structures inconsistent with natural formation. Preliminary analysis suggests they predate known civilizations.\n\nThe site is exposed to solar radiation — EVA teams will need extra shielding.",
      "Your scanners flag a cluster of geometric formations buried under thin regolith. They look artificial.\n\nRadiation levels at the site are elevated. Exploration will require protective measures.",
      "What appears to be ruins emerge from the dust. Symmetrical. Deliberate. Ancient.\n\nHigh-band radiation blankets the area. Investigation will cost resources.",
    ],
    choices: [
      {
        label: "Full excavation protocol",
        effects: { energy: -12, supplies: -10, morale: 10, risk: 10 },
        decisionType: "risky",
        outcomeMessage: "Excavation teams deployed with full shielding. Remarkable structures uncovered — crew excitement soars.",
      },
      {
        label: "Drone survey only",
        effects: { energy: -5, supplies: -3 },
        decisionType: "safe",
        outcomeMessage: "Aerial survey captured detailed imagery. Safe and efficient, though lacking ground-truth data.",
      },
      {
        label: "Mark and move on",
        effects: { morale: -8 },
        decisionType: "neutral",
        outcomeMessage: "Coordinates logged. The crew watches the site shrink in the rearview with visible disappointment.",
      },
    ],
  },
  {
    id: "p1-comms",
    phase: 1,
    title: "Communications Relay Failure",
    descriptions: [
      "The primary comms relay has gone offline. Without it, you lose contact with mission control for up to 48 hours.\n\nA secondary relay exists 40 km off-route, but reaching it means burning fuel.",
      "Static fills the comm channels. Diagnostics confirm: relay alpha is down.\n\nYou can attempt field repairs, detour to a backup relay, or proceed dark.",
      "Mission control goes silent mid-transmission. The relay array has failed.\n\nOptions are limited. Each path forward carries its own cost.",
    ],
    choices: [
      {
        label: "Field-repair the relay",
        effects: { energy: -10, supplies: -8, risk: 5 },
        decisionType: "neutral",
        outcomeMessage: "Engineering team working on repairs. Partial success — intermittent contact restored.",
      },
      {
        label: "Detour to backup relay",
        effects: { energy: -18, morale: -5 },
        decisionType: "safe",
        outcomeMessage: "Rerouting to secondary relay. Full communications restored but significant fuel expended.",
      },
      {
        label: "Continue without comms",
        effects: { morale: -10, risk: 20 },
        decisionType: "risky",
        outcomeMessage: "Operating dark. Crew anxiety rises. You're on your own out here.",
      },
    ],
  },

  // ═══════════════════════════════════════════
  // PHASE 2 — SURVIVAL (Mid-game pressure)
  // ═══════════════════════════════════════════
  {
    id: "p2-storm",
    phase: 2,
    title: "Incoming Plasma Storm",
    descriptions: [
      "Long-range sensors detect a massive plasma storm approaching your position. ETA: 4 hours.\n\nThe storm will disable electronics and could damage exposed equipment. Radiation levels will spike to lethal.",
      "A wall of ionized gas is barreling toward your camp. Sensors estimate 4 hours until impact.\n\nUnprotected exposure means equipment loss — and potentially worse.",
      "WARNING: Category-5 plasma event detected on collision course. Time to impact: 4 hours.\n\nThis is not a drill. Immediate action required.",
    ],
    choices: [
      {
        label: "Deploy storm shields",
        effects: { energy: -18, supplies: -15 },
        decisionType: "safe",
        outcomeMessage: "Storm shields fully deployed. The plasma wave hits hard but you weather it. Equipment intact.",
      },
      {
        label: "Relocate to underground cavern",
        effects: { energy: -25, morale: -8, risk: 10 },
        decisionType: "risky",
        outcomeMessage: "Emergency relocation underway. The cavern provides shelter but the move is exhausting and disorienting.",
      },
      {
        label: "Ride it out in place",
        effects: { supplies: -20, morale: -15, risk: 20 },
        decisionType: "risky",
        outcomeMessage: "CRITICAL: Storm impact severe. Multiple systems damaged. Supplies lost. Crew shaken.",
      },
    ],
  },
  {
    id: "p2-crew",
    phase: 2,
    title: "Crew Mutiny Threat",
    descriptions: [
      "A heated argument breaks out between your lead scientist and chief engineer. Half the crew has taken sides.\n\nThe scientist wants to explore a nearby anomaly. The engineer insists on repairing critical life-support first. Tensions are at breaking point.",
      "Voices rise in the mess hall. Your two senior officers are at each other's throats over mission priorities.\n\nThe crew is splitting into factions. This needs to be handled — now.",
      "The disagreement has escalated beyond professional debate. Fists were nearly thrown.\n\nYou have a mutiny brewing if you don't intervene decisively.",
    ],
    choices: [
      {
        label: "Side with the scientist",
        effects: { energy: -12, morale: -10, supplies: -5, risk: 12 },
        decisionType: "risky",
        outcomeMessage: "Exploration prioritized. The engineer's faction seethes silently. Knowledge gained, unity lost.",
      },
      {
        label: "Side with the engineer",
        effects: { energy: -8, morale: -12 },
        decisionType: "safe",
        outcomeMessage: "Life-support repairs underway. The scientists feel sidelined but systems are stable.",
      },
      {
        label: "Impose strict order",
        effects: { morale: -18, risk: -5 },
        decisionType: "neutral",
        outcomeMessage: "You lay down the law. Both factions comply, but the atmosphere turns cold and military.",
      },
    ],
  },
  {
    id: "p2-shortage",
    phase: 2,
    title: "Critical Resource Shortage",
    descriptions: [
      "Inventory check reveals supply levels are dangerously low. A miscalculation during loading left you 40% short on rations.\n\nSomeone must answer for this. But first, survival.",
      "The quartermaster's face is ashen. The numbers don't add up — you're running far shorter on supplies than projected.\n\nRationing or scavenging are your only options.",
      "ALERT: Supply reserves at 60% of projected minimum. Contamination suspected in water reserves.\n\nImmediate resource management required.",
    ],
    choices: [
      {
        label: "Strict rationing protocol",
        effects: { morale: -20 },
        decisionType: "safe",
        outcomeMessage: "Rations halved across the board. Crew compliance is grudging. Hunger sets in, but supplies stabilize.",
      },
      {
        label: "Send scavenging party",
        effects: { energy: -22, supplies: 20, risk: 18 },
        decisionType: "risky",
        outcomeMessage: "Scavenging team deployed into unknown territory. They return with salvage — and stories of what they found out there.",
      },
    ],
  },
  {
    id: "p2-medical",
    phase: 2,
    title: "Medical Emergency",
    descriptions: [
      "Three crew members collapse with identical symptoms — high fever, disorientation, and respiratory distress.\n\nThe med-bay AI flags it as an unknown pathogen. Quarantine may be necessary.",
      "A mysterious illness is spreading. The first patient went down 6 hours ago. Now there are three.\n\nYour medical officer is requesting full quarantine — but that means splitting the crew.",
      "MEDICAL ALERT: Unknown contagion detected. Three affected. Pathogen analysis inconclusive.\n\nQuarantine will slow operations. Ignoring it risks pandemic failure.",
    ],
    choices: [
      {
        label: "Full quarantine lockdown",
        effects: { energy: -15, morale: -12, supplies: -10 },
        decisionType: "safe",
        outcomeMessage: "Quarantine established. Operations slow to a crawl but the contagion is contained.",
      },
      {
        label: "Experimental treatment",
        effects: { supplies: -18, risk: 22 },
        decisionType: "risky",
        outcomeMessage: "Experimental drugs administered. Results are promising but side effects remain unknown.",
      },
      {
        label: "Isolate and continue operations",
        effects: { morale: -15, risk: 15 },
        decisionType: "neutral",
        outcomeMessage: "Infected crew isolated. Operations continue but anxiety spreads faster than the pathogen.",
      },
    ],
  },

  // ═══════════════════════════════════════════
  // PHASE 3 — CRITICAL DECISIONS (High stakes)
  // ═══════════════════════════════════════════
  {
    id: "p3-signal",
    phase: 3,
    title: "Distress Signal Origin",
    descriptions: [
      "The signal you detected in Phase 1 has been decoded. It's not natural — it's a distress call.\n\nThe source is a derelict vessel, 800 meters below the surface. Reaching it will require everything you have left.",
      "Decryption complete. The underground signal is artificial. It's been broadcasting for an estimated 12,000 years.\n\nA ship. Someone else was here. And they never left.",
      "SIGNAL DECODED: 'IF YOU CAN HEAR THIS, WE FAILED. DO NOT REPEAT OUR MISTAKES.'\n\nThe source vessel is reachable — but barely. This will define your mission.",
    ],
    choices: [
      {
        label: "Full excavation — commit everything",
        effects: { energy: -30, supplies: -20, morale: 15, risk: 25 },
        decisionType: "risky",
        outcomeMessage: "All resources committed. The dig begins. What you find down there will change everything.",
      },
      {
        label: "Send a small recon team",
        effects: { energy: -15, supplies: -10, risk: 12 },
        decisionType: "neutral",
        outcomeMessage: "Small team descends. Limited findings but the risk is managed. The mystery remains partially unsolved.",
      },
      {
        label: "Seal the site and leave",
        effects: { morale: -20 },
        decisionType: "safe",
        outcomeMessage: "Site sealed with warning beacons. The crew is devastated but alive. Some questions are left unanswered.",
      },
    ],
  },
  {
    id: "p3-sabotage",
    phase: 3,
    title: "Sabotage Detected",
    descriptions: [
      "Engineering reports deliberate damage to the navigation array. This wasn't mechanical failure — someone on board did this.\n\nWithout navigation, you're flying blind. Trust is shattered.",
      "The nav system didn't just fail — it was cut. Surgically. From the inside.\n\nSomeone on your crew is working against you. Paranoia grips the ship.",
      "SECURITY BREACH: Navigation systems sabotaged. Internal origin confirmed.\n\nYou have a traitor. And you're running out of time to find them.",
    ],
    choices: [
      {
        label: "Interrogate all crew members",
        effects: { energy: -12, morale: -25, risk: 8 },
        decisionType: "neutral",
        outcomeMessage: "Interrogations begin. Trust collapses. You find the saboteur — but the damage to crew unity may be irreparable.",
      },
      {
        label: "Emergency manual navigation",
        effects: { energy: -25, supplies: -15 },
        decisionType: "safe",
        outcomeMessage: "Manual navigation engaged. Exhausting but functional. The saboteur remains unknown.",
      },
      {
        label: "Set a trap for the saboteur",
        effects: { energy: -8, morale: -10, risk: 20 },
        decisionType: "risky",
        outcomeMessage: "A trap is set. The waiting game begins. If it works, you catch them. If not, they strike again.",
      },
    ],
  },
  {
    id: "p3-choice",
    phase: 3,
    title: "The Final Gambit",
    descriptions: [
      "You've reached the primary objective — an ancient structure of impossible scale. Scans reveal unknown materials of immense potential.\n\nBut the structure is unstable. Entering could be catastrophic. Your resources are depleted. This is the last call.",
      "There it is. The structure from the ancient maps. It's real — and it's collapsing.\n\nYou have one shot. Full commitment or walk away. There is no middle ground.",
      "MISSION OBJECTIVE REACHED. The structure stands before you — ancient, crumbling, magnificent.\n\nEvery sensor screams danger. Every instinct screams opportunity. Choose.",
    ],
    choices: [
      {
        label: "Enter the structure — all in",
        effects: { energy: -30, morale: 20, risk: 30 },
        decisionType: "risky",
        outcomeMessage: "You enter the darkness. The structure groans around you. Whatever happens next, this is what you came for.",
      },
      {
        label: "Extract samples from outside",
        effects: { energy: -12, supplies: -12 },
        decisionType: "safe",
        outcomeMessage: "Surface samples collected. Valuable data secured without mortal risk. A pragmatic victory.",
      },
      {
        label: "Document and mark for future mission",
        effects: { morale: -15 },
        decisionType: "neutral",
        outcomeMessage: "Full documentation completed. The structure is preserved for those who come after. If anyone does.",
      },
    ],
  },
];

export function getPhaseEvents(phase: 1 | 2 | 3): GameEvent[] {
  return missionEvents.filter((e) => e.phase === phase);
}

export function getEventDescription(event: GameEvent): string {
  const idx = Math.floor(Math.random() * event.descriptions.length);
  return event.descriptions[idx];
}

export const RISK_THRESHOLD = 80;
export const TOTAL_PHASES = 3;
