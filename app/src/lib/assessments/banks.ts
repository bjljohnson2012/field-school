import { intelligenceQuestions } from "../tools/intelligence.ts";
import { skillQuestions } from "../tools/skill.ts";

export type Choice = { label: string; value: number };

export type BankItem = {
  key: string;
  prompt: string;
  choices: readonly Choice[];
  /** Raw loading on each latent dimension of the track, in track dim order. */
  loadings: readonly number[];
};

export const SKILL_DIMS = ["briefs", "systems", "ai_crew", "shipping"] as const;
export const INTEL_DIMS = ["notice", "decide", "learn"] as const;

const ladder = (labels: readonly [string, string, string, string]): Choice[] =>
  labels.map((label, i) => ({ label, value: i + 1 }));

function skillLoad(dim: (typeof SKILL_DIMS)[number]): number[] {
  return SKILL_DIMS.map((d) => (d === dim ? 1 : 0));
}

function intelLoad(dim: (typeof INTEL_DIMS)[number]): number[] {
  return INTEL_DIMS.map((d) => (d === dim ? 1 : 0));
}

const TOOLS_SKILL_DIM: Record<string, (typeof SKILL_DIMS)[number]> = {
  brief: "briefs",
  tools: "briefs",
  logins: "systems",
  track: "systems",
  ai: "ai_crew",
  ship: "shipping",
};

/**
 * Field School items. The six Tools Skill items are reused unchanged; the rest are
 * written in the same voice so the adaptive track has room to separate bands.
 */
const extraSkillItems: { key: string; dim: (typeof SKILL_DIMS)[number]; prompt: string; choices: [string, string, string, string] }[] = [
  {
    key: "brief-handoff",
    dim: "briefs",
    prompt: "Could a teammate pick up your task from what you wrote down, without asking you?",
    choices: ["No, it lives in my head", "Only with a call first", "Yes, for the jobs I repeat", "Yes, and I check my briefs against the result"],
  },
  {
    key: "brief-done",
    dim: "briefs",
    prompt: "When you hand off a job, do you say what done looks like?",
    choices: ["I say what to do, not what done is", "Sometimes, when it goes wrong first", "Yes, one sentence of done for each job", "Yes, and the done check is written before work starts"],
  },
  {
    key: "brief-scope",
    dim: "briefs",
    prompt: "How do you keep a job from growing while it runs?",
    choices: ["It usually grows", "I notice late and cut", "I name what is out of scope up front", "I keep a running out-of-scope list the next job can pick from"],
  },
  {
    key: "systems-routine",
    dim: "systems",
    prompt: "Do any of your recurring jobs run on a schedule without you starting them?",
    choices: ["None", "One, and I still babysit it", "A few, each with a done check", "Several, each with a nag line when it misses"],
  },
  {
    key: "systems-recover",
    dim: "systems",
    prompt: "When a login expires mid-job, what happens?",
    choices: ["The job dies and I find out later", "I find out when someone asks", "I get a note and fix it the same day", "The job pauses, tells me, and resumes after I sign in"],
  },
  {
    key: "systems-kill",
    dim: "systems",
    prompt: "Can you stop every automated job you run in one move?",
    choices: ["I would not know where to start", "I would have to hunt for each one", "Yes, from one list", "Yes, and I have tested the kill switch"],
  },
  {
    key: "ai-first-message",
    dim: "ai_crew",
    prompt: "When you start an AI job, what goes in the first message?",
    choices: ["A question", "A question plus some context", "The outcome, the inputs, and the done check", "A reusable brief I keep and improve"],
  },
  {
    key: "ai-check",
    dim: "ai_crew",
    prompt: "How do you check what an AI hands back?",
    choices: ["I trust it", "I skim it", "I check it against the done line", "I keep a checklist the bot runs on itself before I see it"],
  },
  {
    key: "ai-staff",
    dim: "ai_crew",
    prompt: "How many named AI jobs do you run in a normal week?",
    choices: ["None yet", "One I try now and then", "Two or three with names and briefs", "A small staff, each with a routine"],
  },
  {
    key: "ship-other-user",
    dim: "shipping",
    prompt: "Has someone else used a thing you built this quarter?",
    choices: ["No", "They saw it once", "Yes, a few times", "Yes, every week"],
  },
  {
    key: "ship-fix",
    dim: "shipping",
    prompt: "When something you shipped breaks, how long until it works again?",
    choices: ["I have not shipped anything that could break", "Days, and I start from scratch", "Same day, from my notes", "Hours, and the fix goes back into the brief"],
  },
  {
    key: "ship-teach",
    dim: "shipping",
    prompt: "Could you teach someone else to run what you shipped?",
    choices: ["Not yet", "With a long call", "Yes, from a written page", "Yes, and someone already has"],
  },
];

