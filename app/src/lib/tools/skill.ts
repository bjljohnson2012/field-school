export type SkillQuestion = {
  id: string;
  prompt: string;
  hint?: string;
  choices: { label: string; value: number }[];
};

export const skillQuestions: SkillQuestion[] = [
  {
    id: "brief",
    prompt: "Can you write a one-sentence outcome for a job — not the steps?",
    choices: [
      { label: "I still describe the tool or the clicks", value: 1 },
      { label: "I can do it if someone sits with me", value: 2 },
      { label: "I can name the outcome and the leftover human step", value: 3 },
      { label: "I already keep a written brief for recurring work", value: 4 },
    ],
  },
  {
    id: "logins",
    prompt: "Could you map which accounts a teammate must stay signed into?",
    choices: [
      { label: "I have not thought about it", value: 1 },
      { label: "I can list a few, but not what must stay local", value: 2 },
      { label: "I can list cloud vs local and why the job dies without them", value: 3 },
      { label: "I already keep a login map for the desk", value: 4 },
    ],
  },
  {
    id: "ai",
    prompt: "How do you use AI on real work this month?",
    choices: [
      { label: "Chat when I am stuck", value: 1 },
      { label: "Drafts I still rewrite from scratch", value: 2 },
      { label: "Named jobs with a first message and a done check", value: 3 },
      { label: "A small staff with routines and a kill switch", value: 4 },
    ],
  },
  {
    id: "tools",
    prompt: "When a course assumes a paid tool you do not have yet…",
    choices: [
      { label: "I stop", value: 1 },
      { label: "I watch, but I do not practice", value: 2 },
      { label: "I still name the job and write the brief", value: 3 },
      { label: "I practice the brief and know exactly which seat to buy later", value: 4 },
    ],
  },
  {
    id: "ship",
    prompt: "What have you shipped from a chat or a tape in the last year?",
    choices: [
      { label: "Notes only", value: 1 },
      { label: "A draft nobody else used", value: 2 },
      { label: "A dashboard, brief, or page someone else could open", value: 3 },
      { label: "A repeating system with a human on send or pay", value: 4 },
    ],
  },
  {
    id: "track",
    prompt: "How do you know what you can do next week?",
    choices: [
      { label: "I do not. I start over each Sunday.", value: 1 },
      { label: "I remember the last video I liked", value: 2 },
      { label: "I keep a checklist, even if it is messy", value: 3 },
      { label: "I keep a portal: stations, scores, and the next open rung", value: 4 },
    ],
  },
];

const bands = [
  { min: 6, max: 10, label: "Watcher", next: "Name one recurring job and write the outcome in a sentence." },
  { min: 11, max: 16, label: "Operator", next: "Map five logins and hire one bot, one job." },
  { min: 17, max: 21, label: "Crew lead", next: "Add a routine with a done check and a nag line." },
  { min: 22, max: 24, label: "Principal", next: "Keep the human on send and pay, then teach the next person the ladder." },
];

export function scoreSkill(answers: Record<string, number>) {
  const total = skillQuestions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
  const band = bands.find((b) => total >= b.min && total <= b.max) ?? bands[0];
  return {
    total,
    max: skillQuestions.length * 4,
    label: band.label,
    next: band.next,
    summary: `${band.label} · ${total}/${skillQuestions.length * 4}. ${band.next}`,
  };
}
