import { createHash } from "node:crypto";
import { and, asc, eq, ne } from "drizzle-orm";
import { applyProfileM2Sql } from "@/lib/assessments/sql";
import { getDb } from "@/lib/db/client";
import { userProfiles } from "@/lib/db/schema";
import {
  media,
  profileEntries,
  profileProjectLinks,
  profileProjects,
  profileSkillLinks,
  profileSkills,
} from "@/lib/db/schema-profile-m2";
import { candidatesFromText, type ImportCandidate } from "./linkedin";
import { readPhoto, type PhotoRefusal } from "./media";
import { listOfAliases, mediaPath, type ProjectInput, type SkillInput } from "./model";
import { findExact, matchKey, suggest, type Known } from "./names";
import { fetchPhoto, type FetchRefusal } from "./photo-fetch";

export type Owner = { memberId: string; name: string };

async function ready(owner: Owner) {
  await applyProfileM2Sql();
  await getDb()
    .insert(userProfiles)
    .values({ memberId: owner.memberId, displayName: owner.name })
    .onConflictDoNothing();
}

export type PhotoSource = { kind: "upload"; bytes: Uint8Array } | { kind: "url"; url: string };

/**
 * Stores the image on campus and points the profile at it. A pasted link is fetched once
 * and kept only as where the image came from; the page never loads it.
 */
export async function setPhoto(
  owner: Owner,
  source: PhotoSource,
): Promise<{ ok: true; photoSrc: string } | { ok: false; error: PhotoRefusal | FetchRefusal }> {
  await ready(owner);
  let bytes = source.kind === "upload" ? source.bytes : null;
  if (source.kind === "url") {
    const fetched = await fetchPhoto(source.url);
    if (!fetched.ok) return fetched;
    bytes = fetched.bytes;
  }
  if (!bytes) return { ok: false, error: "photo_unreadable" };
  const read = readPhoto(bytes);
  if (!read.ok) return read;
  const { photo } = read;
  const sourceUrl = source.kind === "url" ? source.url.trim() : null;
  const id = await getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(media)
      .values({
        ownerMemberId: owner.memberId,
        purpose: "profile_photo",
        mimeType: photo.mime,
        byteSize: photo.bytes.length,
        width: photo.width,
        height: photo.height,
        sha256: createHash("sha256").update(photo.bytes).digest("hex"),
        bytes: Buffer.from(photo.bytes),
        sourceKind: source.kind,
        sourceUrl,
      })
      .returning({ id: media.id });
    await tx
      .update(userProfiles)
      .set({ photoMediaId: row.id, photoUrl: sourceUrl ?? "", updatedAt: new Date() })
      .where(eq(userProfiles.memberId, owner.memberId));
    await tx
      .delete(media)
      .where(and(eq(media.ownerMemberId, owner.memberId), eq(media.purpose, "profile_photo"), ne(media.id, row.id)));
    return row.id;
  });
  return { ok: true, photoSrc: mediaPath(id) };
}

export async function removePhoto(owner: Owner) {
  await ready(owner);
  await getDb().transaction(async (tx) => {
    await tx
      .update(userProfiles)
      .set({ photoMediaId: null, photoUrl: "", updatedAt: new Date() })
      .where(eq(userProfiles.memberId, owner.memberId));
    await tx.delete(media).where(and(eq(media.ownerMemberId, owner.memberId), eq(media.purpose, "profile_photo")));
  });
}

/** Only the owner can read their stored image. */
export async function readMedia(owner: Owner, id: string) {
  await applyProfileM2Sql();
  const [row] = await getDb()
    .select({ mimeType: media.mimeType, bytes: media.bytes, sha256: media.sha256 })
    .from(media)
    .where(and(eq(media.id, id), eq(media.ownerMemberId, owner.memberId)))
    .limit(1);
  return row ?? null;
}

async function skillCatalog(): Promise<Known[]> {
  const rows = await getDb().select().from(profileSkills).orderBy(asc(profileSkills.name));
  return rows.map((row) => ({ id: row.id, name: row.name, matchKey: row.matchKey, aliases: listOfAliases(row.aliases) }));
}

