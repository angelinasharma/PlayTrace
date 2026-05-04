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
    text: "Your first task is nearly done.\nThen you notice something that's slightly off — a small error, easy to miss.\n\nNo one's asked you about it. No one probably will.",
    timeLimit: 25,
    mode: "standard",
    actions: [
      { id: "s1-a1", label: "Fix it properly before sending anything",       tags: ["methodical", "quality"],        ...R2 },
      { id: "s1-a2", label: "Send it. It's close enough and you're new here.", tags: ["risk", "selfish"],             ...R5 },
      { id: "s1-a3", label: "Make a quick adjustment and move on",            tags: ["risk", "pragmatic"],            ...R4 },
      { id: "s1-a4", label: "Flag it and ask — better to be sure on day one", tags: ["cautious", "ethical"],          ...R3 },
    ],
  },

  // s2 — PRESSURE: How do you behave when rushed?
  {
    id: "s2",
    eyebrow: "Ten Minutes",
    text: "Your manager needs it in ten minutes.\nYou're not done — and you're aware of what you just glossed over.\n\nNo one's watching how you handle this.",
    timeLimit: 12,
    tag: "high-pressure",
    mode: "interrupt",
    actions: [
      { id: "s2-a1", label: "Send what you have. It'll probably hold.",           tags: ["risk", "selfish"],          next: "s3_risk",       ...R4 },
      { id: "s2-a2", label: "Take a breath, cut anything non-essential",          tags: ["cautious", "methodical"],   next: "s3_methodical", ...R2 },
      { id: "s2-a3", label: "Drop the parts no one will check",                   tags: ["risk", "avoidant"],         next: "s3_risk",       ...R5 },
      { id: "s2-a4", label: "Tell them honestly you need a bit longer",           tags: ["ethical", "pressure_sensitive"], next: "s3_methodical", ...R3 },
    ],
  },

  // s3 — CONSISTENCY: Boundaries when someone isn't responding
  {
    id: "s3",
    eyebrow: "Waiting",
    text: "You need a sign-off before you can continue.\nYou've messaged them twice. Nothing.\n\nYou could probably just proceed without it.",
    timeLimit: 18,
    mode: "standard",
    actions: [
      { id: "s3-a1", label: "Do it yourself — you've waited long enough",          tags: ["risk", "selfish"],          ...R3 },
      { id: "s3-a2", label: "Keep waiting. It isn't your call to make.",           tags: ["cautious", "ethical"],      ...R2 },
      { id: "s3-a3", label: "Walk over and ask them face-to-face",                 tags: ["assertive", "methodical"],  ...R4 },
      { id: "s3-a4", label: "Find a way to route around the bottleneck",           tags: ["pragmatic", "adaptive"],    ...R3 },
    ],
  },

  // s4 — AMBIGUITY / HONESTY: What do you do when you don't have the full picture?
  {
    id: "s4",
    eyebrow: "Without Context",
    text: "You've been asked for your opinion in a meeting.\nYou caught about half the conversation before you were pulled in.\n\nEveryone's looking at you.",
    timeLimit: 8,
    mode: "blind",
    actions: [
      { id: "s4-a1", label: "Give your take anyway — sound confident",            tags: ["risk", "selfish"],           ...R4 },
      { id: "s4-a2", label: "Ask to be caught up before weighing in",             tags: ["cautious", "ethical"],       ...R2 },
      { id: "s4-a3", label: "Nod along. You'll figure out if it matters later.",  tags: ["avoidant", "pressure_sensitive"], ...R5 },
      { id: "s4-a4", label: "Admit you only caught part of the discussion",       tags: ["ethical", "collaborative"],  ...R3 },
    ],
  },

  // s5 — ETHICS / ACCOUNTABILITY: Do you own a mistake or quietly bury it?
  {
    id: "s5",
    eyebrow: "Someone Noticed",
    text: (metrics) =>
      `A colleague flags something in what you submitted.\nThey're not accusing you — just pointing it out.\n\nYou know exactly what caused it. Confidence holding at ${Math.round(metrics.stability)}%.`,
    timeLimit: 22,
    mode: "reversal",
    actions: [
      { id: "s5-a1", label: "Own it immediately. Explain what happened.",          tags: ["ethical", "methodical"],     ...R3 },
      { id: "s5-a2", label: "Say nothing and hope it fades.",                      tags: ["avoidant", "selfish"],  next: "s6_cascade", ...R5 },
      { id: "s5-a3", label: "Make a quiet correction without mentioning it",       tags: ["risk", "selfish"],      next: "s6_cascade", ...R4 },
      { id: "s5-a4", label: "Tell your manager before it becomes a bigger thing",  tags: ["ethical", "assertive"],      ...R2 },
    ],
  },

  // s6 — FAIRNESS: When resources are limited, who do you prioritize?
  {
    id: "s6",
    eyebrow: "Both at Once",
    text: "Two requests land on you simultaneously.\nOne is your manager's priority. One is more urgent for a colleague who's stuck.\n\nYou can only do one of them properly.",
    timeLimit: 14,
    leftLabel: "MANAGER'S PRIORITY",
    rightLabel: "COLLEAGUE'S NEED",
    mode: "allocation",
    actions: [
      { id: "s6-a1", label: "Prioritize what your manager wants",                  tags: ["selfish", "pressure_sensitive"], ...R4 },
      { id: "s6-a2", label: "Prioritize your colleague — their need is more urgent", tags: ["ethical", "decisive"],      ...R4 },
      { id: "s6-a3", label: "Split your attention across both",                    tags: ["cautious", "ethical"],       ...R3 },
      { id: "s6-a4", label: "Ask openly which one should come first",              tags: ["methodical", "collaborative"],...R2 },
    ],
  },

  // s7 — SOCIAL PRESSURE: Conform vs. integrity in a group
  {
    id: "s7",
    eyebrow: "The Room",
    text: "In a team meeting, someone presents a plan with a gap that nobody else seems to notice.\nYou can see the issue clearly.\n\nYou're the newest person in the room. Speaking up means standing out.",
    timeLimit: 10,
    mode: "standard",
    actions: [
      { id: "s7-a1", label: "Say something — right now, in front of everyone",     tags: ["assertive", "ethical"],   next: "s8_advocate", ...R4 },
      { id: "s7-a2", label: "Stay quiet. You don't want to make waves this early.", tags: ["avoidant", "pressure_sensitive"],               ...R5 },
      { id: "s7-a3", label: "Mention it privately to someone after the meeting",   tags: ["cautious", "ethical"],                           ...R3 },
      { id: "s7-a4", label: "Wait — if it's a real problem, someone else will catch it", tags: ["pressure_sensitive", "avoidant"],          ...R2 },
    ],
  },

  // s8 — CONSISTENCY: Same decision, scrutinized
  {
    id: "s8",
    eyebrow: "Same Shape Again",
    text: "You've seen this kind of problem before — earlier today, actually.\nThe situation is different, but the choice is the same.\n\nYou remember what you did last time.",
    timeLimit: 16,
    tag: "repeat",
    mode: "ordering",
    actions: [
      { id: "s8-a1", label: "Handle it the same way. Consistency matters.",        tags: ["consistent", "methodical"],  ...R2 },
      { id: "s8-a2", label: "Try a different approach this time",                  tags: ["risk", "adaptive"],          ...R5 },
      { id: "s8-a3", label: "Quick fix for now — deal with it properly later",     tags: ["pragmatic", "avoidant"],     ...R4 },
      { id: "s8-a4", label: "Get another perspective before you decide",           tags: ["cautious", "collaborative"], ...R3 },
    ],
  },

  // s9 — IMPULSIVITY: How do you respond to sudden pressure?
  {
    id: "s9",
    eyebrow: "Right Now",
    text: "Your manager pings you mid-afternoon:\n\n\"We have a situation. Can you jump in?\"",
    timeLimit: 3,
    tag: "high-pressure",
    isInterrupt: true,
    mode: "interrupt",
    actions: [
      { id: "s9-a1", label: "\"On it\" — reply immediately, no questions",        tags: ["risk", "pressure_sensitive"], ...R4 },
      { id: "s9-a2", label: "Wait a moment and see if more context follows",       tags: ["avoidant", "cautious"],       ...R5 },
      { id: "s9-a3", label: "\"Give me 30 seconds\" — finish what you're doing",  tags: ["cautious", "methodical"],     ...R2 },
    ],
  },

  // s10 — IDENTITY: Who do you present yourself as?
  {
    id: "s10",
    eyebrow: "End of Day",
    text: "Your manager asks how the day went.\nIt's been complicated. Some things you handled well. Some you didn't.\n\nYou're not sure which version of today you want to be honest about.",
    timeLimit: 11,
    tag: "high-pressure",
    mode: "blind",
    actions: [
      { id: "s10-a1", label: "Give a clean summary — some things don't need to be said", tags: ["selfish", "avoidant"],       ...R2 },
      { id: "s10-a2", label: "Be honest — the rough parts included",                      tags: ["ethical", "consistent"],    ...R3 },
      { id: "s10-a3", label: "Tell them everything, even what reflects badly on you",     tags: ["ethical", "risk"],          ...R5 },
      { id: "s10-a4", label: "Keep it brief. You need to think before you say too much.", tags: ["avoidant", "pressure_sensitive"], ...R3 },
    ],
  },
];

