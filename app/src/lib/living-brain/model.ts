import { lessonSpineConfidence, lessonSpineStep } from "../player/lesson-spine-step.ts";

export type Room = "household" | "sales";

export type OutcomeMark = { outcomes: string };

export type LivingPerson = {
  membershipId: string;
  name: string;
  kind: string;
  login: "none" | "member";
  profile: string;
  outcomes: string;
  ownsOutcomes: false;
  history: OutcomeMark[];
  confidence: string;
};

export type LivingBrain = {
  orgId: string;
  room: Room;
  facts: string;
  outcome: string;
  people: LivingPerson[];
};

export type BrainActor = {
  kind: string;
  stance: string;
  org: Room;
  membershipId: string;
};

const MAX = 2000;
const HISTORY_MAX = 8;

/** Recent next steps, oldest first. The same step twice in a row is kept once. */
export function rememberOutcome(prior: OutcomeMark[] | undefined, outcomes: string): OutcomeMark[] {
  const marks = (prior ?? [])
    .map((mark) => ({ outcomes: clip(mark?.outcomes || "") }))
    .filter((mark) => mark.outcomes)
    .slice(-HISTORY_MAX);
  const next = clip(outcomes);
  if (!next) return marks;
  if (marks[marks.length - 1]?.outcomes === next) return marks;
  return [...marks, { outcomes: next }].slice(-HISTORY_MAX);
}

function clip(value: string) {
  return value.trim().slice(0, MAX);
}

export function personAllowed(
  room: Room,
  person: { kind: string; login: "none" | "member"; membershipId: string },
  actorId: string,
) {
  if (!person.membershipId || person.membershipId === actorId) return false;
  if (room === "household") return person.kind === "child" && person.login === "none";
  return person.kind !== "child" && person.login === "member";
}

export function actorMayWrite(actor: BrainActor) {
  if (actor.kind === "child") return false;
  if (actor.org === "household") return actor.stance === "guardian" || actor.stance === "admin";
  return actor.stance === "trainer" || actor.stance === "admin";
}

export function shapeBrain(input: {
  orgId: string;
  room: Room;
  facts: string;
  outcome?: string;
  actorId: string;
  people: Array<{
    membershipId: string;
    name: string;
    kind: string;
    login: "none" | "member";
    profile: string;
    outcomes: string;
    history?: OutcomeMark[];
    confidence?: string;
  }>;
}): { ok: true; brain: LivingBrain } | { ok: false; error: string } {
  const people: LivingPerson[] = [];
  for (const person of input.people) {
    if (input.room === "sales" && (person.kind === "child" || person.login === "none")) {
      return { ok: false, error: "sales_has_no_children" };
    }
    if (!personAllowed(input.room, person, input.actorId)) {
      return { ok: false, error: input.room === "household" ? "child_has_no_login" : "not_on_desk" };
    }
    people.push({
      membershipId: person.membershipId,
      name: clip(person.name),
      kind: person.kind,
      login: person.login,
      profile: clip(person.profile),
      outcomes: clip(person.outcomes),
      ownsOutcomes: false,
      history: rememberOutcome(person.history, person.outcomes),
      confidence: clip(person.confidence || ""),
    });
  }
  return {
    ok: true,
    brain: {
      orgId: input.orgId,
      room: input.room,
      facts: clip(input.facts),
      outcome: clip(input.outcome || ""),
      people,
    },
  };
}

const MECHANICAL_PROFILE = /^(Assigned|Taught|Learned|Progress saved)\. Next step is /;

/** Org facts look like "Ada: Finish the page." A person's profile should not repeat that whole line. */
function pathForOnePerson(pathTitle: string) {
  const path = pathTitle.trim();
  if (!path) return "";
  if (/^[^:]{1,80}:\s+\S/.test(path.replace(/\.$/, ""))) return "";
  return path;
}

function onThisDesk(room: Room, person: { kind: string; login: "none" | "member"; ownsOutcomes?: boolean }) {
  if (person.ownsOutcomes) return false;
  if (room === "sales") return person.kind !== "child" && person.login === "member";
  return person.kind === "child" && person.login === "none";
}