/** A User only ever matches projects already on their own profile, so nobody else's work is disclosed. */
async function ownProjects(memberId: string): Promise<Known[]> {
  const rows = await getDb()
    .select({ id: profileProjects.id, name: profileProjects.name, matchKey: profileProjectLinks.matchKey })
    .from(profileProjectLinks)
    .innerJoin(profileProjects, eq(profileProjects.id, profileProjectLinks.projectId))
    .where(eq(profileProjectLinks.memberId, memberId));
  return rows.map((row) => ({ ...row, aliases: [] }));
}

async function linkedSkillIds(memberId: string) {
  const rows = await getDb()
    .select({ skillId: profileSkillLinks.skillId })
    .from(profileSkillLinks)
    .where(eq(profileSkillLinks.memberId, memberId));
  return new Set(rows.map((row) => row.skillId));
}

export type NameCheck =
  | { kind: "existing"; item: { id: string; name: string }; onProfile: boolean }
  | { kind: "new"; suggestions: { id: string; name: string }[] };

export async function checkName(owner: Owner, kind: "skill" | "project", name: string): Promise<NameCheck> {
  await ready(owner);
  const known = kind === "skill" ? await skillCatalog() : await ownProjects(owner.memberId);
  const exact = findExact(matchKey(name), known);
  if (exact) {
    const onProfile = kind === "project" || (await linkedSkillIds(owner.memberId)).has(exact.id);
    return { kind: "existing", item: { id: exact.id, name: exact.name }, onProfile };
  }
  return { kind: "new", suggestions: suggest(name, known).map((item) => ({ id: item.id, name: item.name })) };
}

class ProjectNameTaken extends Error {}

export type AddResult =
  | { ok: true; view: EnrichmentView }
  | { ok: false; error: "already_in_system"; existing: { id: string; name: string } }
  | { ok: false; error: "not_found" };

/** A new name that matches the catalog exactly is refused with the match, so the User links it instead. */
export async function addSkill(owner: Owner, input: SkillInput): Promise<AddResult> {
  await ready(owner);
  const db = getDb();
  let skillId: string;
  if (input.useId) {
    const [row] = await db.select({ id: profileSkills.id }).from(profileSkills).where(eq(profileSkills.id, input.useId)).limit(1);
    if (!row) return { ok: false, error: "not_found" };
    skillId = row.id;
  } else {
    const key = matchKey(input.name);
    const exact = findExact(key, await skillCatalog());
    if (exact) return { ok: false, error: "already_in_system", existing: { id: exact.id, name: exact.name } };
    const [created] = await db
      .insert(profileSkills)
      .values({ name: input.name, matchKey: key, origin: "member", createdByMemberId: owner.memberId })
      .onConflictDoNothing()
      .returning({ id: profileSkills.id });
    if (!created) {
      const [raced] = await db.select().from(profileSkills).where(eq(profileSkills.matchKey, key)).limit(1);
      if (!raced) throw new Error("profile_skill_insert_lost");
      return { ok: false, error: "already_in_system", existing: { id: raced.id, name: raced.name } };
    }
    skillId = created.id;
  }
  await db
    .insert(profileSkillLinks)
    .values({ memberId: owner.memberId, skillId, level: input.level, notes: input.notes, source: "self" })
    .onConflictDoUpdate({
      target: [profileSkillLinks.memberId, profileSkillLinks.skillId],
      set: { level: input.level, notes: input.notes, updatedAt: new Date() },
    });
  return { ok: true, view: await enrichmentView(owner) };
}

