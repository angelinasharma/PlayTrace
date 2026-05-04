/**
 * scenarioRegistry.ts
 * Authoritative registry of all scenario definitions.
 *
 * Navigation graph:
 *   s1 → s2 ─┬─[risk/fast]──────────→ s3_risk ──────────┐
 *             └─[careful/reprioritize]→ s3_methodical ───┤
 *                                                        └→ s4 → s5 ─┬─[ignore/quickfix]→ s6_cascade ─┐
 *                                                                     └─[fix/escalate]──→ s6 ───────────┤
 *                                                                                                       └→ s7 ─┬─[speak up]→ s8_advocate ─┐
 *                                                                                                              └─[silent/wait]──→ s8 ──────┤
 *                                                                                                                                          └→ s9 → s10
 *
 * BEHAVIORAL MAP:
 *   s1  → risk (unobserved shortcut)
 *   s2  → pressure response
 *   s3  → consistency / consequence
 *   s4  → ambiguity / honesty
 *   s5  → ethical accountability
 *   s6  → fairness vs. self-interest
 *   s7  → social conformity vs. integrity
 *   s8  → consistency under repetition
 *   s9  → impulsivity vs. caution
 *   s10 → identity (self-presentation)
 */

import type { Action, Scenario, InterruptEvent } from "@/core/types";

const R1: Pick<Action, "base" | "riskCurve"> = {
  base: { stability: 5, trust: 2, buffer: -10 },
  riskCurve: { stability: 2, trust: 0, buffer: 2 },
};
const R2: Pick<Action, "base" | "riskCurve"> = {
  base: { stability: 3, trust: 1, buffer: -5 },
  riskCurve: { stability: 4, trust: 2, buffer: 4 },
};
const R3: Pick<Action, "base" | "riskCurve"> = {
  base: { stability: 0, trust: 2, buffer: 0 },
  riskCurve: { stability: -5, trust: 5, buffer: -2 },
};
const R4: Pick<Action, "base" | "riskCurve"> = {
  base: { stability: -4, trust: 0, buffer: 5 },
  riskCurve: { stability: -10, trust: -5, buffer: 8 },
};
const R5: Pick<Action, "base" | "riskCurve"> = {
  base: { stability: -8, trust: -4, buffer: 10 },
  riskCurve: { stability: -20, trust: -10, buffer: 15 },
};