/** One line for the whole desk. Sales never names a child. */
export function deskFacts(
  room: Room,
  people: Array<{ name: string; kind: string; login: "none" | "member"; outcomes: string; ownsOutcomes?: boolean }>,
) {
  const lines = people
    .filter((person) => onThisDesk(room, person))
    .map((person) => ({ name: clip(person.name) || "This person", outcomes: clip(person.outcomes) }))
    .filter((person) => person.outcomes)
    .sort((a, b) => a.name.localeCompare(b.name) || a.outcomes.localeCompare(b.outcomes));
  if (!lines.length) return "";
  return clip(`${lines.map((person) => `${person.name}: ${person.outcomes}`).join(". ")}.`);
}

export function assistFacts(input: {
  room: Room;
  facts: string;
  people: Array<{ name: string; kind: string; login: "none" | "member"; outcomes: string; ownsOutcomes?: boolean }>;
}): { ok: true; facts: string; changed: boolean } | { ok: false; error: string } {
  const facts = deskFacts(input.room, input.people);
  if (!facts) return { ok: false, error: "no_context" };
  return { ok: true, facts, changed: facts !== input.facts.trim() };
}

export function applyFactsAssist(
  brain: LivingBrain,
  actor: BrainActor,
): { ok: true; brain: LivingBrain } | { ok: false; error: string } {
  if (actor.kind === "child") return { ok: false, error: "child_has_no_login" };
  if (!actorMayWrite(actor)) return { ok: false, error: "not_leader" };
  if (actor.org !== brain.room) return { ok: false, error: "wrong_desk" };
  const drafted = assistFacts(brain);
  if (!drafted.ok) return drafted;
  const people = brain.people.map((row) => ({ ...row, ownsOutcomes: false as const }));
  return {
    ok: true,
    brain: {
      ...brain,
      facts: drafted.facts,
      people: brain.room === "sales" ? people.filter((row) => row.kind !== "child" && row.login === "member") : people,
    },
  };
}

export type AssistDraft = {
  profile: string;
  outcomes: string;
  changed: boolean;
};

/**
 * Suggest a clearer profile and the next step from what the org already knows.
 * A rich profile stays. A thin one is rewritten. The learner does not own outcomes.
 */
export function assistDraft(input: {
  room: Room;
  person: {
    name: string;
    kind: string;
    login: "none" | "member";
    profile: string;
    outcomes: string;
    ownsOutcomes?: boolean;
  };
  facts: string;
  context?: { pathTitle?: string; nextStep?: string };
}): { ok: true; draft: AssistDraft } | { ok: false; error: string } {
  if (input.person.ownsOutcomes) return { ok: false, error: "not_leader" };
  if (input.room === "sales" && (input.person.kind === "child" || input.person.login !== "member")) {
    return { ok: false, error: "sales_has_no_children" };
  }
  if (input.room === "household" && (input.person.kind !== "child" || input.person.login !== "none")) {
    return { ok: false, error: "child_has_no_login" };
  }
  const pathTitle = pathForOnePerson(clip(input.context?.pathTitle || ""));
  const nextStep = clip(input.context?.nextStep || "");
  const outcomes = nextStep || clip(input.person.outcomes);
  const currentProfile = input.person.profile.trim();
  if (!outcomes && !currentProfile && !pathTitle && !clip(input.facts)) return { ok: false, error: "no_context" };
  const name = clip(input.person.name) || "This person";
  const thin = !currentProfile || MECHANICAL_PROFILE.test(currentProfile);
  const step = outcomes || "the open step";
  const profile = thin
    ? clip(pathTitle ? `${name} is on ${pathTitle}. Next step is ${step}.` : `${name}. Next step is ${step}.`)
    : clip(currentProfile);
  const finalOutcomes = outcomes || "the open step";
  return {
    ok: true,
    draft: {
      profile,
      outcomes: finalOutcomes,
      changed: profile !== currentProfile || finalOutcomes !== input.person.outcomes.trim(),
    },
  };
}

export type SuggestionSource = "ai" | "fallback";

const OWNS_PATH = /owns the (path|outcomes)/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentionsSomeoneElse(text: string, selfName: string, others: string[]) {
  const self = selfName.trim().toLowerCase();
  for (const name of others) {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.toLowerCase() === self) continue;
    if (new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, "i").test(text)) return true;
  }
  return false;
}

