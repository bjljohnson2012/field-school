import { getSql } from "@/lib/db/client";
import type { EvidenceKind } from "./score.ts";

export type PoolItem = {
  id: string;
  table: string;
  label: string;
  text: string;
  kind: EvidenceKind;
  ageDays: number;
  materialOnHand: boolean;
  provesUse: boolean;
  sourceId: string;
  requirementId: string | null;
};

type Scope = {
  ownerKind: "person" | "child";
  orgId: string;
  growthUnitId: string;
  memberId: string;
  childMembershipId: string | null;
};

function ageDays(value: unknown) {
  const time = value instanceof Date ? value.getTime() : typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

function textOf(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join(" ");
  return "";
}

function clip(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
}

function item(row: Omit<PoolItem, "sourceId">): PoolItem {
  return { ...row, sourceId: row.id, text: clip(row.text), label: clip(row.label) || "Evidence" };
}

async function safe<T>(query: Promise<T[]>): Promise<T[]> {
  try {
    return await query;
  } catch {
    return [];
  }
}

export async function loadEvidence(scope: Scope): Promise<PoolItem[]> {
  const sql = getSql();
  const found: PoolItem[] = [];
  if (scope.ownerKind === "child" && scope.childMembershipId) {
    const childId = scope.childMembershipId;
    const sources = await safe(sql<{ id: string; title: string; body: string; created_at: string }[]>`
      SELECT s.id, s.title, s.body, s.created_at
      FROM brain_sources s
      JOIN growth_units g ON g.id = s.growth_unit_id
      WHERE s.org_id = ${scope.orgId} AND g.org_id = ${scope.orgId}
        AND g.kind = 'child' AND g.child_membership_id = ${childId}
    `);
    const notes = await safe(sql<{ id: string; title: string; body: string; created_at: string }[]>`
      SELECT n.id, n.title, n.body, n.created_at
      FROM brain_notes n
      JOIN growth_units g ON g.id = n.growth_unit_id
      WHERE n.org_id = ${scope.orgId} AND g.org_id = ${scope.orgId}
        AND g.kind = 'child' AND g.child_membership_id = ${childId}
    `);
    const artifacts = await safe(sql<{ id: string; title: string; body: string; created_at: string }[]>`
      SELECT a.id, a.title, a.body, a.created_at
      FROM brain_artifacts a
      JOIN growth_units g ON g.id = a.growth_unit_id
      WHERE a.org_id = ${scope.orgId} AND g.org_id = ${scope.orgId}
        AND g.kind = 'child' AND g.child_membership_id = ${childId}
    `);
    for (const row of sources) {
      found.push(item({
        id: row.id,
        table: "brain_sources",
        label: row.title,
        text: `${row.title} ${row.body}`,
        kind: "brain_source",
        ageDays: ageDays(row.created_at),
        materialOnHand: true,
        provesUse: false,
        requirementId: null,
      }));
    }
    for (const row of notes) {
      found.push(item({
        id: row.id,
        table: "brain_notes",
        label: row.title,
        text: `${row.title} ${row.body}`,
        kind: "brain_source",
        ageDays: ageDays(row.created_at),
        materialOnHand: true,
        provesUse: false,
        requirementId: null,
      }));
    }
    for (const row of artifacts) {
      found.push(item({
        id: row.id,
        table: "brain_artifacts",
        label: row.title,
        text: `${row.title} ${row.body}`,
        kind: "artifact",
        ageDays: ageDays(row.created_at),
        materialOnHand: true,
        provesUse: clip(row.body).length >= 12,
        requirementId: null,
      }));
    }
    const units = await safe(sql<{ id: string; title: string; subject: string; confidence: string; completed_at: string | null; created_at: string; composer_unit_id: string | null }[]>`
      SELECT id, title, subject, confidence, completed_at, created_at, composer_unit_id
      FROM progress_ledger_units
      WHERE org_id = ${scope.orgId} AND child_membership_id = ${childId}
    `);
    for (const row of units) {
      const rating = row.confidence === "ready" ? "parent_ready" : row.confidence === "getting_there" ? "parent_getting_there" : row.confidence === "not_yet" ? "parent_not_yet" : "";
      const quiz = !rating && row.completed_at && row.composer_unit_id;
      if (!rating && !quiz) continue;
      found.push(item({
        id: row.id,
        table: "progress_ledger_units",
        label: row.title,
        text: `${row.title} ${row.subject}`,
        kind: quiz ? "quiz_pass" : (rating as EvidenceKind),
        ageDays: ageDays(row.completed_at || row.created_at),
        materialOnHand: true,
        provesUse: rating === "parent_ready" || rating === "parent_getting_there" || Boolean(quiz),
        requirementId: null,
      }));
    }
    const intents = await safe(sql<{ id: string; goals: unknown; subjects: unknown; themes: unknown; created_at: string }[]>`
      SELECT id, goals, subjects, themes, created_at
      FROM learning_intents
      WHERE org_id = ${scope.orgId} AND child_membership_id = ${childId}
      ORDER BY version DESC
      LIMIT 1
    `);
    for (const row of intents) {
      const text = `${textOf(row.goals)} ${textOf(row.subjects)} ${textOf(row.themes)}`;
      if (!clip(text)) continue;
      found.push(item({
        id: row.id,
        table: "learning_intents",
        label: "Saved intent",
        text,
        kind: "brain_source",
        ageDays: ageDays(row.created_at),
        materialOnHand: true,
        provesUse: false,
        requirementId: null,
      }));
    }
    const intake = await safe(sql<{ id: string; intake_done_at: string | null }[]>`
      SELECT id, intake_done_at
      FROM kid_profiles
      WHERE org_id = ${scope.orgId} AND child_membership_id = ${childId} AND intake_done_at IS NOT NULL
    `);
    for (const row of intake) {
      found.push(item({
        id: row.id,
        table: "kid_profiles",
        label: "Intake on file",
        text: "Intake is complete",
        kind: "upload",
        ageDays: ageDays(row.intake_done_at),
        materialOnHand: true,
        provesUse: false,
        requirementId: null,
      }));
    }
  }
  if (scope.ownerKind === "person") {
    const profiles = await safe(sql<{ current_projects: unknown; skills_adapted: unknown; updated_at: string }[]>`
      SELECT current_projects, skills_adapted, updated_at FROM user_profiles WHERE member_id = ${scope.memberId}
    `);
    for (const row of profiles) {
      const skills = textOf(row.skills_adapted);
      const projects = textOf(row.current_projects);
      if (clip(skills)) {
        found.push(item({
          id: `${scope.memberId}:skills`,
          table: "user_profiles",
          label: "Skills",
          text: skills,
          kind: "profile_skill",
          ageDays: ageDays(row.updated_at),
          materialOnHand: true,
          provesUse: false,
          requirementId: null,
        }));
      }
      if (clip(projects)) {
        found.push(item({
          id: `${scope.memberId}:projects`,
          table: "user_profiles",
          label: "Projects",
          text: projects,
          kind: "upload",
          ageDays: ageDays(row.updated_at),
          materialOnHand: true,
          provesUse: false,
          requirementId: null,
        }));
      }
    }
    const skills = await safe(sql<{ id: string; name: string; notes: string; created_at: string }[]>`
      SELECT l.id, s.name, l.notes, l.created_at
      FROM profile_skill_links l
      JOIN profile_skills s ON s.id = l.skill_id
      WHERE l.member_id = ${scope.memberId}
    `);
    for (const row of skills) {
      found.push(item({
        id: row.id,
        table: "profile_skill_links",
        label: row.name,
        text: `${row.name} ${row.notes}`,
        kind: "profile_skill",
        ageDays: ageDays(row.created_at),
        materialOnHand: true,
        provesUse: false,
        requirementId: null,
      }));
    }
    const projects = await safe(sql<{ id: string; name: string; description: string; created_at: string }[]>`
      SELECT l.id, p.name, p.description, l.created_at
      FROM profile_project_links l
      JOIN profile_projects p ON p.id = l.project_id
      WHERE l.member_id = ${scope.memberId}
    `);
    for (const row of projects) {
      found.push(item({
        id: row.id,
        table: "profile_project_links",
        label: row.name,
        text: `${row.name} ${row.description}`,
        kind: "upload",
        ageDays: ageDays(row.created_at),
        materialOnHand: true,
        provesUse: false,
        requirementId: null,
      }));
    }
    const entries = await safe(sql<{ id: string; title: string; organization: string; kind: string; created_at: string }[]>`
      SELECT id, title, organization, kind, created_at FROM profile_entries WHERE member_id = ${scope.memberId}
    `);
    for (const row of entries) {
      found.push(item({
        id: row.id,
        table: "profile_entries",
        label: row.title,
        text: `${row.kind} ${row.title} ${row.organization}`,
        kind: "upload",
        ageDays: ageDays(row.created_at),
        materialOnHand: true,
        provesUse: false,
        requirementId: null,
      }));
    }
    const tools = await safe(sql<{ id: string; summary: string; tool_slug: string; completed_at: string }[]>`
      SELECT id, summary, tool_slug, completed_at FROM tool_results WHERE member_id = ${scope.memberId}
    `);
    for (const row of tools) {
      found.push(item({
        id: row.id,
        table: "tool_results",
        label: row.tool_slug,
        text: row.summary,
        kind: "assessment_band",
        ageDays: ageDays(row.completed_at),
        materialOnHand: true,
        provesUse: false,
        requirementId: null,
      }));
    }
    const placements = await safe(sql<{ id: string; category: string; track: string; confidence_pct: string; updated_at: string }[]>`
      SELECT id, category, track, confidence_pct::text, updated_at
      FROM assessment_placements
      WHERE member_id = ${scope.memberId}
    `);
    for (const row of placements) {
      found.push(item({
        id: row.id,
        table: "assessment_placements",
        label: row.category,
        text: `${row.track} ${row.category}`,
        kind: "assessment_band",
        ageDays: ageDays(row.updated_at),
        materialOnHand: true,
        provesUse: false,
        requirementId: null,
      }));
    }
  }
  const nodes = await safe(sql<{ id: string; label: string; body: string; ref_table: string | null; requirement_id: string | null; created_at: string }[]>`
    SELECT id, label, body, ref_table, requirement_id, created_at
    FROM knowledge_nodes
    WHERE org_id = ${scope.orgId} AND growth_unit_id = ${scope.growthUnitId}
      AND kind = 'evidence' AND status = 'active'
  `);
  const kinds = new Set(["parent_ready", "parent_getting_there", "parent_not_yet", "quiz_pass", "artifact", "upload", "brain_source", "profile_skill", "assessment_band"]);
  for (const row of nodes) {
    const kind = (row.ref_table && kinds.has(row.ref_table) ? row.ref_table : "upload") as EvidenceKind;
    const proves = kind === "parent_ready" || kind === "parent_getting_there" || kind === "quiz_pass" || kind === "artifact";
    found.push(item({
      id: row.id,
      table: "knowledge_nodes",
      label: row.label,
      text: `${row.label} ${row.body}`,
      kind,
      ageDays: ageDays(row.created_at),
      materialOnHand: true,
      provesUse: proves,
      requirementId: row.requirement_id,
    }));
  }
  return found;
}

export async function lessonPaths(orgId: string, growthUnitId: string) {
  const sql = getSql();
  const rows = await safe(sql<{ uri: string }[]>`
    SELECT uri FROM brain_sources
    WHERE org_id = ${orgId} AND growth_unit_id = ${growthUnitId} AND uri LIKE '/c/%/s/%'
    LIMIT 8
  `);
  const links: { href: string; label: string }[] = [];
  for (const row of rows) {
    const match = row.uri.match(/^\/c\/([^/]+)\/s\/([^/?#]+)/);
    if (!match) continue;
    links.push({ href: `/c/${match[1]}/s/${match[2]}`, label: "Open the lesson" });
    break;
  }
  return links;
}