const extraIntelItems: { key: string; dim: (typeof INTEL_DIMS)[number]; prompt: string; choices: [string, string, string, string] }[] = [
  {
    key: "notice-change",
    dim: "notice",
    prompt: "When a routine at work quietly changes, how soon do you see it?",
    choices: ["When it breaks", "When someone mentions it", "Within a few days", "The first time it runs differently"],
  },
  {
    key: "notice-who",
    dim: "notice",
    prompt: "In a new team, how fast do you learn who actually decides?",
    choices: ["I go by the org chart", "After a few weeks", "After a few meetings", "In the first meeting, from who others look at"],
  },
  {
    key: "notice-cost",
    dim: "notice",
    prompt: "When a tool is free, what do you look for?",
    choices: ["Nothing, free is free", "Whether there is a paid tier", "What it does with my data", "What it would cost to leave it in a year"],
  },
  {
    key: "notice-repeat",
    dim: "notice",
    prompt: "Do you spot the jobs you do the same way every week?",
    choices: ["Not really", "When someone points them out", "Yes, I could list a few", "Yes, I keep the list and pick from it"],
  },
  {
    key: "decide-stop",
    dim: "decide",
    prompt: "How do you decide to stop a project that is not working?",
    choices: ["I keep going until it is obvious", "When someone tells me to", "When it misses a check I set", "I set the stop line before I start"],
  },
  {
    key: "decide-small",
    dim: "decide",
    prompt: "Faced with a big change, what do you try first?",
    choices: ["The whole thing at once", "Whatever is easiest", "The smallest piece I can check", "The smallest piece that proves or kills the whole idea"],
  },
  {
    key: "decide-tradeoff",
    dim: "decide",
    prompt: "When two good options compete, how do you pick?",
    choices: ["Gut, then I second-guess", "I ask around and go with the majority", "I write the tradeoff in a sentence and pick", "I pick, and write what would make me switch"],
  },
  {
    key: "decide-who",
    dim: "decide",
    prompt: "Do you know which decisions you should not make alone?",
    choices: ["Not really", "I find out after", "Yes, for money and people", "Yes, and I have said so to the people involved"],
  },
  {
    key: "learn-mistake",
    dim: "learn",
    prompt: "After a mistake, what do you keep?",
    choices: ["The bad feeling", "A mental note", "A written note for next time", "A change to the checklist that would have caught it"],
  },
  {
    key: "learn-gap",
    dim: "learn",
    prompt: "When you hit something you cannot do yet, what do you do?",
    choices: ["Avoid it", "Wait for a course", "Find one example and try it", "Find the smallest field task and do it today"],
  },
  {
    key: "learn-explain",
    dim: "learn",
    prompt: "After you learn something, can you explain it to a beginner?",
    choices: ["Rarely", "With my notes open", "Yes, in a few minutes", "Yes, and I usually do"],
  },
  {
    key: "learn-return",
    dim: "learn",
    prompt: "Do you go back to what you learned a month ago?",
    choices: ["No", "When I need it and cannot find it", "Yes, my notes are where I can find them", "Yes, on a schedule"],
  },
];

export function skillBank(): BankItem[] {
  const tools = skillQuestions.map((q) => ({
    key: q.id,
    prompt: q.prompt,
    choices: q.choices,
    loadings: skillLoad(TOOLS_SKILL_DIM[q.id]),
  }));
  const extra = extraSkillItems.map((item) => ({
    key: item.key,
    prompt: item.prompt,
    choices: ladder(item.choices),
    loadings: skillLoad(item.dim),
  }));
  return [...tools, ...extra];
}

export function intelligenceBank(): BankItem[] {
  const tools = intelligenceQuestions.map((q) => ({
    key: q.id,
    prompt: q.prompt,
    choices: q.choices,
    loadings: intelLoad(q.axis),
  }));
  const extra = extraIntelItems.map((item) => ({
    key: item.key,
    prompt: item.prompt,
    choices: ladder(item.choices),
    loadings: intelLoad(item.dim),
  }));
  return [...tools, ...extra];
}
