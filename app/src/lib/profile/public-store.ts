import { randomBytes } from "node:crypto";
import { getSql, DatabaseUnavailableError } from "@/lib/db/client";
import { ensureCitedNode, ensureEdge } from "@/lib/gap-loop/store";
import { applyM11SqlIfConfigured } from "@/lib/brains/sql";
import { isTrackId, trackDef } from "@/lib/assessments/tracks";
import { mediaPath } from "@/lib/enrichment/model";
import {
  chosenProjects,
  chosenSkills,
  PERSON_IN_DEVELOPMENT,
  peoplePanel,
  serializePublicProfile,
  type PrivateBundle,
  type PublicProfile,
  type PublicProject,
} from "./public.ts";
import { applyPm3Sql } from "./pm3-sql.ts";
import {
  commitFinish,
  emptyBrain,
  homeCourseCta,
  visibleBrainEdge,
  type FinishPlacement,
  type HomeCourse,
} from "./outcomes.ts";
import { isShareSlug, mintShareSlug, nextShareState, type ShareAction, type ShareState } from "./share.ts";

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function strings(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

function projectsOf(raw: unknown): PublicProject[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicProject[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const name = item.trim();
      if (name) out.push({ name, link: "" });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const link = typeof record.link === "string" ? record.link.trim() : "";
    if (name) out.push({ name, link });
  }
  return out;
}

async function owned(memberId: string) {
  const sql = getSql();
  const [profile] = (await sql`
    SELECT display_name, photo_media_id, headline, bio, linkedin_url,
           skills_adapted, current_projects, public_skills, public_projects,
           share_enabled, share_slug
    FROM user_profiles WHERE member_id = ${memberId} LIMIT 1
  `) as Row[];
  const skillRows = (await sql`
    SELECT s.name FROM profile_skill_links l
    JOIN profile_skills s ON s.id = l.skill_id
    WHERE l.member_id = ${memberId}
  `) as Row[];
  const projectRows = (await sql`
    SELECT p.name, p.link FROM profile_project_links l
    JOIN profile_projects p ON p.id = l.project_id
    WHERE l.member_id = ${memberId}
  `) as Row[];
  const skills = [...strings(profile?.skills_adapted), ...skillRows.map((row) => text(row, "name"))];
  const projects = [
    ...projectsOf(profile?.current_projects),
    ...projectRows.map((row) => ({ name: text(row, "name"), link: text(row, "link") })),
  ];
  return { profile: profile ?? null, skills, projects };
}

function bundleFrom(row: Row, skills: string[], projects: PublicProject[]): PrivateBundle {
  const mediaId = text(row, "photo_media_id");
  return {
    displayName: text(row, "display_name"),
    photoSrc: mediaId ? mediaPath(mediaId) : "",
    headline: text(row, "headline"),
    bio: text(row, "bio"),
    linkedinUrl: text(row, "linkedin_url"),
    ownedSkills: skills,
    publicSkills: strings(row.public_skills),
    ownedProjects: projects,
    publicProjects: projectsOf(row.public_projects),
  };
}

export async function loadEditorFields(memberId: string) {
  await applyPm3Sql();
  const { profile, skills, projects } = await owned(memberId);
  if (!profile) return null;
  const view = serializePublicProfile(bundleFrom(profile, skills, projects));
  const slug = text(profile, "share_slug");
  const enabled = profile.share_enabled === true && isShareSlug(slug);
  return {
    headline: text(profile, "headline"),
    bio: text(profile, "bio"),
    linkedinUrl: text(profile, "linkedin_url"),
    skills: chosenSkills(skills, skills).map((name) => ({
      name,
      public: view.skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase()),
    })),
    projects: chosenProjects(projects, projects).map((project) => ({
      ...project,
      public: view.projects.some((item) => item.name.toLowerCase() === project.name.toLowerCase()),
    })),
    sharing: { enabled, path: enabled ? `/share/${slug}` : null },
  };
}

