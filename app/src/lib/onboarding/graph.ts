/**
 * M12 onboarding graph. CDM sealed the step list on 2026-10-14, delegated by Ben.
 * Postgres is the resume store. This module is the pure transition table.
 */

import { PROFILE_COPY } from "../profile/model.ts";

export const STEP_IDS = [
  "brain-name",
  "room",
  "org-name",
  "homeschool-mode",
  "people",
  "adult-gates",
  "kid-intake",
  "first-goal",
  "home-lesson",
] as const;

export type StepId = (typeof STEP_IDS)[number];
export type RoomChoice = "family" | "team";
export type Entry = "signup" | "invite";

/** Public default. The Individual branch stays off. */
export const INDIVIDUAL_PLAN_ENABLED = false;

/** Learn stays open between campus_ready and profile_done. */
export const LEARN_HARD_GATED = false;

export const CAMPUS_READY_STEP: StepId = "home-lesson";

export const KID_INTAKE = {
  gateId: "G-intake",
  name: "Kid profile",
  href: "/onboarding/kid-profile",
} as const;

export const STARTER_LESSON = {
  courseSlug: "grok-bot",
  href: "/c/grok-bot",
  label: "Start the first lesson",
} as const;

export const ONBOARDING_EVENT = {
  kind: "onboarding_step",
  objectType: "onboarding_flow",
  destination: "learning_events",
} as const;

export const ADULT_GATE_IDS = ["G-personality", "G-skills", "G-other"] as const;
export type AdultGateId = (typeof ADULT_GATE_IDS)[number];
export type AdultGateMap = Record<AdultGateId, boolean>;

export const SIGNUP_LESSON_BUDGET_MS = 10 * 60 * 1000;
export const FIXTURE_WIDTH_PX = 390;

export const ONBOARDING_COPY = {
  brainTitle: "Name this knowledge brain",
  brainBody: "This name shows in the switcher.",
  roomTitle: "Who is this brain for?",
  family: "Family",
  team: "Team",
  orgTitle: "Display name",
  orgBody: "This is the name people see for the family or the team.",
  homeschoolTitle: "Homeschool mode",
  homeschoolBody: "Turn homeschool mode on when learning happens at home.",
  peopleFamily: "Add a person in development",
  peopleTeam: "Add a team member",
  peopleBody: "A person in development has no login and no photo.",
  gatesTitle: "Adult profile gates",
  gatesBody: "Open each assessment, then mark it done. An adult photo can wait.",
  kidTitle: "Kid profile",
  kidBody: "Parent edit only. No photo and no public link.",
  goalTitle: "First goal",
  goalBody: "What should the next stretch of learning accomplish?",
  homeTitle: "Home is ready",
  homeBody: "The starter lesson is the free course.",
  continue: "Continue",
  skip: "Skip for now",
  progress: "Step",
} as const;

export type PersonDraft = {
  name: string;
  role: "child" | "member";
  login: "none" | "member";
};

export type OnboardingEvent = {
  kind: typeof ONBOARDING_EVENT.kind;
  objectType: typeof ONBOARDING_EVENT.objectType;
  objectId: string;
  destination: typeof ONBOARDING_EVENT.destination;
  at: string;
};

export type FlowSnapshot = {
  accountId: string;
  orgId: string | null;
  invitingOrgId: string | null;
  membershipId: string | null;
  entry: Entry;
  stepId: StepId;
  brainNamed: boolean;
  brainName: string;
  room: RoomChoice | null;
  orgName: string;
  homeschoolMode: boolean | null;
  people: PersonDraft[];
  adultGates: AdultGateMap;
  kidIntakeDone: boolean;
  aim: string;
  outcomeId: string | null;
  campusReady: boolean;
  profileDone: boolean;
  createdOrgIds: string[];
  events: OnboardingEvent[];
};

export type BranchContext = {
  entry: Entry;
  room: RoomChoice | null;
  childAdded: boolean;
  brainNamed: boolean;
};

export type FlowAction =
  | { type: "brain-name"; brainName: string }
  | { type: "room"; room: RoomChoice | "individual" }
  | { type: "org-name"; orgName: string }
  | { type: "homeschool-mode"; homeschoolMode: boolean }
  | { type: "people"; people?: PersonDraft[]; skip?: boolean; photoUrl?: string }
  | { type: "adult-gates"; gates: Partial<AdultGateMap> }
  | { type: "kid-intake"; displayName: string; photoUrl?: string; publicUrl?: string }
  | { type: "first-goal"; aim: string }
  | { type: "home-lesson" };