export function suggestionPrompt(input: {
  room: Room;
  person: { name: string; profile: string; outcomes: string; confidence?: string; history?: OutcomeMark[] };
  facts: string;
  outcome?: string;
  context?: { pathTitle?: string; nextStep?: string };
}) {
  const name = clip(input.person.name) || "This person";
  const step = clip(input.context?.nextStep || input.person.outcomes);
  const path = pathForOnePerson(clip(input.context?.pathTitle || ""));
  const aim = clip(input.outcome || "");
  const confidence = clip(input.person.confidence || "");
  const history = (input.person.history ?? []).map((mark) => clip(mark?.outcomes || "")).filter(Boolean);
  const spine = lessonSpineStep(step) || [...history].reverse().map((mark) => lessonSpineStep(mark)).find(Boolean) || "";
  const spineHow = lessonSpineStep(step) ? lessonSpineConfidence(step) : "";
  const how = spineHow || confidence;
  const roomLine =
    input.room === "household"
      ? "This is a home desk. The child has no login and cannot save. The parent owns the save."
      : "This is a sales desk. There are no children. The team member may sign in. The leader owns the save.";
  const aimLine =
    input.room === "household"
      ? `What this family is aiming for: ${aim || "none"}.`
      : `What this team is aiming for: ${aim || "none"}.`;
  return [
    "Write a clearer profile and the next step for one person.",
    roomLine,
    "Do not say this person owns the path or the outcomes.",
    "Do not mention anyone else.",
    `Person: ${name}.`,
    `Current profile: ${clip(input.person.profile) || "none"}.`,
    `Current next step: ${step || "none"}.`,
    spine ? `LessonSpine progress: ${spine}.` : "",
    aimLine,
    `How they are doing: ${how || "none"}.`,
    `Recent next steps, oldest first: ${history.length ? history.join("; ") : "none"}.`,
    path ? `Path: ${path}.` : "",
    clip(input.facts) ? `Org facts, for context only: ${clip(input.facts)}.` : "",
    'Reply with JSON only: {"profile":"...","outcomes":"..."}',
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseAiSuggestion(raw: string): { profile: string; outcomes: string } | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { profile?: unknown; outcomes?: unknown };
    if (typeof parsed.profile !== "string" || typeof parsed.outcomes !== "string") return null;
    const profile = clip(parsed.profile);
    const outcomes = clip(parsed.outcomes);
    if (!profile || !outcomes) return null;
    return { profile, outcomes };
  } catch {
    return null;
  }
}

/** BYOK uses only the org key. Any other mode uses the platform key. No key means no call. */
export function pickSuggestionKey(mode: string | null, byokKey: string | null, platformKey: string | null) {
  if (mode === "byok") {
    const key = byokKey?.trim() || "";
    return key || null;
  }
  const key = platformKey?.trim() || "";
  return key || null;
}

/**
 * Ask the configured model for one person's profile and next step.
 * A missing, thrown, or unsafe reply keeps the current assist.
 */
export async function suggestForPerson(input: {
  room: Room;
  person: {
    name: string;
    kind: string;
    login: "none" | "member";
    profile: string;
    outcomes: string;
    ownsOutcomes?: boolean;
    confidence?: string;
    history?: OutcomeMark[];
  };
  others?: Array<{ name: string }>;
  facts: string;
  outcome?: string;
  context?: { pathTitle?: string; nextStep?: string };
  complete: (prompt: string) => Promise<string | null>;
}): Promise<{ ok: true; draft: AssistDraft; source: SuggestionSource } | { ok: false; error: string }> {
  const fallback = assistDraft({
    room: input.room,
    person: input.person,
    facts: input.facts,
    context: input.context,
  });
  if (!fallback.ok) return fallback;
  let raw: string | null = null;
  try {
    raw = await input.complete(
      suggestionPrompt({
        room: input.room,
        person: input.person,
        facts: input.facts,
        outcome: input.outcome,
        context: input.context,
      }),
    );
  } catch {
    raw = null;
  }
  const parsed = raw ? parseAiSuggestion(raw) : null;
  if (!parsed) return { ok: true, draft: fallback.draft, source: "fallback" };
  const text = `${parsed.profile}\n${parsed.outcomes}`;
  if (OWNS_PATH.test(text)) return { ok: true, draft: fallback.draft, source: "fallback" };
  if (mentionsSomeoneElse(text, input.person.name, (input.others ?? []).map((row) => row.name))) {
    return { ok: true, draft: fallback.draft, source: "fallback" };
  }
  return {
    ok: true,
    source: "ai",
    draft: {
      profile: parsed.profile,
      outcomes: parsed.outcomes,
      changed: parsed.profile !== input.person.profile.trim() || parsed.outcomes !== input.person.outcomes.trim(),
    },
  };
}