export async function saveEditorFields(
  memberId: string,
  patch: { headline: string; bio: string; linkedinUrl: string; publicSkills: string[]; publicProjects: PublicProject[] },
) {
  await applyPm3Sql();
  const sql = getSql();
  await sql`
    UPDATE user_profiles SET
      headline = ${patch.headline},
      bio = ${patch.bio},
      linkedin_url = ${patch.linkedinUrl},
      public_skills = ${sql.json(patch.publicSkills)},
      public_projects = ${sql.json(patch.publicProjects)},
      updated_at = now()
    WHERE member_id = ${memberId}
  `;
  return loadEditorFields(memberId);
}

export async function loadShare(memberId: string): Promise<ShareState> {
  await applyPm3Sql();
  const sql = getSql();
  const [row] = (await sql`
    SELECT share_enabled, share_slug FROM user_profiles WHERE member_id = ${memberId} LIMIT 1
  `) as Row[];
  const slug = text(row ?? {}, "share_slug");
  return { enabled: row?.share_enabled === true && isShareSlug(slug), slug: isShareSlug(slug) ? slug : null };
}

export async function setShare(memberId: string, action: ShareAction, blocked: readonly string[]) {
  await applyPm3Sql();
  const sql = getSql();
  const membershipRows = (await sql`SELECT id FROM memberships WHERE member_id = ${memberId}`) as Row[];
  const blockedIds = [memberId, ...membershipRows.map((row) => text(row, "id")), ...blocked];
  const current = await loadShare(memberId);
  const next = nextShareState(
    current,
    action,
    () => mintShareSlug(new Uint8Array(randomBytes(16)), blockedIds),
    blockedIds,
  );
  await sql`
    UPDATE user_profiles SET
      share_enabled = ${next.enabled},
      share_slug = ${next.slug},
      updated_at = now()
    WHERE member_id = ${memberId}
  `;
  return { enabled: next.enabled, path: next.slug ? `/share/${next.slug}` : null };
}

export async function loadPublicBySlug(slug: string): Promise<PublicProfile | null> {
  if (!isShareSlug(slug)) return null;
  await applyPm3Sql();
  const sql = getSql();
  const [row] = (await sql`
    SELECT p.member_id, p.display_name, p.photo_media_id, p.headline, p.bio, p.linkedin_url,
           p.skills_adapted, p.current_projects, p.public_skills, p.public_projects, mem.kind
    FROM user_profiles p
    JOIN members mem ON mem.id = p.member_id
    WHERE p.share_enabled = true AND p.share_slug = ${slug}
    LIMIT 1
  `) as Row[];
  if (!row || text(row, "kind") === "child") return null;
  const memberId = text(row, "member_id");
  const { skills, projects } = await owned(memberId);
  return serializePublicProfile(bundleFrom(row, skills, projects));
}

async function membershipFor(memberId: string, orgSlug: string) {
  if (!orgSlug) return null;
  const sql = getSql();
  const [row] = (await sql`
    SELECT m.id AS membership_id, m.org_id
    FROM memberships m
    JOIN organizations o ON o.id = m.org_id
    JOIN members mem ON mem.id = m.member_id
    WHERE mem.id = ${memberId} AND mem.kind <> 'child' AND o.slug = ${orgSlug}
    LIMIT 1
  `) as Row[];
  if (!row) return null;
  return { membershipId: text(row, "membership_id"), orgId: text(row, "org_id") };
}

async function ensurePersonUnit(orgId: string, membershipId: string) {
  const sql = getSql();
  const [existing] = (await sql`
    SELECT id FROM growth_units
    WHERE org_id = ${orgId} AND kind = 'person'
      AND parent_membership_id = ${membershipId} AND child_membership_id IS NULL
    LIMIT 1
  `) as Row[];
  if (existing) return text(existing, "id");
  const [created] = (await sql`
    INSERT INTO growth_units (org_id, parent_membership_id, child_membership_id, kind, title, status)
    SELECT ${orgId}, ${membershipId}, NULL, 'person', 'Self', 'current'
    WHERE NOT EXISTS (
      SELECT 1 FROM growth_units
      WHERE org_id = ${orgId} AND kind = 'person'
        AND parent_membership_id = ${membershipId} AND child_membership_id IS NULL
    )
    RETURNING id
  `) as Row[];
  if (created) return text(created, "id");
  const [again] = (await sql`
    SELECT id FROM growth_units
    WHERE org_id = ${orgId} AND kind = 'person'
      AND parent_membership_id = ${membershipId} AND child_membership_id IS NULL
    LIMIT 1
  `) as Row[];
  return text(again ?? {}, "id");
}