export type FlowResult = { ok: true; flow: FlowSnapshot } | { ok: false; error: string };

const AIM_MIN = 3;

function blankGates(): AdultGateMap {
  return { "G-personality": false, "G-skills": false, "G-other": false };
}

function blankFlow(accountId: string, entry: Entry): FlowSnapshot {
  return {
    accountId,
    orgId: null,
    invitingOrgId: null,
    membershipId: null,
    entry,
    stepId: "brain-name",
    brainNamed: false,
    brainName: "",
    room: null,
    orgName: "",
    homeschoolMode: null,
    people: [],
    adultGates: blankGates(),
    kidIntakeDone: false,
    aim: "",
    outcomeId: null,
    campusReady: false,
    profileDone: false,
    createdOrgIds: [],
    events: [],
  };
}

export function openSignup(accountId: string): FlowSnapshot {
  return blankFlow(accountId, "signup");
}

export function openInvite(input: { accountId: string; invitingOrgId: string; brainNamed: boolean }): FlowSnapshot {
  const flow = blankFlow(input.accountId, "invite");
  flow.orgId = input.invitingOrgId;
  flow.invitingOrgId = input.invitingOrgId;
  flow.brainNamed = input.brainNamed;
  flow.stepId = inviteEntryStep(input.brainNamed);
  return flow;
}

/** Invitees enter at brain-name or people, never room. */
export function inviteEntryStep(brainNamed: boolean): "brain-name" | "people" {
  return brainNamed ? "people" : "brain-name";
}

export function signupLanding(next: string) {
  return next === "/dashboard" ? "/onboarding" : next;
}

export function inviteLanding() {
  return "/onboarding?entry=invite";
}

export function individualBranch(enabled: boolean = INDIVIDUAL_PLAN_ENABLED): readonly ("family" | "team" | "individual")[] {
  return enabled ? ["family", "team", "individual"] : ["family", "team"];
}

export function learnBlocked() {
  return LEARN_HARD_GATED;
}

export function brainSlug(memberId: string) {
  const tail = memberId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  return `brain-${tail || "org"}`;
}

/** A homeschool kind stays homeschool. Room choice does not retire it. */
export function nextOrgKind(currentKind: string, room: RoomChoice) {
  if (currentKind.trim().toLowerCase() === "homeschool") return currentKind;
  return room;
}

export function branchOf(flow: FlowSnapshot): BranchContext {
  return {
    entry: flow.entry,
    room: flow.room,
    childAdded: flow.people.some((person) => person.role === "child"),
    brainNamed: flow.brainNamed,
  };
}

export function stepApplies(id: StepId, ctx: BranchContext) {
  if (ctx.entry === "invite" && (id === "room" || id === "org-name" || id === "homeschool-mode" || id === "kid-intake")) {
    return false;
  }
  if (ctx.entry === "invite" && id === "brain-name" && ctx.brainNamed) return false;
  if (id === "homeschool-mode") return ctx.room === "family";
  if (id === "kid-intake") return ctx.room === "family" && ctx.childAdded;
  return true;
}

export function visibleStepIds(flow: FlowSnapshot): StepId[] {
  return STEP_IDS.filter((id) => stepApplies(id, branchOf(flow)));
}

export function nextStepId(id: StepId, ctx: BranchContext): StepId | null {
  const start = STEP_IDS.indexOf(id);
  for (let i = start + 1; i < STEP_IDS.length; i += 1) {
    if (stepApplies(STEP_IDS[i], ctx)) return STEP_IDS[i];
  }
  return null;
}

export function switcherLabel(flow: FlowSnapshot) {
  return flow.orgName.trim() || flow.brainName.trim() || "This brain";
}

export function learnPath(pathname: string) {
  return pathname === "/learn" || pathname.startsWith("/learn/") || pathname === "/c" || pathname.startsWith("/c/");
}

export function shouldResume(pathname: string, flow: FlowSnapshot | null) {
  if (!flow || flow.campusReady || learnBlocked()) return false;
  if (learnPath(pathname)) return false;
  if (pathname.startsWith("/onboarding")) return false;
  if (pathname.startsWith("/pattern") || pathname.startsWith("/tools") || pathname.startsWith("/profile")) return false;
  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/api")) return false;
  return true;
}

export function profileNudge(flow: FlowSnapshot | null): { label: string; href: string } | null {
  if (!flow || !flow.campusReady || flow.profileDone) return null;
  return { label: PROFILE_COPY.incomplete, href: "/onboarding?step=adult-gates" };
}