export function applyAssist(
  brain: LivingBrain,
  actor: BrainActor,
  membershipId: string,
  context?: { pathTitle?: string; nextStep?: string },
): { ok: true; brain: LivingBrain } | { ok: false; error: string } {
  if (actor.kind === "child") return { ok: false, error: "child_has_no_login" };
  if (!actorMayWrite(actor)) return { ok: false, error: "not_leader" };
  if (actor.org !== brain.room) return { ok: false, error: "wrong_desk" };
  const person = brain.people.find((row) => row.membershipId === membershipId);
  if (!person) return { ok: false, error: "not_on_desk" };
  if (!personAllowed(brain.room, person, actor.membershipId)) {
    return { ok: false, error: brain.room === "sales" ? "sales_has_no_children" : "child_has_no_login" };
  }
  const drafted = assistDraft({
    room: brain.room,
    person,
    facts: brain.facts,
    context: { pathTitle: context?.pathTitle || brain.facts, nextStep: context?.nextStep },
  });
  if (!drafted.ok) return drafted;
  const people = brain.people.map((row) =>
    row.membershipId === membershipId
      ? {
          ...row,
          profile: drafted.draft.profile,
          outcomes: drafted.draft.outcomes,
          ownsOutcomes: false as const,
          history: rememberOutcome(row.history, drafted.draft.outcomes),
        }
      : { ...row, ownsOutcomes: false as const },
  );
  const listed = brain.room === "sales" ? people.filter((row) => row.kind !== "child" && row.login === "member") : people;
  return {
    ok: true,
    brain: {
      ...brain,
      facts: deskFacts(brain.room, listed) || brain.facts,
      people: listed,
    },
  };
}

/** Write an already chosen profile and next step, then refresh the org line. */
export function applyPreparedAssist(
  brain: LivingBrain,
  actor: BrainActor,
  membershipId: string,
  draft: { profile: string; outcomes: string },
): { ok: true; brain: LivingBrain } | { ok: false; error: string } {
  if (actor.kind === "child") return { ok: false, error: "child_has_no_login" };
  if (!actorMayWrite(actor)) return { ok: false, error: "not_leader" };
  if (actor.org !== brain.room) return { ok: false, error: "wrong_desk" };
  const person = brain.people.find((row) => row.membershipId === membershipId);
  if (!person) return { ok: false, error: "not_on_desk" };
  if (!personAllowed(brain.room, person, actor.membershipId)) {
    return { ok: false, error: brain.room === "sales" ? "sales_has_no_children" : "child_has_no_login" };
  }
  const profile = clip(draft.profile);
  const outcomes = clip(draft.outcomes);
  if (!profile || !outcomes) return { ok: false, error: "no_context" };
  const people = brain.people.map((row) =>
    row.membershipId === membershipId
      ? { ...row, profile, outcomes, ownsOutcomes: false as const, history: rememberOutcome(row.history, outcomes) }
      : { ...row, ownsOutcomes: false as const },
  );
  const listed = brain.room === "sales" ? people.filter((row) => row.kind !== "child" && row.login === "member") : people;
  return {
    ok: true,
    brain: {
      ...brain,
      facts: deskFacts(brain.room, listed) || brain.facts,
      people: listed,
    },
  };
}

export function updateOutcome(
  brain: LivingBrain,
  actor: BrainActor,
  membershipId: string,
  outcomes: string,
): { ok: true; brain: LivingBrain } | { ok: false; error: string } {
  if (actor.kind === "child") return { ok: false, error: "child_has_no_login" };
  if (!actorMayWrite(actor)) return { ok: false, error: "not_leader" };
  if (actor.org !== brain.room) return { ok: false, error: "wrong_desk" };
  const person = brain.people.find((row) => row.membershipId === membershipId);
  if (!person) return { ok: false, error: "not_on_desk" };
  if (!personAllowed(brain.room, person, actor.membershipId)) {
    return { ok: false, error: brain.room === "sales" ? "sales_has_no_children" : "child_has_no_login" };
  }
  return {
    ok: true,
    brain: {
      ...brain,
      people: brain.people.map((row) =>
        row.membershipId === membershipId
          ? { ...row, outcomes: clip(outcomes), ownsOutcomes: false, history: rememberOutcome(row.history, outcomes) }
          : row,
      ),
    },
  };
}