export async function addProject(owner: Owner, input: ProjectInput): Promise<AddResult> {
  await ready(owner);
  const db = getDb();
  if (input.useId) {
    const [row] = await db
      .select({ id: profileProjectLinks.id })
      .from(profileProjectLinks)
      .where(and(eq(profileProjectLinks.memberId, owner.memberId), eq(profileProjectLinks.projectId, input.useId)))
      .limit(1);
    if (!row) return { ok: false, error: "not_found" };
    await db
      .update(profileProjectLinks)
      .set({ role: input.role, updatedAt: new Date() })
      .where(eq(profileProjectLinks.id, row.id));
    return { ok: true, view: await enrichmentView(owner) };
  }
  const key = matchKey(input.name);
  const exact = findExact(key, await ownProjects(owner.memberId));
  if (exact) return { ok: false, error: "already_in_system", existing: { id: exact.id, name: exact.name } };
  try {
    await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(profileProjects)
        .values({ name: input.name, link: input.link, description: input.description, createdByMemberId: owner.memberId })
        .returning({ id: profileProjects.id });
      const [link] = await tx
        .insert(profileProjectLinks)
        .values({ memberId: owner.memberId, projectId: project.id, matchKey: key, role: input.role, source: "self" })
        .onConflictDoNothing()
        .returning({ id: profileProjectLinks.id });
      if (!link) throw new ProjectNameTaken();
    });
  } catch (error) {
    if (!(error instanceof ProjectNameTaken)) throw error;
    const raced = findExact(key, await ownProjects(owner.memberId));
    return raced ? { ok: false, error: "already_in_system", existing: { id: raced.id, name: raced.name } } : { ok: false, error: "not_found" };
  }
  return { ok: true, view: await enrichmentView(owner) };
}

export async function removeItem(owner: Owner, kind: "skill" | "project" | "entry", id: string) {
  await ready(owner);
  const db = getDb();
  if (kind === "skill") {
    await db.delete(profileSkillLinks).where(and(eq(profileSkillLinks.memberId, owner.memberId), eq(profileSkillLinks.skillId, id)));
  } else if (kind === "project") {
    await db
      .delete(profileProjectLinks)
      .where(and(eq(profileProjectLinks.memberId, owner.memberId), eq(profileProjectLinks.projectId, id)));
  } else {
    await db.delete(profileEntries).where(and(eq(profileEntries.memberId, owner.memberId), eq(profileEntries.id, id)));
  }
  return enrichmentView(owner);
}

function entryKey(candidate: Pick<ImportCandidate, "title" | "organization">) {
  return matchKey(`${candidate.title} ${candidate.organization}`);
}

export type ReviewItem = ImportCandidate & {
  existing: { id: string; name: string } | null;
  onProfile: boolean;
};

/** Reads the export into a review list. Nothing is written here. */
export async function reviewImport(owner: Owner, text: string): Promise<ReviewItem[]> {
  await ready(owner);
  const db = getDb();
  const catalog = await skillCatalog();
  const linked = await linkedSkillIds(owner.memberId);
  const entries = await db
    .select({ kind: profileEntries.kind, matchKey: profileEntries.matchKey })
    .from(profileEntries)
    .where(eq(profileEntries.memberId, owner.memberId));
  const entryKeys = new Set(entries.map((entry) => `${entry.kind}|${entry.matchKey}`));
  return candidatesFromText(text).map((candidate) => {
    if (candidate.kind === "skill") {
      const exact = findExact(matchKey(candidate.title), catalog);
      return {
        ...candidate,
        existing: exact ? { id: exact.id, name: exact.name } : null,
        onProfile: exact ? linked.has(exact.id) : false,
      };
    }
    return { ...candidate, existing: null, onProfile: entryKeys.has(`${candidate.kind}|${entryKey(candidate)}`) };
  });
}

export type AcceptedItem = { candidate: ImportCandidate; useId: string | null };

export type AcceptResult = { added: string[]; linkedExisting: string[]; alreadyOnProfile: string[]; view: EnrichmentView };

/**
 * Writes only what the User accepted, all at once. Imported skills go through the same exact
 * match as typed ones: a name already in the catalog links that skill and never makes a copy.
 */