function placementLabel(track: string, taxonomy: string, category: string) {
  if (!isTrackId(track)) return category || taxonomy;
  const def = trackDef(track);
  const tax = def.taxonomies.find((item) => item.id === taxonomy);
  const cat = tax?.categories.find((item) => item.id === category);
  return cat?.label || tax?.label || category || taxonomy;
}

/** Writes suggested goal nodes and evidence nodes. A failure here does not undo the wizard. */
export async function recordWizardBrain(input: { memberId: string; orgSlug: string; runId: string }) {
  try {
    if (!input.orgSlug) return;
    const ready = await applyM11SqlIfConfigured();
    if (!ready) return;
    const scopeRow = await membershipFor(input.memberId, input.orgSlug);
    if (!scopeRow?.membershipId || !scopeRow.orgId) return;
    const sql = getSql();
    const rows = (await sql`
      SELECT id, run_id, track, taxonomy, category, locked, unsettled
      FROM assessment_placements WHERE run_id = ${input.runId}
    `) as Row[];
    const placements: FinishPlacement[] = rows.map((row) => ({
      id: text(row, "id"),
      runId: text(row, "run_id"),
      track: text(row, "track"),
      label: placementLabel(text(row, "track"), text(row, "taxonomy"), text(row, "category")),
      locked: row.locked === true,
      unsettled: row.unsettled === true,
    }));
    const writes = commitFinish(emptyBrain(), placements);
    if (!writes.outcomes.length && !writes.evidence.length) return;
    const growthUnitId = await ensurePersonUnit(scopeRow.orgId, scopeRow.membershipId);
    if (!growthUnitId) return;
    const scope = {
      orgId: scopeRow.orgId,
      growthUnitId,
      ownerKind: "person" as const,
      ownerMembershipId: scopeRow.membershipId,
      childMembershipId: null,
    };
    const goalIds: string[] = [];
    for (const outcome of writes.outcomes) {
      const id = await ensureCitedNode({
        scope,
        requirementId: null,
        kind: "goal",
        label: outcome.title,
        body: outcome.title,
        sha256: null,
        filename: outcome.catalogSlug,
        refTable: outcome.refTable,
        refId: outcome.refId,
        evidence: [{ table: outcome.refTable, id: outcome.refId, label: outcome.title }],
      });
      if (id) goalIds.push(id);
    }
    for (const item of writes.evidence) {
      const id = await ensureCitedNode({
        scope,
        requirementId: null,
        kind: "evidence",
        label: item.label,
        body: item.label,
        sha256: null,
        filename: null,
        refTable: item.refTable,
        refId: item.refId,
        evidence: [{ table: item.refTable, id: item.refId, label: item.label }],
      });
      const goalId = goalIds[0];
      if (id && goalId) {
        await ensureEdge({
          scope,
          from: id,
          to: goalId,
          rel: "supports",
          because: "Assessment evidence for a suggested outcome",
          evidence: [{ table: item.refTable, id: item.refId, label: item.label }],
          origin: "derived",
        });
      }
    }
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return;
  }
}