/** What this family or team is aiming for. People keep their own next step. */
export function setOrgOutcome(
  brain: LivingBrain,
  actor: BrainActor,
  outcome: string,
): { ok: true; brain: LivingBrain } | { ok: false; error: string } {
  if (actor.kind === "child") return { ok: false, error: "child_has_no_login" };
  if (!actorMayWrite(actor)) return { ok: false, error: "not_leader" };
  if (actor.org !== brain.room) return { ok: false, error: "wrong_desk" };
  const people = brain.people.map((row) => ({ ...row, ownsOutcomes: false as const }));
  return {
    ok: true,
    brain: {
      ...brain,
      outcome: clip(outcome),
      people: brain.room === "sales" ? people.filter((row) => row.kind !== "child" && row.login === "member") : people,
    },
  };
}

/** How this person is doing. The learner does not own it. */
export function setConfidence(
  brain: LivingBrain,
  actor: BrainActor,
  membershipId: string,
  confidence: string,
): { ok: true; brain: LivingBrain } | { ok: false; error: string } {
  if (actor.kind === "child") return { ok: false, error: "child_has_no_login" };
  if (!actorMayWrite(actor)) return { ok: false, error: "not_leader" };
  if (actor.org !== brain.room) return { ok: false, error: "wrong_desk" };
  const person = brain.people.find((row) => row.membershipId === membershipId);
  if (!person) return { ok: false, error: "not_on_desk" };
  if (!personAllowed(brain.room, person, actor.membershipId)) {
    return { ok: false, error: brain.room === "sales" ? "sales_has_no_children" : "child_has_no_login" };
  }
  return {
    ok: true,
    brain: {
      ...brain,
      people: brain.people.map((row) =>
        row.membershipId === membershipId ? { ...row, confidence: clip(confidence), ownsOutcomes: false } : row,
      ),
    },
  };
}

export type ChosenNext = {
  membershipId: string;
  name: string;
  login: "none" | "member";
  title: string;
  from: "outcomes" | "profile" | "stored";
  ownsOutcomes: false;
};

export type UseKind = "assign" | "teach" | "learn" | "progress";

export type UseSignal = {
  kind: UseKind;
  membershipId: string;
  name: string;
  personKind: string;
  login: "none" | "member";
  step: string;
  /** The step after the one just finished. Empty keeps the finished step as next. */
  following?: string;
};

function finishing(kind: UseKind) {
  return kind === "learn" || kind === "progress";
}

/** The open unit is today's step. Finishing it names the unit after it. The last unit does not move. */
export function stepAfterFinish(input: {
  units: Array<{ id: string; title: string }>;
  currentId?: string;
}): { finished: string; next: string } | null {
  if (input.units.length === 0) return null;
  const current =
    (input.currentId ? input.units.find((unit) => unit.id === input.currentId) : undefined) || input.units[0];
  const index = input.units.findIndex((unit) => unit.id === current.id);
  if (index < 0) return null;
  const next = input.units[index + 1];
  if (!next) return null;
  const finished = current.title.trim();
  const following = next.title.trim();
  if (!finished || !following) return null;
  return { finished, next: following };
}

function useLabel(kind: UseKind) {
  if (kind === "assign") return "Assigned.";
  if (kind === "teach") return "Taught.";
  if (kind === "learn") return "Learned.";
  return "Progress saved.";
}

/**
 * Real use rewrites org facts and this person's profile and outcomes.
 * The child has no login. A sales child is refused. The learner does not own outcomes.
 */