export function homeLanding(flow: FlowSnapshot) {
  if (!flow.campusReady) return null;
  return `/dashboard?starter=${STARTER_LESSON.courseSlug}`;
}

export function progressOf(flow: FlowSnapshot) {
  const steps = visibleStepIds(flow);
  const index = Math.max(1, steps.indexOf(flow.stepId) + 1);
  const total = Math.max(steps.length, 1);
  return { index, total, percent: Math.round((index / total) * 100) };
}

function fail(error: string): FlowResult {
  return { ok: false, error };
}

function withEvent(flow: FlowSnapshot, stepId: string, at: string): FlowSnapshot {
  return {
    ...flow,
    events: [
      ...flow.events,
      {
        kind: ONBOARDING_EVENT.kind,
        objectType: ONBOARDING_EVENT.objectType,
        objectId: stepId,
        destination: ONBOARDING_EVENT.destination,
        at,
      },
    ],
  };
}

function gatesDone(gates: AdultGateMap) {
  return ADULT_GATE_IDS.every((id) => gates[id]);
}

function recomputeProfile(flow: FlowSnapshot): FlowSnapshot {
  const childAdded = flow.people.some((person) => person.role === "child");
  const profileDone = gatesDone(flow.adultGates) && (!childAdded || flow.kidIntakeDone);
  return { ...flow, profileDone };
}

function move(flow: FlowSnapshot, at: string): FlowSnapshot {
  const recorded = withEvent(flow, flow.stepId, at);
  const next = nextStepId(recorded.stepId, branchOf(recorded));
  if (!next) return recorded;
  return { ...recorded, stepId: next };
}

function cleanName(value: string, max = 80) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function advance(flow: FlowSnapshot, action: FlowAction, at = new Date().toISOString()): FlowResult {
  if (flow.campusReady && action.type === "home-lesson") return { ok: true, flow };
  if (flow.entry === "invite" && action.type === "room") return fail("invite_skips_room");
  if (flow.entry === "invite" && action.type === "org-name") return fail("invite_skips_org");
  if (flow.entry === "invite" && action.type === "homeschool-mode") return fail("invite_skips_homeschool");
  if (action.type !== flow.stepId) return fail("wrong_step");

  if (action.type === "brain-name") {
    const brainName = cleanName(action.brainName);
    if (!brainName) return fail("brain_name_required");
    return { ok: true, flow: move({ ...flow, brainName, brainNamed: true }, at) };
  }

  if (action.type === "room") {
    if (flow.entry === "invite") return fail("invite_skips_room");
    if (action.room === "individual" || !INDIVIDUAL_PLAN_ENABLED && action.room !== "family" && action.room !== "team") {
      return fail("individual_off");
    }
    if (action.room !== "family" && action.room !== "team") return fail("individual_off");
    return { ok: true, flow: move({ ...flow, room: action.room }, at) };
  }

  if (action.type === "org-name") {
    if (flow.entry === "invite") return fail("invite_skips_org");
    const orgName = cleanName(action.orgName);
    if (!orgName) return fail("org_name_required");
    return { ok: true, flow: move({ ...flow, orgName }, at) };
  }

  if (action.type === "homeschool-mode") {
    if (flow.entry === "invite") return fail("invite_skips_homeschool");
    if (flow.room !== "family") return fail("not_family");
    return { ok: true, flow: move({ ...flow, homeschoolMode: action.homeschoolMode === true }, at) };
  }

  if (action.type === "people") {
    if (action.photoUrl) return fail("kid_no_photo");
    if (action.skip) {
      if (flow.entry !== "invite") return fail("people_required");
      return { ok: true, flow: move(flow, at) };
    }
    const room = flow.room ?? (flow.entry === "invite" ? "team" : null);
    if (!room) return fail("room_required");
    const people = action.people ?? [];
    if (!people.length) return fail("people_required");
    const cleaned: PersonDraft[] = [];
    for (const person of people) {
      if ("photoUrl" in person || "publicUrl" in person) return fail("kid_no_photo");
      const name = cleanName(person.name);
      if (!name) return fail("name_required");
      if (room === "family") {
        if (person.role !== "child" || person.login !== "none") return fail("child_login_none");
        cleaned.push({ name, role: "child", login: "none" });
      } else {
        if (person.role === "child") return fail("team_has_no_child");
        cleaned.push({ name, role: "member", login: "member" });
      }
    }
    return { ok: true, flow: move({ ...flow, people: cleaned }, at) };
  }

  if (action.type === "adult-gates") {
    const adultGates = { ...flow.adultGates };
    for (const id of ADULT_GATE_IDS) {
      if (action.gates[id]) adultGates[id] = true;
    }
    if (!gatesDone(adultGates)) return fail("gates_required");
    const next = recomputeProfile({ ...flow, adultGates });
    return { ok: true, flow: move(next, at) };
  }

  if (action.type === "kid-intake") {
    if (action.photoUrl) return fail("kid_no_photo");
    if (action.publicUrl) return fail("kid_no_public_url");
    const displayName = cleanName(action.displayName);
    if (!displayName) return fail("name_required");
    const people = flow.people.map((person, index) =>
      index === 0 && person.role === "child" ? { ...person, name: displayName } : person,
    );
    const next = recomputeProfile({ ...flow, people, kidIntakeDone: true });
    return { ok: true, flow: move(next, at) };
  }

  if (action.type === "first-goal") {
    const aim = cleanName(action.aim, 280);
    if (aim.length < AIM_MIN) return fail("aim_required");
    return { ok: true, flow: move({ ...flow, aim }, at) };
  }

  const done = { ...flow, campusReady: true };
  return { ok: true, flow: withEvent(done, CAMPUS_READY_STEP, at) };
}

