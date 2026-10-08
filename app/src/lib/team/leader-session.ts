import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Sales org from app/db/0004_tenants.sql. Trainer leads. Learner is the teammate. */
export const TEAM_ORG = "sales";
export const AUTH_URL = "https://portal.fieldschool.ai";
export const LESSON_SPINE_SHA =
  "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
export const LESSON_SPINE_PLAY = "/play/lesson-spine";

export type TeamActor = {
  membershipId: string;
  memberId: string;
  email: string;
  name: string;
  kind: string;
  orgId: string;
  orgSlug: string;
  stance: string;
};

export type TeamStation = {
  sortOrder: number;
  title: string;
  subject: string;
  play: string;
  sha256: string;
};

export type TeamRecord = {
  room: "team";
  authUrl: typeof AUTH_URL;
  orgSlug: typeof TEAM_ORG;
  orgId: string;
  hired: true;
  leaderMembershipId: string;
  teammateMembershipId: string;
  teammateMaySignIn: true;
  teammateBuys: false;
  teammateOwnsPath: false;
  work: {
    play: string;
    spine: "LessonSpine";
    sha256: string;
    completed: true;
  };
  intent: {
    owner: "leader";
    ownerMembershipId: string;
    teammateMembershipId: string;
    goals: string[];
    subjects: string[];
    timeHorizon: string;
  };
  path: {
    owner: "leader";
    ownerMembershipId: string;
    teammateMembershipId: string;
    stations: TeamStation[];
  };
  portion: {
    shown: true;
    status: "locked" | "overridden";
    title: string;
    play: string;
    sha256: string;
    availableWithoutConversation: true;
    leaderMembershipId: string;
    teammateMembershipId: string;
  };
};

type TeamFile = {
  room: "team";
  records: TeamRecord[];
};

export type TeamOk = {
  ok: true;
  record: TeamRecord;
  events: ReturnType<typeof teamSixEvents>;
};

export type TeamFail = { ok: false; error: string };

export type PortionChoice = "lock" | "override";

export type FireInput = {
  goals?: string[];
  portion?: PortionChoice;
  overrideTitle?: string;
};

function storePath(explicit?: string) {
  const picked = explicit?.trim() || process.env.TEAM_LEADER_SESSION_PATH?.trim() || "";
  if (!picked) {
    if (process.env.NODE_ENV === "production") return "/app/data/team-leader-session.json";
    return join(process.cwd(), "data", "team-leader-session.json");
  }
  return picked;
}

function assertStore(path: string): TeamFail | null {
  const base = path.split("/").pop() || "";
  if (/^supervised-.*\.json$/.test(base)) return { ok: false, error: "hire_path_store" };
  if (base === "learning_intents" || base === "curriculum_paths") {
    return { ok: false, error: "wrong_lane" };
  }
  return null;
}

function emptyFile(): TeamFile {
  return { room: "team", records: [] };
}

function readFile(path: string): TeamFile {
  if (!existsSync(path)) return emptyFile();
  const parsed = JSON.parse(readFileSync(path, "utf8")) as TeamFile;
  if (!parsed || parsed.room !== "team" || !Array.isArray(parsed.records)) return emptyFile();
  return parsed;
}