export function refreshFromUse(
  brain: LivingBrain,
  actor: BrainActor,
  signal: UseSignal,
): { ok: true; brain: LivingBrain } | { ok: false; error: string } {
  if (actor.kind === "child") return { ok: false, error: "child_has_no_login" };
  if (actor.org !== brain.room || !brain.orgId) return { ok: false, error: "wrong_desk" };
  const step = clip(signal.step);
  if (!step) return { ok: false, error: "no_step" };
  const self = signal.membershipId === actor.membershipId;
  if (brain.room === "sales") {
    if (signal.personKind === "child" || signal.login !== "member") {
      return { ok: false, error: "sales_has_no_children" };
    }
    const leader = actorMayWrite(actor);
    if (leader && self) return { ok: false, error: "not_on_desk" };
    if (!leader && (!self || !finishing(signal.kind))) {
      return { ok: false, error: "not_leader" };
    }
  } else if (signal.personKind !== "child" || signal.login !== "none" || self) {
    return { ok: false, error: signal.personKind === "child" && signal.login === "none" ? "not_leader" : "child_has_no_login" };
  } else if (!finishing(signal.kind) && !actorMayWrite(actor)) {
    return { ok: false, error: "not_leader" };
  }
  const name = clip(signal.name) || "This person";
  const prior = brain.people.find((row) => row.membershipId === signal.membershipId);
  const following = clip(signal.following || "");
  const nextStep = following || step;
  const profile = following
    ? clip(`${useLabel(signal.kind)} Finished ${step}. Next step is ${following}.`)
    : clip(`${useLabel(signal.kind)} Next step is ${step}.`);
  const nextPerson: LivingPerson = {
    membershipId: signal.membershipId,
    name,
    kind: signal.personKind,
    login: signal.login,
    profile,
    outcomes: nextStep,
    ownsOutcomes: false,
    history: rememberOutcome(prior?.history, nextStep),
    confidence: prior?.confidence ?? "",
  };
  const merged = brain.people.some((row) => row.membershipId === signal.membershipId)
    ? brain.people.map((row) => (row.membershipId === signal.membershipId ? nextPerson : { ...row, ownsOutcomes: false as const }))
    : [...brain.people.map((row) => ({ ...row, ownsOutcomes: false as const })), nextPerson];
  const people =
    brain.room === "sales" ? merged.filter((person) => person.kind !== "child" && person.login === "member") : merged;
  return {
    ok: true,
    brain: {
      ...brain,
      facts: deskFacts(brain.room, people) || clip(`${name}: next step is ${nextStep}.`),
      people,
    },
  };
}

/** Outcomes first, then profile, then the stored unit. Sales never picks a child. */
export function chooseNextStep(input: {
  room: Room;
  brain: { room: Room; people: LivingPerson[] } | null;
  storedTitle?: string;
  membershipId?: string;
}): ChosenNext | null {
  const people = (input.brain && input.brain.room === input.room ? input.brain.people : []).filter((person) => {
    if (person.ownsOutcomes) return false;
    if (input.room === "sales") return person.kind !== "child" && person.login === "member";
    return person.kind === "child" && person.login === "none";
  });
  const named = input.membershipId ? people.find((person) => person.membershipId === input.membershipId) : undefined;
  const person = named || people.find((row) => row.outcomes.trim()) || people.find((row) => row.profile.trim()) || null;
  const outcomes = person?.outcomes.trim() || "";
  const profile = person?.profile.trim() || "";
  const stored = input.storedTitle?.trim() || "";
  const title = outcomes || profile || stored;
  if (!title) return null;
  return {
    membershipId: person?.membershipId || "",
    name: person?.name || "",
    login: person?.login || (input.room === "household" ? "none" : "member"),
    title,
    from: outcomes ? "outcomes" : profile ? "profile" : "stored",
    ownsOutcomes: false,
  };
}

export type BrainBoardPerson = {
  membershipId: string;
  name: string;
  kind: string;
  login: "none" | "member";
  profile: string;
  outcomes: string;
  ownsOutcomes: false;
  history: OutcomeMark[];
  confidence: string;
};

export type BrainBoard = {
  room: Room;
  facts: string;
  outcome: string;
  people: BrainBoardPerson[];
};

