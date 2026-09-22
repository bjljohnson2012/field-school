export type Room = "household" | "sales";

export type LivingPerson = {
  membershipId: string;
  name: string;
  kind: string;
  login: "none" | "member";
  profile: string;
  outcomes: string;
  ownsOutcomes: false;
};

export type LivingBrain = {
  orgId: string;
  room: Room;
  facts: string;
  people: LivingPerson[];
};

export type BrainActor = {
  kind: string;
  stance: string;
  org: Room;
  membershipId: string;
};

const MAX = 2000;

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
  actorId: string;
  people: Array<{
    membershipId: string;
    name: string;
    kind: string;
    login: "none" | "member";
    profile: string;
    outcomes: string;
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
    });
  }
  return {
    ok: true,
    brain: {
      orgId: input.orgId,
      room: input.room,
      facts: clip(input.facts),
      people,
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
        row.membershipId === membershipId ? { ...row, outcomes: clip(outcomes), ownsOutcomes: false } : row,
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
};

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
    if (!leader && (!self || (signal.kind !== "learn" && signal.kind !== "progress"))) {
      return { ok: false, error: "not_leader" };
    }
  } else if (signal.personKind !== "child" || signal.login !== "none" || !actorMayWrite(actor) || self) {
    return { ok: false, error: signal.personKind === "child" && signal.login === "none" ? "not_leader" : "child_has_no_login" };
  }
  const name = clip(signal.name) || "This person";
  const nextPerson: LivingPerson = {
    membershipId: signal.membershipId,
    name,
    kind: signal.personKind,
    login: signal.login,
    profile: clip(`${useLabel(signal.kind)} Next step is ${step}.`),
    outcomes: step,
    ownsOutcomes: false,
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
      facts: clip(`${name}: next step is ${step}.`),
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

/** Tools read one org. A sales brain never includes a child. */
export function readForTool(brain: LivingBrain, activeOrgId: string) {
  if (brain.orgId !== activeOrgId) return null;
  const people = brain.people.filter((person) => (brain.room === "sales" ? person.kind !== "child" && person.login === "member" : person.login === "none"));
  return {
    orgId: brain.orgId,
    room: brain.room,
    facts: brain.facts,
    people: people.map((person) => ({
      membershipId: person.membershipId,
      name: person.name,
      kind: person.kind,
      login: person.login,
      profile: person.profile,
      outcomes: person.outcomes,
      ownsOutcomes: false as const,
    })),
  };
}