export function attachOrg(flow: FlowSnapshot, orgId: string): FlowResult {
  if (flow.entry === "invite") {
    if (orgId !== flow.orgId) return fail("invite_second_org");
    return { ok: true, flow };
  }
  if (flow.createdOrgIds.length && !flow.createdOrgIds.includes(orgId)) return fail("second_org");
  const createdOrgIds = flow.createdOrgIds.includes(orgId) ? flow.createdOrgIds : [...flow.createdOrgIds, orgId];
  return { ok: true, flow: { ...flow, orgId, createdOrgIds } };
}

export function withMembership(flow: FlowSnapshot, membershipId: string): FlowSnapshot {
  return { ...flow, membershipId };
}

export function withOutcome(flow: FlowSnapshot, outcomeId: string): FlowSnapshot {
  return { ...flow, outcomeId };
}

export function reloadFlow(raw: string): FlowSnapshot {
  const parsed = JSON.parse(raw) as FlowSnapshot;
  if (!STEP_IDS.includes(parsed.stepId)) throw new Error("bad_step");
  return parsed;
}

/** Account-scoped resume. Sign-out drops the session pointer and keeps the row. */
export class AccountFlowStore {
  private rows = new Map<string, string>();
  private session: string | null = null;

  save(flow: FlowSnapshot) {
    this.rows.set(flow.accountId, JSON.stringify(flow));
    this.session = flow.accountId;
  }

  signOut() {
    this.session = null;
  }

  signIn(accountId: string) {
    this.session = accountId;
    const raw = this.rows.get(accountId);
    return raw ? reloadFlow(raw) : null;
  }

  current() {
    return this.session;
  }
}

/**
 * Scripted 390px walk from signup to the starter lesson.
 * Each step is 15s of fixture time. The budget is 10 minutes, which is the CI slack.
 */
export function scriptedSignupToLesson(start = 0) {
  let t = start;
  const tick = () => {
    t += 15_000;
  };
  let flow = openSignup("fixture-learner");
  const run = (action: FlowAction) => {
    tick();
    const result = advance(flow, action, new Date(t).toISOString());
    if (!result.ok) throw new Error(result.error);
    flow = result.flow;
  };
  run({ type: "brain-name", brainName: "Fixture brain" });
  const org = attachOrg(flow, "org-fixture");
  if (!org.ok) throw new Error(org.error);
  flow = org.flow;
  run({ type: "room", room: "family" });
  run({ type: "org-name", orgName: "Fixture family" });
  run({ type: "homeschool-mode", homeschoolMode: true });
  run({ type: "people", people: [{ name: "Ada", role: "child", login: "none" }] });
  run({ type: "adult-gates", gates: { "G-personality": true, "G-skills": true, "G-other": true } });
  run({ type: "kid-intake", displayName: "Ada" });
  run({ type: "first-goal", aim: "Read a page and tell it back" });
  run({ type: "home-lesson" });
  return {
    elapsedMs: t - start,
    widthPx: FIXTURE_WIDTH_PX,
    budgetMs: SIGNUP_LESSON_BUDGET_MS,
    flow,
  };
}
