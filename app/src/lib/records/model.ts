import { ADULT_GATES, type AdultGateId, type GateMarks } from "../profile/model.ts";

export const COLLECTIONS = [
  { slug: "families", label: "Families", owner: "wards + memberships (household)" },
  { slug: "student-profiles", label: "Student Profiles", owner: "user_profiles + kid_profiles" },
  { slug: "milestones", label: "Milestones", owner: "derived from user_profiles, tool_results, kid_profiles, progress_ledger_units" },
  { slug: "media", label: "Media", owner: "composer sources" },
] as const;
export type CollectionSlug = (typeof COLLECTIONS)[number]["slug"];

/** A login learner is the signed-in User; a tracked child has no login. The two never share a variant. */
export type PersonRef =
  | { as: "self"; memberId: string }
  | { as: "tracked-child"; membershipId: string };

export type StudentProfile =
  | { collection: "student-profiles"; person: Extract<PersonRef, { as: "self" }>; displayName: string; login: "account" }
  | { collection: "student-profiles"; person: Extract<PersonRef, { as: "tracked-child" }>; displayName: string; login: "none" };
export type TrackedChildProfile = Extract<StudentProfile, { login: "none" }>;

export type Family = {
  collection: "families";
  orgId: string;
  guardianMembershipId: string;
  children: readonly TrackedChildProfile[];
};

export type MediaDoc = {
  collection: "media";
  id: string;
  lessonId: string;
  title: string;
  kind: "file" | "link" | "text";
  mime: string | null;
  url: string | null;
};

export type MilestoneSource =
  | { table: "user_profiles.gates"; memberId: string; gate: AdultGateId }
  | { table: "user_profiles.completed_at"; memberId: string }
  | { table: "tool_results"; attemptId: string }
  | { table: "kid_profiles.intake_done_at"; childMembershipId: string }
  | { table: "progress_ledger_units"; rowId: string };

type MilestoneBase = { collection: "milestones"; id: string; title: string; at: string; source: MilestoneSource };
export type Milestone =
  | (MilestoneBase & { kind: "profile-gate" | "profile-complete" | "tool-result"; subject: Extract<PersonRef, { as: "self" }> })
  | (MilestoneBase & { kind: "kid-intake" | "unit-complete"; subject: Extract<PersonRef, { as: "tracked-child" }> });

export type MilestoneRows = {
  self: {
    memberId: string;
    gates: GateMarks;
    completedAt: string | null;
    tools: readonly { attemptId: string; toolSlug: string; summary: string; completedAt: string }[];
  } | null;
  kids: readonly { membershipId: string; intakeDoneAt: string | null }[];
  ledgerUnits: readonly {
    id: string;
    childMembershipId: string;
    title: string;
    status: string;
    completedAt: string | null;
  }[];
};

const TOOL_TITLE: Record<string, string> = { skill: "Skill assessment", intelligence: "Intelligence assessment" };

/** Pure. Self milestones come only from `self`; child milestones only from kids and ledger units. Newest first. */
export function deriveMilestones(rows: MilestoneRows): Milestone[] {
  const out: Milestone[] = [];
  const self = rows.self;
  if (self) {
    const subject = { as: "self" as const, memberId: self.memberId };
    for (const gate of ADULT_GATES) {
      const mark = self.gates[gate.id];
      if (!mark) continue;
      out.push({
        collection: "milestones",
        kind: "profile-gate",
        id: `ms:gate:${self.memberId}:${gate.id}`,
        title: gate.label,
        at: mark.firstAt,
        subject,
        source: { table: "user_profiles.gates", memberId: self.memberId, gate: gate.id },
      });
    }
    if (self.completedAt) {
      out.push({
        collection: "milestones",
        kind: "profile-complete",
        id: `ms:profile:${self.memberId}`,
        title: "Profile set up",
        at: self.completedAt,
        subject,
        source: { table: "user_profiles.completed_at", memberId: self.memberId },
      });
    }
    for (const tool of self.tools) {
      out.push({
        collection: "milestones",
        kind: "tool-result",
        id: `ms:tool:${tool.attemptId}`,
        title: `${TOOL_TITLE[tool.toolSlug] ?? tool.toolSlug}: ${tool.summary}`,
        at: tool.completedAt,
        subject,
        source: { table: "tool_results", attemptId: tool.attemptId },
      });
    }
  }
  for (const kid of rows.kids) {
    if (!kid.intakeDoneAt) continue;
    out.push({
      collection: "milestones",
      kind: "kid-intake",
      id: `ms:intake:${kid.membershipId}`,
      title: "Intake done",
      at: kid.intakeDoneAt,
      subject: { as: "tracked-child", membershipId: kid.membershipId },
      source: { table: "kid_profiles.intake_done_at", childMembershipId: kid.membershipId },
    });
  }
  for (const unit of rows.ledgerUnits) {
    if (unit.status !== "completed" || !unit.completedAt) continue;
    out.push({
      collection: "milestones",
      kind: "unit-complete",
      id: `ms:unit:${unit.id}`,
      title: `Finished ${unit.title}`,
      at: unit.completedAt,
      subject: { as: "tracked-child", membershipId: unit.childMembershipId },
      source: { table: "progress_ledger_units", rowId: unit.id },
    });
  }
  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