// ─── BASE SCENARIOS ───────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  // s1 — RISK: Do you cut corners when no one's watching?
  {
    id: "s1",
    eyebrow: "First Morning",
    text: "You're almost done with your first task.\nYou spot a small mistake. Easy to miss. Easy to ignore.\n\nNobody has asked about it. Nobody might ever ask.",
    timeLimit: 38,
    mode: "standard",
    actions: [
      { id: "s1-a1", label: "Fix it properly before sending anything",        tags: ["methodical", "quality"],         ...R2 },
      { id: "s1-a2", label: "Send it. It's close enough and you're new here.",tags: ["risk", "selfish"],              ...R5 },
      { id: "s1-a3", label: "Make a quick adjustment and move on",             tags: ["risk", "pragmatic"],             ...R4 },
      { id: "s1-a4", label: "Flag it and ask. Better to be sure on day one.",  tags: ["cautious", "ethical"],           ...R3 },
    ],
  },

  // s2 — PRESSURE: How do you behave when rushed?
  {
    id: "s2",
    eyebrow: "Ten Minutes",
    text: "Your manager needs it in ten minutes.\nYou're not finished. You know what you skipped over.\n\nNo one is watching.",
    timeLimit: 20,
    tag: "high-pressure",
    mode: "interrupt",
    actions: [
      { id: "s2-a1", label: "Send what you have. It will probably hold.",          tags: ["risk", "selfish"],               next: "s3_risk",       ...R4 },
      { id: "s2-a2", label: "Cut anything non-essential and submit what's solid", tags: ["cautious", "methodical"],        next: "s3_methodical", ...R2 },
      { id: "s2-a3", label: "Drop the parts no one will check",                   tags: ["risk", "avoidant"],              next: "s3_risk",       ...R5 },
      { id: "s2-a4", label: "Tell them honestly you need a bit longer",           tags: ["ethical", "pressure_sensitive"], next: "s3_methodical", ...R3 },
    ],
  },

  // s3 — CONSISTENCY: Boundaries when someone isn't responding
  {
    id: "s3",
    eyebrow: "Waiting",
    text: "You need someone's approval before moving forward.\nYou've messaged them twice. Still nothing.\n\nYou could go ahead without it.",
    timeLimit: 27,
    mode: "standard",
    actions: [
      { id: "s3-a1", label: "Do it yourself. You've waited long enough.",           tags: ["risk", "selfish"],         ...R3 },
      { id: "s3-a2", label: "Keep waiting. It isn't your call to make.",           tags: ["cautious", "ethical"],     ...R2 },
      { id: "s3-a3", label: "Walk over and ask them face-to-face",                 tags: ["assertive", "methodical"], ...R4 },
      { id: "s3-a4", label: "Find another way to get unblocked",                   tags: ["pragmatic", "adaptive"],   ...R3 },
    ],
  },

  // s4 — AMBIGUITY / HONESTY: What do you do when you don't have the full picture?
  {
    id: "s4",
    eyebrow: "Without Context",
    text: "You get pulled into a meeting mid-conversation.\nYou caught maybe half of what was said.\n\nNow they're asking what you think.",
    timeLimit: 20,
    mode: "blind",
    actions: [
      { id: "s4-a1", label: "Give your take anyway. Sound confident.",             tags: ["risk", "selfish"],            ...R4 },
      { id: "s4-a2", label: "Ask to be caught up before weighing in",             tags: ["cautious", "ethical"],        ...R2 },
      { id: "s4-a3", label: "Nod along and figure out if it matters later",       tags: ["avoidant", "pressure_sensitive"], ...R5 },
      { id: "s4-a4", label: "Admit you only caught part of the discussion",       tags: ["ethical", "collaborative"],   ...R3 },
    ],
  },

  // s5 — ETHICS / ACCOUNTABILITY: Do you own a mistake or quietly bury it?
  {
    id: "s5",
    eyebrow: "Someone Noticed",
    text: (metrics) =>
      `A colleague mentions something off in your work.\nThey're not blaming you. They're just flagging it.\n\nYou know exactly what happened. System at ${Math.round(metrics.stability)}%.`,
    timeLimit: 33,
    mode: "reversal",
    actions: [
      { id: "s5-a1", label: "Own it immediately. Explain what happened.",          tags: ["ethical", "methodical"],    ...R3 },
      { id: "s5-a2", label: "Say nothing and hope it fades",                       tags: ["avoidant", "selfish"],  next: "s6_cascade", ...R5 },
      { id: "s5-a3", label: "Fix it quietly without saying anything",              tags: ["risk", "selfish"],      next: "s6_cascade", ...R4 },
      { id: "s5-a4", label: "Tell your manager before it becomes a bigger issue",  tags: ["ethical", "assertive"],     ...R2 },
    ],
  },

  // s6 — FAIRNESS: When resources are limited, who do you prioritize?
  {
    id: "s6",
    eyebrow: "Both at Once",
    text: "Two things land on you at the same time.\nOne is what your manager wants done. One is a colleague who's blocked and needs help.\n\nYou can only give one of them your full attention.",
    timeLimit: 21,
    leftLabel: "MANAGER'S PRIORITY",
    rightLabel: "COLLEAGUE'S NEED",
    mode: "allocation",
    actions: [
      { id: "s6-a1", label: "Prioritize what your manager wants",                  tags: ["selfish", "pressure_sensitive"],  ...R4 },
      { id: "s6-a2", label: "Prioritize your colleague. Their need is more urgent.", tags: ["ethical", "decisive"],       ...R4 },
      { id: "s6-a3", label: "Split your attention across both",                    tags: ["cautious", "ethical"],        ...R3 },
      { id: "s6-a4", label: "Ask openly which one should come first",              tags: ["methodical", "collaborative"], ...R2 },
    ],
  },

  // s7 — SOCIAL PRESSURE: Conform vs. integrity in a group
  {
    id: "s7",
    eyebrow: "The Room",
    text: "Someone's presenting a plan in the team meeting.\nThere's a gap in it. Nobody else seems to see it.\n\nYou're the newest person here. Speaking up means standing out.",
    timeLimit: 20,
    mode: "standard",
    actions: [
      { id: "s7-a1", label: "Say something right now, in front of everyone",        tags: ["assertive", "ethical"],          next: "s8_advocate", ...R4 },
      { id: "s7-a2", label: "Stay quiet. You don't want to make waves this early.", tags: ["avoidant", "pressure_sensitive"],               ...R5 },
      { id: "s7-a3", label: "Mention it privately to someone after the meeting",   tags: ["cautious", "ethical"],                           ...R3 },
      { id: "s7-a4", label: "Wait. If it's a real problem, someone else will catch it.", tags: ["pressure_sensitive", "avoidant"],         ...R2 },
    ],
  },

  // s8 — CONSISTENCY: Same decision, scrutinized
  {
    id: "s8",
    eyebrow: "Same Shape Again",
    text: "This looks familiar. You dealt with something like this earlier today.\nDifferent details, same kind of choice.\n\nYou remember what you did last time.",
    timeLimit: 24,
    tag: "repeat",
    mode: "ordering",
    actions: [
      { id: "s8-a1", label: "Handle it the same way. Consistency matters.",        tags: ["consistent", "methodical"],  ...R2 },
      { id: "s8-a2", label: "Try a different approach this time",                  tags: ["risk", "adaptive"],          ...R5 },
      { id: "s8-a3", label: "Quick fix for now. Deal with it properly later.",     tags: ["pragmatic", "avoidant"],     ...R4 },
      { id: "s8-a4", label: "Get another perspective before you decide",           tags: ["cautious", "collaborative"], ...R3 },
    ],
  },

  // s9 — IMPULSIVITY: How do you respond to sudden pressure?
  {
    id: "s9",
    eyebrow: "Right Now",
    text: "Your manager messages you out of nowhere:\n\n\"We have a situation. Can you jump in?\"",
    timeLimit: 12,
    tag: "high-pressure",
    isInterrupt: true,
    mode: "interrupt",
    actions: [
      { id: "s9-a1", label: "Reply immediately. \"On it.\"",                        tags: ["risk", "pressure_sensitive"], ...R4 },
      { id: "s9-a2", label: "Wait a moment and see if more context follows",       tags: ["avoidant", "cautious"],       ...R5 },
      { id: "s9-a3", label: "Ask for 30 seconds. Finish what you're doing first.", tags: ["cautious", "methodical"],     ...R2 },
    ],
  },

  // s10 — IDENTITY: Who do you present yourself as?
  {
    id: "s10",
    eyebrow: "End of Day",
    text: "Your manager asks how the day went.\nIt's been a mixed one. Some things went well. Some didn't.\n\nYou're deciding how much of that to actually say.",
    timeLimit: 20,
    tag: "high-pressure",
    mode: "blind",
    actions: [
      { id: "s10-a1", label: "Give a clean summary. Some things don't need to be said.", tags: ["selfish", "avoidant"],           ...R2 },
      { id: "s10-a2", label: "Be honest. Include the rough parts.",                       tags: ["ethical", "consistent"],         ...R3 },
      { id: "s10-a3", label: "Tell them everything, even what reflects badly on you",     tags: ["ethical", "risk"],               ...R5 },
      { id: "s10-a4", label: "Keep it brief. You need to think before saying too much.",  tags: ["avoidant", "pressure_sensitive"], ...R3 },
    ],
  },
];