/** One readable list: org facts, then each person's profile and outcomes. Sales drops children. */
export function brainBoard(input: {
  room: Room;
  brain: { room: Room; facts: string; outcome?: string; people: LivingPerson[] } | null;
}): BrainBoard {
  const source = input.brain && input.brain.room === input.room ? input.brain : null;
  const people = (source?.people ?? [])
    .filter((person) => {
      if (person.ownsOutcomes) return false;
      if (input.room === "sales") return person.kind !== "child" && person.login === "member";
      return person.kind === "child" && person.login === "none";
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.membershipId.localeCompare(b.membershipId));
  return {
    room: input.room,
    facts: source?.facts ?? "",
    outcome: source?.outcome ?? "",
    people: people.map((person) => ({
      membershipId: person.membershipId,
      name: person.name,
      kind: person.kind,
      login: person.login,
      profile: person.profile,
      outcomes: person.outcomes,
      ownsOutcomes: false,
      history: person.history ?? [],
      confidence: person.confidence ?? "",
    })),
  };
}

/** The same recent next steps Insights lists for one person. Sales never returns a child. */
export function nextStepTrail(input: {
  room: Room;
  brain: { room: Room; people: LivingPerson[] } | null;
  membershipId?: string;
}): OutcomeMark[] {
  if (!input.membershipId || !input.brain || input.brain.room !== input.room) return [];
  const person = brainBoard({
    room: input.room,
    brain: { room: input.brain.room, facts: "", people: input.brain.people },
  }).people.find((row) => row.membershipId === input.membershipId);
  return person?.history ?? [];
}

/** Learn home: org aim, how that person is doing, and their next step. Sales never returns a child. */
export function learnHomeContext(input: {
  room: Room;
  brain: { room: Room; outcome?: string; people: LivingPerson[] } | null;
  membershipId?: string;
  storedTitle?: string;
}): {
  aim: string;
  confidence: string;
  nextStep: string;
  from: "outcomes" | "profile" | "stored" | "";
  login: "none" | "member" | "";
  membershipId: string;
} {
  const sameRoom = input.brain && input.brain.room === input.room ? input.brain : null;
  const aim = sameRoom?.outcome ?? "";
  const allowed = brainBoard({
    room: input.room,
    brain: sameRoom ? { room: sameRoom.room, facts: "", outcome: aim, people: sameRoom.people } : null,
  }).people;
  if (input.membershipId && !allowed.some((person) => person.membershipId === input.membershipId)) {
    return { aim, confidence: "", nextStep: "", from: "", login: "", membershipId: "" };
  }
  const chosen = chooseNextStep({
    room: input.room,
    brain: sameRoom,
    membershipId: input.membershipId,
    storedTitle: input.storedTitle,
  });
  const membershipId = input.membershipId || chosen?.membershipId || "";
  return {
    aim,
    confidence: personConfidence({ room: input.room, brain: sameRoom, membershipId }),
    nextStep: chosen?.title || "",
    from: chosen?.from || "",
    login: chosen?.login || "",
    membershipId,
  };
}

/** People desk: how each person is doing, and their next step. Sales never returns a child. */
export function peopleContext(input: {
  room: Room;
  brain: { room: Room; outcome?: string; people: LivingPerson[] } | null;
}): { membershipId: string; confidence: string; nextStep: string; login: "none" | "member" }[] {
  if (!input.brain || input.brain.room !== input.room) return [];
  return brainBoard({
    room: input.room,
    brain: {
      room: input.brain.room,
      facts: "",
      outcome: input.brain.outcome ?? "",
      people: input.brain.people,
    },
  }).people.map((person) => {
    const card = learnHomeContext({
      room: input.room,
      brain: input.brain,
      membershipId: person.membershipId,
    });
    return {
      membershipId: person.membershipId,
      confidence: card.confidence,
      nextStep: card.nextStep,
      login: person.login,
    };
  });
}

/** The same plain confidence Insights lists for one person. Sales never returns a child. */
export function personConfidence(input: {
  room: Room;
  brain: { room: Room; people: LivingPerson[] } | null;
  membershipId?: string;
}): string {
  if (!input.membershipId || !input.brain || input.brain.room !== input.room) return "";
  const person = brainBoard({
    room: input.room,
    brain: { room: input.brain.room, facts: "", people: input.brain.people },
  }).people.find((row) => row.membershipId === input.membershipId);
  return person?.confidence ?? "";
}

/** Tools read one org. A sales brain never includes a child. */
export function readForTool(brain: LivingBrain, activeOrgId: string) {
  if (brain.orgId !== activeOrgId) return null;
  const people = brain.people.filter((person) => (brain.room === "sales" ? person.kind !== "child" && person.login === "member" : person.login === "none"));
  return {
    orgId: brain.orgId,
    room: brain.room,
    facts: brain.facts,
    outcome: brain.outcome ?? "",
    people: people.map((person) => ({
      membershipId: person.membershipId,
      name: person.name,
      kind: person.kind,
      login: person.login,
      profile: person.profile,
      outcomes: person.outcomes,
      ownsOutcomes: false as const,
      history: person.history ?? [],
      confidence: person.confidence ?? "",
    })),
  };
}