export async function acceptImport(owner: Owner, profileUrl: string | null, items: readonly AcceptedItem[]): Promise<AcceptResult> {
  await ready(owner);
  const importedAt = new Date();
  const catalog = await skillCatalog();
  const result = { added: [] as string[], linkedExisting: [] as string[], alreadyOnProfile: [] as string[] };
  await getDb().transaction(async (tx) => {
    for (const { candidate, useId } of items) {
      const source = { source: "linkedin", sourceUrl: profileUrl, importedAt };
      if (candidate.kind !== "skill") {
        const [row] = await tx
          .insert(profileEntries)
          .values({
            memberId: owner.memberId,
            kind: candidate.kind,
            title: candidate.title,
            organization: candidate.organization,
            startedOn: candidate.startedOn,
            endedOn: candidate.endedOn,
            matchKey: entryKey(candidate),
            ...source,
          })
          .onConflictDoNothing()
          .returning({ id: profileEntries.id });
        (row ? result.added : result.alreadyOnProfile).push(candidate.title);
        continue;
      }
      const key = matchKey(candidate.title);
      const exact = findExact(key, catalog);
      const chosen = exact ?? (useId ? catalog.find((item) => item.id === useId) ?? null : null);
      let skillId = chosen?.id ?? null;
      if (!skillId) {
        const [created] = await tx
          .insert(profileSkills)
          .values({ name: candidate.title, matchKey: key, origin: "linkedin", createdByMemberId: owner.memberId })
          .onConflictDoNothing()
          .returning({ id: profileSkills.id });
        const [row] = created
          ? [created]
          : await tx.select({ id: profileSkills.id }).from(profileSkills).where(eq(profileSkills.matchKey, key)).limit(1);
        if (!row) throw new Error("profile_skill_insert_lost");
        skillId = row.id;
        catalog.push({ id: row.id, name: candidate.title, matchKey: key, aliases: [] });
      }
      const [link] = await tx
        .insert(profileSkillLinks)
        .values({ memberId: owner.memberId, skillId, ...source })
        .onConflictDoNothing()
        .returning({ id: profileSkillLinks.id });
      if (!link) result.alreadyOnProfile.push(chosen?.name ?? candidate.title);
      else if (chosen) result.linkedExisting.push(chosen.name);
      else result.added.push(candidate.title);
    }
  });
  return { ...result, view: await enrichmentView(owner) };
}

export type EnrichmentView = {
  photoSrc: string;
  skills: { id: string; name: string; level: string | null; source: string; importedAt: string | null }[];
  projects: { id: string; name: string; role: string; link: string; source: string; importedAt: string | null }[];
  entries: {
    id: string;
    kind: string;
    title: string;
    organization: string;
    startedOn: string | null;
    endedOn: string | null;
    source: string;
    importedAt: string | null;
  }[];
};

export async function enrichmentView(owner: Owner): Promise<EnrichmentView> {
  await ready(owner);
  const db = getDb();
  const [profile] = await db
    .select({ photoMediaId: userProfiles.photoMediaId })
    .from(userProfiles)
    .where(eq(userProfiles.memberId, owner.memberId))
    .limit(1);
  const skills = await db
    .select({
      id: profileSkills.id,
      name: profileSkills.name,
      level: profileSkillLinks.level,
      source: profileSkillLinks.source,
      importedAt: profileSkillLinks.importedAt,
    })
    .from(profileSkillLinks)
    .innerJoin(profileSkills, eq(profileSkills.id, profileSkillLinks.skillId))
    .where(eq(profileSkillLinks.memberId, owner.memberId))
    .orderBy(asc(profileSkills.name));
  const projects = await db
    .select({
      id: profileProjects.id,
      name: profileProjects.name,
      role: profileProjectLinks.role,
      link: profileProjects.link,
      source: profileProjectLinks.source,
      importedAt: profileProjectLinks.importedAt,
    })
    .from(profileProjectLinks)
    .innerJoin(profileProjects, eq(profileProjects.id, profileProjectLinks.projectId))
    .where(eq(profileProjectLinks.memberId, owner.memberId))
    .orderBy(asc(profileProjects.name));
  const entries = await db
    .select()
    .from(profileEntries)
    .where(eq(profileEntries.memberId, owner.memberId))
    .orderBy(asc(profileEntries.kind), asc(profileEntries.createdAt));
  const iso = (date: Date | null) => (date ? date.toISOString() : null);
  return {
    photoSrc: profile?.photoMediaId ? mediaPath(profile.photoMediaId) : "",
    skills: skills.map((row) => ({ ...row, importedAt: iso(row.importedAt) })),
    projects: projects.map((row) => ({ ...row, importedAt: iso(row.importedAt) })),
    entries: entries.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      organization: row.organization,
      startedOn: row.startedOn,
      endedOn: row.endedOn,
      source: row.source,
      importedAt: iso(row.importedAt),
    })),
  };
}
