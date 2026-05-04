/**
 * scenarioRegistry.ts
 * Authoritative registry of all scenario definitions.
 * Scenarios are the unit of interaction in the behavioral engine.
 */

import type { Action, Scenario, InterruptEvent } from "@/core/types";

// Risk profile presets — reusable across scenarios
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

export const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    eyebrow: "Initial Issue",
    text: "You're close to finishing something important.\nEverything has been building toward this moment.\n\nThen you notice something isn't right.",
    timeLimit: 25,
    mode: "standard",
    actions: [
      { id: "s1-a1", label: "Fix it completely", ...R2 },
      { id: "s1-a2", label: "Move forward anyway", ...R5 },
      { id: "s1-a3", label: "Do a quick temporary fix", ...R4 },
      { id: "s1-a4", label: "Ask someone for input", ...R3 },
    ],
  },
  {
    id: "s2",
    eyebrow: "Time Pressure",
    text: "The deadline is rapidly approaching.\nYou are falling dangerously behind schedule.\n\nEvery second spent thinking is a second lost.",
    timeLimit: 12,
    tag: "high-pressure",
    mode: "interrupt",
    actions: [
      { id: "s2-a1", label: "Speed up and finish", ...R4 },
      { id: "s2-a2", label: "Slow down to stay accurate", ...R2 },
      { id: "s2-a3", label: "Cut corners", ...R5 },
      { id: "s2-a4", label: "Reprioritize tasks", ...R3 },
    ],
  },
  {
    id: "s3",
    eyebrow: "Dependency",
    text: "Your progress is completely stalled.\nYou are waiting on a critical delivery from someone else.\n\nThey just missed their window.",
    timeLimit: 18,
    mode: "standard",
    actions: [
      { id: "s3-a1", label: "Take over their part", ...R3 },
      { id: "s3-a2", label: "Wait and trust them", ...R2 },
      { id: "s3-a3", label: "Confront them", ...R4 },
      { id: "s3-a4", label: "Change your plan", ...R3 },
    ],
  },
  {
    id: "s4",
    eyebrow: "Limited Information",
    text: "A choice has to be made immediately.\nThe data you have is fragmented and incomplete.\n\nWaiting clears the fog, but burns the timeline.",
    timeLimit: 8,
    mode: "blind",
    actions: [
      { id: "s4-a1", label: "Decide immediately", ...R4 },
      { id: "s4-a2", label: "Wait for clarity", ...R2 },
      { id: "s4-a3", label: "Make a guess", ...R5 },
      { id: "s4-a4", label: "Ask quickly for input", ...R3 },
    ],
  },
  {
    id: "s5",
    eyebrow: "Consequence",
    text: (metrics) =>
      `The impact of your earlier decisions is cascading.\nA new fracture has appeared in the system.\n\nCurrent stability is holding at ${Math.round(metrics.stability)}%.`,
    timeLimit: 22,
    mode: "reversal",
    actions: [
      { id: "s5-a1", label: "Fix it properly", ...R3 },
      { id: "s5-a2", label: "Ignore and continue", ...R5 },
      { id: "s5-a3", label: "Apply another quick fix", ...R4 },
      { id: "s5-a4", label: "Escalate", ...R2 },
    ],
  },
  {
    id: "s6",
    eyebrow: "Conflicting Priorities",
    text: "Two critical alerts trigger simultaneously.\nBoth require your undivided attention.\n\nYou cannot save both.",
    timeLimit: 14,
    leftLabel: "FOCUS TASK A",
    rightLabel: "FOCUS TASK B",
    mode: "allocation",
    actions: [
      { id: "s6-a1", label: "Focus entirely on the first issue", ...R4 },
      { id: "s6-a2", label: "Focus entirely on the second issue", ...R4 },
      { id: "s6-a3", label: "Try to balance both", ...R3 },
      { id: "s6-a4", label: "Delay one to fix the other perfectly", ...R2 },
    ],
  },
  {
    id: "s7",
    eyebrow: "Social Risk",
    text: "A quiet flaw is emerging in the framework.\nAddressing it now means challenging the consensus.\n\nSilence is safe, but potentially catastrophic.",
    timeLimit: 10,
    mode: "standard",
    actions: [
      { id: "s7-a1", label: "Speak up directly", ...R4 },
      { id: "s7-a2", label: "Stay silent", ...R5 },
      { id: "s7-a3", label: "Mention it subtly", ...R3 },
      { id: "s7-a4", label: "Wait and observe", ...R2 },
    ],
  },
  {
    id: "s8",
    eyebrow: "Repeated Pattern",
    text: "You've seen this exact shape of failure before.\nThe same pattern is surfacing just before completion.\n\nThe system is testing your consistency.",
    timeLimit: 16,
    tag: "repeat",
    mode: "ordering",
    actions: [
      { id: "s8-a1", label: "Resolve it thoroughly", ...R2 },
      { id: "s8-a2", label: "Proceed regardless", ...R5 },
      { id: "s8-a3", label: "Apply a patch", ...R4 },
      { id: "s8-a4", label: "Request another perspective", ...R3 },
    ],
  },
  {
    id: "s9",
    eyebrow: "Interrupt Event",
    text: "The architecture just fractured.\n\nAct immediately.",
    timeLimit: 3,
    tag: "high-pressure",
    isInterrupt: true,
    mode: "interrupt",
    actions: [
      { id: "s9-a1", label: "Fix quickly", ...R4 },
      { id: "s9-a2", label: "Ignore", ...R5 },
      { id: "s9-a3", label: "Pause everything", ...R2 },
    ],
  },
  {
    id: "s10",
    eyebrow: "Final Decision",
    text: "The final sequence is locked in.\nEvery choice you've made has led to this state.\n\nHow do you end this?",
    timeLimit: 11,
    tag: "high-pressure",
    mode: "blind",
    actions: [
      { id: "s10-a1", label: "Play safe", ...R2 },
      { id: "s10-a2", label: "Take a calculated risk", ...R3 },
      { id: "s10-a3", label: "Go all in", ...R5 },
      { id: "s10-a4", label: "Step back and reassess", ...R3 },
    ],
  },
];

export const INTERRUPT_EVENTS: InterruptEvent[] = [];