export async function loadHomeCourse(memberId: string, orgSlug: string): Promise<HomeCourse | null> {
  try {
    const ready = await applyM11SqlIfConfigured();
    if (!ready) return null;
    const scopeRow = await membershipFor(memberId, orgSlug);
    if (!scopeRow) return null;
    const sql = getSql();
    const goals = (await sql`
      SELECT label, filename FROM knowledge_nodes
      WHERE org_id = ${scopeRow.orgId}
        AND owner_membership_id = ${scopeRow.membershipId}
        AND kind = 'goal'
        AND ref_table = 'assessment_placements'
        AND status = 'active'
      ORDER BY created_at ASC
      LIMIT 5
    `) as Row[];
    const [enrollment] = (await sql`
      SELECT course_slug FROM enrollments
      WHERE org_id = ${scopeRow.orgId}
        AND membership_id = ${scopeRow.membershipId}
        AND status <> 'completed'
      ORDER BY created_at ASC
      LIMIT 1
    `) as Row[];
    return homeCourseCta({
      outcomes: goals.map((row) => ({ title: text(row, "label"), catalogSlug: text(row, "filename") })),
      enrollmentSlug: text(enrollment ?? {}, "course_slug") || null,
    });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return null;
    return null;
  }
}

export type PeopleStrip = {
  kind: "development" | "adult";
  label: string;
  displayName: string;
  photo: string;
  skills: string[];
  projects: PublicProject[];
  headline: string;
  bio: string;
  shareHref: string | null;
  brain: { kind: string; label: string }[];
};

export async function loadPeopleStrip(input: {
  kind: string;
  displayName: string;
  memberId: string;
  membershipId: string;
  orgId: string;
}): Promise<PeopleStrip> {
  const blank = {
    displayName: input.displayName,
    photo: "",
    skills: [] as string[],
    projects: [] as PublicProject[],
    headline: "",
    bio: "",
    shareHref: null as string | null,
    brain: [] as { kind: string; label: string }[],
  };
  if (input.kind === "child") {
    return {
      ...blank,
      kind: "development",
      label: PERSON_IN_DEVELOPMENT,
      displayName: input.displayName,
      photo: "",
      shareHref: null,
      skills: [],
      projects: [],
    };
  }
  try {
    await applyPm3Sql();
    const { profile, skills, projects } = await owned(input.memberId);
    const view = profile ? serializePublicProfile(bundleFrom(profile, skills, projects)) : null;
    let brain: { label: string; kind: string }[] = [];
    try {
      const ready = await applyM11SqlIfConfigured();
      if (ready) {
        const sql = getSql();
        const nodes = (await sql`
          SELECT kind, label FROM knowledge_nodes
          WHERE org_id = ${input.orgId} AND owner_membership_id = ${input.membershipId} AND status = 'active'
          ORDER BY created_at ASC LIMIT 40
        `) as Row[];
        const edges = (await sql`
          SELECT status, because FROM knowledge_edges
          WHERE org_id = ${input.orgId} AND owner_membership_id = ${input.membershipId}
          LIMIT 40
        `) as Row[];
        brain = [
          ...nodes.map((row) => ({ kind: text(row, "kind"), label: text(row, "label") })),
          ...edges
            .filter((row) => visibleBrainEdge({ status: text(row, "status") }))
            .map((row) => ({ kind: "edge", label: text(row, "because") }))
            .filter((row) => row.label),
        ];
      }
    } catch {
      brain = [];
    }
    const slug = profile ? text(profile, "share_slug") : "";
    const panel = peoplePanel({
      kind: "adult",
      displayName: view?.displayName || input.displayName,
      photoSrc: profile ? (text(profile, "photo_media_id") ? mediaPath(text(profile, "photo_media_id")) : "") : "",
      skills,
      projects,
      headline: profile ? text(profile, "headline") : "",
      bio: profile ? text(profile, "bio") : "",
      shareEnabled: profile?.share_enabled === true,
      slug,
      membershipId: input.membershipId,
    });
    if (panel.kind !== "adult") return { ...blank, kind: "adult", label: "" };
    return {
      kind: "adult",
      label: "",
      displayName: panel.displayName,
      photo: panel.photo,
      skills: panel.skills,
      projects: panel.projects,
      headline: panel.headline,
      bio: panel.bio,
      shareHref: panel.shareHref,
      brain,
    };
  } catch {
    return { ...blank, kind: "adult", label: "" };
  }
}