// ─── BRANCH VARIANT SCENARIOS ─────────────────────────────────────────────────

export const BRANCH_SCENARIOS: Scenario[] = [
  // s3_risk — ACCOUNTABILITY: Facing the consequence of moving too fast
  {
    id: "s3_risk",
    eyebrow: "What the Rush Cost",
    text: "You got it in on time. But something slipped through.\nA mistake made it out. You moved too fast.\n\nThe person who received it just flagged it.",
    timeLimit: 21,
    mode: "standard",
    actions: [
      { id: "s3r-a1", label: "Fix it and tell them exactly what happened",          tags: ["ethical", "methodical"],     next: "s4", ...R2 },
      { id: "s3r-a2", label: "Ask them for a bit more time to correct it",          tags: ["collaborative", "cautious"], next: "s4", ...R3 },
      { id: "s3r-a3", label: "Fix it quietly without saying anything",              tags: ["selfish", "avoidant"],       next: "s4", ...R4 },
      { id: "s3r-a4", label: "Wait and see if they follow up before acting",        tags: ["risk", "avoidant"],          next: "s4", ...R5 },
    ],
  },

  // s3_methodical — JUDGMENT: Being criticized for doing the right thing
  {
    id: "s3_methodical",
    eyebrow: "The Cost of Being Careful",
    text: "You took your time and did it properly. But that created a delay.\nPeople were waiting. Two of them have said something.\n\nYou think you made the right call. The room doesn't agree.",
    timeLimit: 30,
    mode: "standard",
    actions: [
      { id: "s3m-a1", label: "Acknowledge the delay and explain your reasoning",    tags: ["ethical", "assertive"],           next: "s4", ...R3 },
      { id: "s3m-a2", label: "Take the feedback without comment. It's done.",       tags: ["avoidant", "pressure_sensitive"], next: "s4", ...R2 },
      { id: "s3m-a3", label: "Rush to close the gap and make up for the delay",     tags: ["risk", "pressure_sensitive"],     next: "s4", ...R4 },
      { id: "s3m-a4", label: "Trim the remaining scope to get back on track",       tags: ["methodical", "adaptive"],         next: "s4", ...R3 },
    ],
  },

  // s6_cascade — CONSEQUENCE: Avoidance compounds into something harder
  {
    id: "s6_cascade",
    eyebrow: "It Came Back",
    text: "The thing you left unresolved has grown.\nIt is now blocking two different people.\n\nThis one started with you.",
    timeLimit: 20,
    leftLabel: "FIRST PROBLEM",
    rightLabel: "SECOND PROBLEM",
    mode: "allocation",
    actions: [
      { id: "s6c-a1", label: "Fully commit to fixing the first one",                 tags: ["decisive", "risk"],      next: "s7", ...R4 },
      { id: "s6c-a2", label: "Fully commit to fixing the second one",                tags: ["decisive", "risk"],      next: "s7", ...R4 },
      { id: "s6c-a3", label: "Manage both. Stop them from getting worse.",           tags: ["cautious", "ethical"],   next: "s7", ...R3 },
      { id: "s6c-a4", label: "Be honest. One of these won't get fixed today.",       tags: ["ethical", "methodical"], next: "s7", ...R2 },
    ],
  },

  // s8_advocate — SOCIAL PRESSURE: Can you hold a position when it costs you?
  {
    id: "s8_advocate",
    eyebrow: "After You Said Something",
    text: "After the meeting, a teammate pulls you aside.\nThey didn't like what you said in front of the group.\n\nYou feel the pull to back down.",
    timeLimit: 24,
    tag: "repeat",
    mode: "ordering",
    actions: [
      { id: "s8a-a1", label: "Hold your position. You meant what you said.",         tags: ["consistent", "assertive"],        next: "s9", ...R2 },
      { id: "s8a-a2", label: "Soften it. Maybe you could have said it differently.",  tags: ["pressure_sensitive", "adaptive"], next: "s9", ...R3 },
      { id: "s8a-a3", label: "Apologize. You don't want this to follow you.",         tags: ["avoidant", "pressure_sensitive"], next: "s9", ...R4 },
      { id: "s8a-a4", label: "Bring it to your manager instead of resolving it here", tags: ["risk", "assertive"],              next: "s9", ...R5 },
    ],
  },
];

export const ALL_SCENARIOS: Scenario[] = [...SCENARIOS, ...BRANCH_SCENARIOS];

export const INTERRUPT_EVENTS: InterruptEvent[] = [];
