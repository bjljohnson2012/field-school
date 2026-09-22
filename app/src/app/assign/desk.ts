import { parseLessonSpec, type LessonSpec } from "./lesson-spec";

export const JOB_SENTENCE =
  "When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.";

export type DeskRoom = "household" | "sales";

export type DeskActor = {
  membershipId: string;
  kind: string;
  stance: string;
  org: string;
};

export type DeskPerson = {
  membershipId: string;
  name: string;
  kind: string;
  stance: string;
  org: string;
  login: "none" | "member";
};

export type OpenAssignment = {
  id: string;
  membershipId: string;
  name: string;
  title: string;
  outcome: string;
  nextUnit: string;
  nextUnitId?: string;
  sourceUnitId?: string;
  lessonId?: string;
  units?: { id: string; title: string; source_unit_id: string }[];
  login: "none" | "member";
  buyer: boolean;
  ownsPath: boolean;
  room: DeskRoom;
};

export type AssignmentDraft = {
  orgId: string;
  membershipId: string;
  actorMembershipId: string;
  objectType: "lesson_spec";
  objectId: string;
  status: "open";
  raw: {
    lessonSpec: LessonSpec;
    pathOwnerMembershipId: string;
    buyer: false;
    ownsPath: false;
    login: "none" | "member";
    room: DeskRoom;
    nextUnitId: string;
    source_unit_id: string;
  };
};

export const DESK_COPY: Record<
  DeskRoom,
  { eyebrow: string; law: string; empty: string; person: string; loginLine: string }
> = {
  sales: {
    eyebrow: "Sales desk",
    law: "Login salespeople only. A teammate may sign in to work. The teammate does not buy and does not own the path.",
    empty: "No login salesperson on this desk yet.",
    person: "Login salesperson",
    loginLine: "Login: member. Does not buy. Does not own the path.",
  },
  household: {
    eyebrow: "Household desk",
    law: "Tracked children only. A child has no login. You own the path. The child does not buy.",
    empty: "No tracked child on this desk yet.",
    person: "Tracked child",
    loginLine: "Login: none. Tracked child. No login.",
  },
};

export const GUEST_COPY =
  "Sign in as the leader to assign a path. A guest stays a guest. A child has no login.";

export const PICK_COPY =
  "Pick one desk. The sales list and the household list never share this page.";

export const CHILD_COPY =
  "A child has no login. This desk is for the leader who owns the path.";

export const LEARNER_COPY =
  "A leader assigns this path. You do not buy and you do not own it.";

export const ERROR_COPY: Record<string, string> = {
  sign_in_required: GUEST_COPY,
  child_has_no_login: CHILD_COPY,
  not_leader: LEARNER_COPY,
  wrong_desk: "That person is not on this desk.",
  not_your_child: "That tracked child is not on your household desk.",
  spec_invalid: "The lesson needs a title, an outcome, and a unit with a source unit id.",
  spec_mode: "This desk only assigns. Mode stays assign.",
  spec_org: "The lesson belongs to the open desk.",
  database_unavailable: "People for this desk are not available yet.",
  not_on_desk: "That person is not on this desk.",
  invalid_json: "The assign request was not readable.",
};

export function roomForOrg(org: string): DeskRoom | null {
  if (org === "household" || org === "sales") return org;
  return null;
}

export function leaderCanAssign(actor: DeskActor): boolean {
  if (actor.kind === "child") return false;
  const room = roomForOrg(actor.org);
  if (!room) return false;
  if (room === "household") return actor.stance === "guardian" || actor.stance === "admin";
  return actor.stance === "trainer" || actor.stance === "admin";
}

export function peopleOnDesk(room: DeskRoom, people: DeskPerson[], leaderMembershipId: string) {
  return people.filter((person) => assigneeAllowed(room, person, leaderMembershipId));
}

export function assigneeAllowed(room: DeskRoom, person: DeskPerson, leaderMembershipId: string) {
  if (!person.membershipId || person.membershipId === leaderMembershipId) return false;
  if (person.org !== room) return false;
  if (room === "household") return person.kind === "child" && person.login === "none";
  return person.kind !== "child" && person.login === "member" && person.stance === "learner";
}

export function visibleAssignments(
  room: DeskRoom,
  rows: OpenAssignment[],
  actorMembershipId: string,
  leader: boolean,
) {
  return rows.filter((row) => {
    if (row.room !== room) return false;
    if (row.buyer !== false || row.ownsPath !== false) return false;
    if (room === "household" && row.login !== "none") return false;
    if (room === "sales" && row.login !== "member") return false;
    if (!leader && row.membershipId !== actorMembershipId) return false;
    return true;
  });
}

export function assignedLine(name: string, nextUnit: string) {
  return `Assigned to ${name}. When you leave the room, the next step is still ${nextUnit}.`;
}

export function draftAssignment(input: {
  room: DeskRoom;
  actor: DeskActor;
  person: DeskPerson;
  spec: unknown;
  orgId: string;
}): { ok: true; draft: AssignmentDraft } | { ok: false; error: string } {
  if (input.actor.kind === "child") return { ok: false, error: "child_has_no_login" };
  if (!leaderCanAssign(input.actor)) return { ok: false, error: "not_leader" };
  if (input.actor.org !== input.room) return { ok: false, error: "wrong_desk" };
  const spec = parseLessonSpec(input.spec);
  if (!spec) return { ok: false, error: "spec_invalid" };
  if (spec.mode !== "assign") return { ok: false, error: "spec_mode" };
  if (spec.org !== input.room) return { ok: false, error: "spec_org" };
  if (!assigneeAllowed(input.room, input.person, input.actor.membershipId)) {
    return { ok: false, error: "wrong_desk" };
  }
  const orgId = input.orgId.trim();
  if (!orgId) return { ok: false, error: "wrong_desk" };
  return {
    ok: true,
    draft: {
      orgId,
      membershipId: input.person.membershipId,
      actorMembershipId: input.actor.membershipId,
      objectType: "lesson_spec",
      objectId: spec.id,
      status: "open",
      raw: {
        lessonSpec: spec,
        pathOwnerMembershipId: input.actor.membershipId,
        buyer: false,
        ownsPath: false,
        login: input.person.login,
        room: input.room,
        nextUnitId: spec.units[0].id,
        source_unit_id: spec.units[0].source_unit_id,
      },
    },
  };
}