// ─── BRANCH VARIANT SCENARIOS ─────────────────────────────────────────────────

export const BRANCH_SCENARIOS: Scenario[] = [
  // s3_risk — ACCOUNTABILITY: Facing the consequence of moving too fast
  {
    id: "s3_risk",
    eyebrow: "What the Rush Cost",
    text: "You sent it in time. But now you can see what slipped through.\nA mistake made it out — a direct result of moving too fast.\n\nThe person who received it just flagged it.",
    timeLimit: 14,
    mode: "standard",
    actions: [
      { id: "s3r-a1", label: "Fix it and tell them exactly what happened",          tags: ["ethical", "methodical"],   next: "s4", ...R2 },
      { id: "s3r-a2", label: "Ask them for a bit more time to correct it",          tags: ["collaborative", "cautious"], next: "s4", ...R3 },
      { id: "s3r-a3", label: "Make the fix quietly, without explanation",           tags: ["selfish", "avoidant"],     next: "s4", ...R4 },
      { id: "s3r-a4", label: "See if they push further before doing anything",      tags: ["risk", "avoidant"],        next: "s4", ...R5 },
    ],
  },

  // s3_methodical — JUDGMENT: Being criticized for doing the right thing
  {
    id: "s3_methodical",
    eyebrow: "The Cost of Being Careful",
    text: "You slowed down and did it right. But it left a gap in the timeline.\nPeople were waiting. Two of them have already mentioned it.\n\nYou stand by what you did — but the room doesn't feel that way.",
    timeLimit: 20,
    mode: "standard",
    actions: [
      { id: "s3m-a1", label: "Acknowledge the delay and explain your reasoning",    tags: ["ethical", "assertive"],      next: "s4", ...R3 },
      { id: "s3m-a2", label: "Absorb the feedback without comment. It's done.",     tags: ["avoidant", "pressure_sensitive"], next: "s4", ...R2 },
      { id: "s3m-a3", label: "Rush to close the gap and make up for it",            tags: ["risk", "pressure_sensitive"], next: "s4", ...R4 },
      { id: "s3m-a4", label: "Trim the remaining scope to get back on track",       tags: ["methodical", "adaptive"],    next: "s4", ...R3 },
    ],
  },

  // s6_cascade — CONSEQUENCE: Avoidance compounds into something harder
  {
    id: "s6_cascade",
    eyebrow: "It Came Back",
    text: "The thing you didn't address has grown.\nNow it's tangled up with something else — two separate people are stuck because of it.\n\nThis one is yours.",
    timeLimit: 12,
    leftLabel: "FIRST PROBLEM",
    rightLabel: "SECOND PROBLEM",
    mode: "allocation",
    actions: [
      { id: "s6c-a1", label: "Fully commit to fixing the first",                    tags: ["decisive", "risk"],       next: "s7", ...R4 },
      { id: "s6c-a2", label: "Fully commit to fixing the second",                   tags: ["decisive", "risk"],       next: "s7", ...R4 },
      { id: "s6c-a3", label: "Manage both — stop them getting worse",               tags: ["cautious", "ethical"],    next: "s7", ...R3 },
      { id: "s6c-a4", label: "Be honest: one of these won't get fixed today",       tags: ["ethical", "methodical"],  next: "s7", ...R2 },
    ],
  },

  // s8_advocate — SOCIAL PRESSURE: Can you hold a position when it costs you?
  {
    id: "s8_advocate",
    eyebrow: "After You Said Something",
    text: "After the meeting, a teammate pulls you aside.\nThey weren't pleased with what you raised in front of everyone.\n\nYou feel the pressure to back down.",
    timeLimit: 16,
    tag: "repeat",
    mode: "ordering",
    actions: [
      { id: "s8a-a1", label: "Hold your position. You meant what you said.",        tags: ["consistent", "assertive"],    next: "s9", ...R2 },
      { id: "s8a-a2", label: "Soften it — maybe you could've said it differently",  tags: ["pressure_sensitive", "adaptive"], next: "s9", ...R3 },
      { id: "s8a-a3", label: "Apologize. You don't want this to follow you.",        tags: ["avoidant", "pressure_sensitive"], next: "s9", ...R4 },
      { id: "s8a-a4", label: "Bring it to your manager rather than resolve it here", tags: ["risk", "assertive"],          next: "s9", ...R5 },
    ],
  },
];

export const ALL_SCENARIOS: Scenario[] = [...SCENARIOS, ...BRANCH_SCENARIOS];

export const INTERRUPT_EVENTS: InterruptEvent[] = [];
