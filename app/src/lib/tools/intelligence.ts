export type IntelQuestion = {
  id: string;
  prompt: string;
  axis: "notice" | "decide" | "learn";
  choices: { label: string; value: number }[];
};

export const intelligenceQuestions: IntelQuestion[] = [
  {
    id: "notice-signal",
    axis: "notice",
    prompt: "When a new tool shows up at work, what do you clock first?",
    choices: [
      { label: "The logo and the hype", value: 1 },
      { label: "Whether anyone I trust already uses it", value: 2 },
      { label: "What job it would delete or create", value: 3 },
      { label: "The leftover human step and the kill switch", value: 4 },
    ],
  },
  {
    id: "notice-gap",
    axis: "notice",
    prompt: "How quickly do you see the gap between a demo and your Tuesday?",
    choices: [
      { label: "I take the demo at face value", value: 1 },
      { label: "I feel the gap but cannot name it", value: 2 },
      { label: "I can name the missing login, data, or approval", value: 3 },
      { label: "I write the gap as a station before I buy anything", value: 4 },
    ],
  },
  {
    id: "decide-first",
    axis: "decide",
    prompt: "How do you pick the first job to automate?",
    choices: [
      { label: "Whatever is loudest in my inbox", value: 1 },
      { label: "Whatever the video used as an example", value: 2 },
      { label: "The repetitive job with a clear done check", value: 3 },
      { label: "The job I can measure against hours or a hire", value: 4 },
    ],
  },
  {
    id: "decide-risk",
    axis: "decide",
    prompt: "When an agent could email, charge, or publish — what do you do?",
    choices: [
      { label: "Let it run. Speed matters.", value: 1 },
      { label: "I get nervous, then I click through anyway", value: 2 },
      { label: "I keep a human on send and pay", value: 3 },
      { label: "I write the kill switch before the first routine", value: 4 },
    ],
  },
  {
    id: "learn-pace",
    axis: "learn",
    prompt: "How do you actually learn a new lane?",
    choices: [
      { label: "I binge, then I forget", value: 1 },
      { label: "I take notes I never reopen", value: 2 },
      { label: "I do the field work even without the paid seat", value: 3 },
      { label: "I clear a ladder: clip, work, quiz, then I keep the score", value: 4 },
    ],
  },
  {
    id: "learn-transfer",
    axis: "learn",
    prompt: "After one course, can you run the next one without a tour guide?",
    choices: [
      { label: "Not yet. I need someone to start me.", value: 1 },
      { label: "I can start, but I lose the plot mid-week", value: 2 },
      { label: "I can walk a published ladder as a guest", value: 3 },
      { label: "I can brief someone else on the same ladder", value: 4 },
    ],
  },
];

const axisLabel: Record<IntelQuestion["axis"], string> = {
  notice: "Notice",
  decide: "Decide",
  learn: "Learn",
};

function bandFor(score: number) {
  if (score >= 7) return "sharp";
  if (score >= 5) return "working";
  return "warming";
}

export function scoreIntelligence(answers: Record<string, number>) {
  const axes: Record<string, number> = { notice: 0, decide: 0, learn: 0 };
  for (const q of intelligenceQuestions) {
    axes[q.axis] += answers[q.id] ?? 0;
  }
  const total = axes.notice + axes.decide + axes.learn;
  const lead = (Object.keys(axes) as IntelQuestion["axis"][]).sort(
    (a, b) => axes[b] - axes[a],
  )[0];
  const labels: Record<string, string> = {
    notice: `${axisLabel.notice} · ${bandFor(axes.notice)}`,
    decide: `${axisLabel.decide} · ${bandFor(axes.decide)}`,
    learn: `${axisLabel.learn} · ${bandFor(axes.learn)}`,
    lead: axisLabel[lead],
  };
  const summary = `Lead with ${axisLabel[lead].toLowerCase()}. Notice ${axes.notice}/8, decide ${axes.decide}/8, learn ${axes.learn}/8.`;
  return {
    total,
    max: intelligenceQuestions.length * 4,
    axes,
    labels,
    lead: axisLabel[lead],
    summary,
  };
}
