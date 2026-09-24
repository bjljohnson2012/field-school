import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { coachingKnowledgeUnits, knowledgeRepos } from "@/lib/db/schema";
import {
  isUnitStatus,
  learnerCanReadUnit,
  visibilityForWrite,
  type UnitStatus,
} from "./visibility";

export class LibraryError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "LibraryError";
    this.code = code;
    this.status = status;
  }
}

function tagsOf(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function repoDto(row: typeof knowledgeRepos.$inferSelect) {
  return {
    id: row.id,
    repoKind: row.repoKind,
    name: row.name,
    visibility: row.visibility,
    createdAt: row.createdAt.toISOString(),
  };
}

export function unitDto(row: typeof coachingKnowledgeUnits.$inferSelect) {
  const tags = Array.isArray(row.tags) ? row.tags.filter((item): item is string => typeof item === "string") : [];
  return {
    id: row.id,
    repositoryId: row.repositoryId,
    title: row.title,
    body: row.body,
    tags,
    status: row.status,
    visibility: row.visibility,
    authorMembershipId: row.authorMembershipId,
    approverMembershipId: row.approverMembershipId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function uniqueViolation(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("23505") || message.includes("knowledge_repos_org_kind_name");
}

export async function listLibrary(orgId: string) {
  const db = getDb();
  const repos = await db
    .select()
    .from(knowledgeRepos)
    .where(eq(knowledgeRepos.orgId, orgId))
    .orderBy(desc(knowledgeRepos.createdAt));
  const units = await db
    .select()
    .from(coachingKnowledgeUnits)
    .where(eq(coachingKnowledgeUnits.orgId, orgId))
    .orderBy(desc(coachingKnowledgeUnits.updatedAt));
  return { repos: repos.map(repoDto), units: units.map(unitDto) };
}

export async function listLearnerUnits(orgId: string) {
  const db = getDb();
  const units = await db
    .select()
    .from(coachingKnowledgeUnits)
    .where(eq(coachingKnowledgeUnits.orgId, orgId))
    .orderBy(desc(coachingKnowledgeUnits.updatedAt));
  return units.map(unitDto).filter((unit) => learnerCanReadUnit(unit));
}

export async function createRepo(input: {
  orgId: string;
  repoKind: string;
  name: string;
  visibility: unknown;
}) {
  const name = input.name.trim();
  if (!name) throw new LibraryError("invalid_body", 400);
  const visibility = visibilityForWrite(input.visibility, input.repoKind);
  const db = getDb();
  try {
    const [row] = await db
      .insert(knowledgeRepos)
      .values({
        orgId: input.orgId,
        repoKind: input.repoKind,
        name,
        visibility,
      })
      .returning();
    if (!row) throw new LibraryError("store_failed", 500);
    return repoDto(row);
  } catch (error) {
    if (error instanceof LibraryError) throw error;
    if (uniqueViolation(error)) throw new LibraryError("duplicate_repo", 409);
    throw error;
  }
}

export async function createUnit(input: {
  orgId: string;
  repositoryId: string;
  authorMembershipId: string;
  title: string;
  body: string;
  tags: unknown;
  visibility: unknown;
  status?: string;
}) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) throw new LibraryError("invalid_body", 400);
  const db = getDb();
  const [repo] = await db
    .select()
    .from(knowledgeRepos)
    .where(and(eq(knowledgeRepos.id, input.repositoryId), eq(knowledgeRepos.orgId, input.orgId)))
    .limit(1);
  if (!repo) throw new LibraryError("not_found", 404);
  const status: UnitStatus = input.status && isUnitStatus(input.status) ? input.status : "pending";
  const visibility = visibilityForWrite(input.visibility, repo.repoKind);
  const [row] = await db
    .insert(coachingKnowledgeUnits)
    .values({
      orgId: input.orgId,
      repositoryId: repo.id,
      title,
      body,
      tags: tagsOf(input.tags),
      status,
      visibility,
      authorMembershipId: input.authorMembershipId,
      approverMembershipId: status === "approved" ? input.authorMembershipId : null,
    })
    .returning();
  if (!row) throw new LibraryError("store_failed", 500);
  return { unit: unitDto(row), approved: status === "approved" };
}

export async function updateUnit(input: {
  orgId: string;
  id: string;
  actorMembershipId: string;
  title?: string;
  body?: string;
  tags?: unknown;
  visibility?: unknown;
  status?: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(coachingKnowledgeUnits)
    .where(and(eq(coachingKnowledgeUnits.id, input.id), eq(coachingKnowledgeUnits.orgId, input.orgId)))
    .limit(1);
  if (!existing) throw new LibraryError("not_found", 404);
  const [repo] = await db
    .select()
    .from(knowledgeRepos)
    .where(eq(knowledgeRepos.id, existing.repositoryId))
    .limit(1);
  const status = input.status && isUnitStatus(input.status) ? input.status : existing.status;
  if (!isUnitStatus(status)) throw new LibraryError("invalid_body", 400);
  const visibility =
    input.visibility === undefined
      ? visibilityForWrite(existing.visibility, repo?.repoKind)
      : visibilityForWrite(input.visibility, repo?.repoKind);
  const title = input.title === undefined ? existing.title : input.title.trim();
  const body = input.body === undefined ? existing.body : input.body.trim();
  if (!title || !body) throw new LibraryError("invalid_body", 400);
  const approved = existing.status !== "approved" && status === "approved";
  const [row] = await db
    .update(coachingKnowledgeUnits)
    .set({
      title,
      body,
      tags: input.tags === undefined ? existing.tags : tagsOf(input.tags),
      status,
      visibility,
      approverMembershipId: status === "approved" ? input.actorMembershipId : existing.approverMembershipId,
      updatedAt: new Date(),
    })
    .where(eq(coachingKnowledgeUnits.id, existing.id))
    .returning();
  if (!row) throw new LibraryError("not_found", 404);
  return { unit: unitDto(row), approved };
}