function writeFile(path: string, file: TeamFile) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(file, null, 2)}\n`);
}

function upsert(path: string, record: TeamRecord) {
  const file = readFile(path);
  const next = file.records.filter(
    (row) => row.teammateMembershipId !== record.teammateMembershipId,
  );
  next.push(record);
  writeFile(path, { room: "team", records: next });
}

export function teamSixEvents(record: TeamRecord) {
  return [
    {
      n: 1,
      event: "signed_in",
      authUrl: record.authUrl,
      leaderMembershipId: record.leaderMembershipId,
      hired: record.hired,
    },
    {
      n: 2,
      event: "teammate_selected",
      teammateMembershipId: record.teammateMembershipId,
      buyer: false,
    },
    {
      n: 3,
      event: "work",
      play: record.work.play,
      spine: record.work.spine,
      sha256: record.work.sha256,
      completed: record.work.completed,
    },
    {
      n: 4,
      event: "intent",
      owner: record.intent.owner,
      ownerMembershipId: record.intent.ownerMembershipId,
    },
    {
      n: 5,
      event: "path",
      owner: record.path.owner,
      teammateMembershipId: record.path.teammateMembershipId,
      stations: record.path.stations.length,
    },
    {
      n: 6,
      event: "portion",
      shown: record.portion.shown,
      status: record.portion.status,
      availableWithoutConversation: record.portion.availableWithoutConversation,
    },
  ];
}

function leaderError(actor: TeamActor): string | null {
  if (actor.kind === "child") return "child_not_in_team_room";
  if (actor.orgSlug !== TEAM_ORG) return "wrong_org";
  if (actor.stance !== "trainer") return "leader_required";
  if (!actor.membershipId || !actor.memberId || !actor.orgId) return "membership_required";
  return null;
}

function teammateError(leader: TeamActor, actor: TeamActor): string | null {
  if (actor.kind === "child") return "child_not_in_team_room";
  if (actor.orgSlug !== TEAM_ORG || actor.orgId !== leader.orgId) return "wrong_org";
  if (actor.stance === "trainer") return "teammate_is_buyer";
  if (actor.stance !== "learner") return "teammate_required";
  if (!actor.membershipId || !actor.memberId) return "membership_required";
  if (actor.membershipId === leader.membershipId) return "same_membership";
  if (actor.memberId === leader.memberId) return "same_member";
  return null;
}

function stationsFor(goals: string[]): TeamStation[] {
  const rows: TeamStation[] = [
    {
      sortOrder: 1,
      title: "LessonSpine Ready / HLS",
      subject: "LessonSpine",
      play: LESSON_SPINE_PLAY,
      sha256: LESSON_SPINE_SHA,
    },
  ];
  for (const goal of goals) {
    const title = goal.trim();
    if (!title) continue;
    if (rows.some((row) => row.title === title)) continue;
    rows.push({
      sortOrder: rows.length + 1,
      title,
      subject: "LessonSpine",
      play: LESSON_SPINE_PLAY,
      sha256: LESSON_SPINE_SHA,
    });
  }
  return rows;
}

export function fireLeaderSession(
  leader: TeamActor,
  teammate: TeamActor,
  input: FireInput = {},
  store?: string,
): TeamOk | TeamFail {
  const path = storePath(store);
  const blocked = assertStore(path);
  if (blocked) return blocked;
  const leaderGap = leaderError(leader);
  if (leaderGap) return { ok: false, error: leaderGap };
  const teammateGap = teammateError(leader, teammate);
  if (teammateGap) return { ok: false, error: teammateGap };
  const choice: PortionChoice = input.portion === "override" ? "override" : "lock";
  const goals = (input.goals?.length ? input.goals : ["Keep moving on LessonSpine when the leader is out"])
    .map((goal) => goal.trim())
    .filter(Boolean);
  const built = stationsFor(goals);
  const heldTitle =
    choice === "override"
      ? input.overrideTitle?.trim() || "Leader override on LessonSpine"
      : built[0].title;
  const record: TeamRecord = {
    room: "team",
    authUrl: AUTH_URL,
    orgSlug: TEAM_ORG,
    orgId: leader.orgId,
    hired: true,
    leaderMembershipId: leader.membershipId,
    teammateMembershipId: teammate.membershipId,
    teammateMaySignIn: true,
    teammateBuys: false,
    teammateOwnsPath: false,
    work: {
      play: LESSON_SPINE_PLAY,
      spine: "LessonSpine",
      sha256: LESSON_SPINE_SHA,
      completed: true,
    },
    intent: {
      owner: "leader",
      ownerMembershipId: leader.membershipId,
      teammateMembershipId: teammate.membershipId,
      goals,
      subjects: ["LessonSpine"],
      timeHorizon: "while the leader is out",
    },
    path: {
      owner: "leader",
      ownerMembershipId: leader.membershipId,
      teammateMembershipId: teammate.membershipId,
      stations: built,
    },
    portion: {
      shown: true,
      status: choice === "override" ? "overridden" : "locked",
      title: heldTitle,
      play: LESSON_SPINE_PLAY,
      sha256: LESSON_SPINE_SHA,
      availableWithoutConversation: true,
      leaderMembershipId: leader.membershipId,
      teammateMembershipId: teammate.membershipId,
    },
  };
  upsert(path, record);
  return { ok: true, record, events: teamSixEvents(record) };
}

export function readTeamPortion(
  teammateMembershipId: string,
  store?: string,
): TeamOk | TeamFail {
  const path = storePath(store);
  const blocked = assertStore(path);
  if (blocked) return blocked;
  const id = teammateMembershipId.trim();
  if (!id) return { ok: false, error: "teammate_required" };
  const record = readFile(path).records.find((row) => row.teammateMembershipId === id);
  if (!record) return { ok: false, error: "portion_missing" };
  if (!record.portion.availableWithoutConversation) {
    return { ok: false, error: "portion_not_held" };
  }
  return { ok: true, record, events: teamSixEvents(record) };
}

export function teammateWork(
  actor: TeamActor,
  action: "work" | "buy" | "own" = "work",
  store?: string,
): TeamOk | TeamFail {
  if (action === "buy") return { ok: false, error: "teammate_does_not_buy" };
  if (action === "own") return { ok: false, error: "teammate_does_not_own_path" };
  if (actor.kind === "child") return { ok: false, error: "child_not_in_team_room" };
  if (actor.orgSlug !== TEAM_ORG) return { ok: false, error: "wrong_org" };
  if (actor.stance !== "learner") return { ok: false, error: "teammate_required" };
  return readTeamPortion(actor.membershipId, store);
}
