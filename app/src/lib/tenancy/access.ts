import { isStaffEmail } from "@/lib/auth/staff";
import { roomOf } from "./kind.ts";

export type Surface = "people" | "library" | "insights";

export type ReadActor = {
  orgId: string;
  memberKind: string;
};

export type WriteActor = ReadActor & {
  memberId: string;
  orgSlug: string;
  orgKind: string;
  stance: string;
};

const SURFACES = new Set<Surface>(["people", "library", "insights"]);
const TEMPLATES = new Set(["household", "sales"]);
const ACCOUNTABLE = new Set(["owner", "admin", "guardian", "teacher"]);
const WRITERS = new Set(["owner", "admin", "guardian", "teacher", "trainer", "coach", "leader"]);

export function isTemplateSlug(slug: string): boolean {
  return TEMPLATES.has(slug);
}

export function loginAllowed(
  member: { kind?: string | null; email?: string | null } | null | undefined,
  email?: string | null,
): boolean {
  const kind = member == null ? null : member.kind;
  if (kind === "child") return false;
  const mail = email ?? (member == null ? null : member.email);
  if (isStaffEmail(mail)) return true;
  if (member == null) return false;
  if (typeof kind !== "string" || kind.trim() === "") return false;
  return true;
}

export function canRead(actor: ReadActor, row: { orgId: string }): boolean {
  if (actor.memberKind === "child") return false;
  if (!actor.orgId || !row.orgId) return false;
  return actor.orgId === row.orgId;
}

export function scopeSurface<T extends { orgId: string }>(
  actor: ReadActor,
  surface: Surface,
  rows: readonly T[],
): T[] {
  if (!SURFACES.has(surface)) return [];
  return rows.filter((row) => canRead(actor, row));
}

function inDevelopment(row: { memberKind?: string; login?: string }): boolean {
  return row.memberKind === "child" || row.login === "none";
}

export function canWrite(
  actor: WriteActor,
  row: { orgId: string; memberKind?: string; login?: string; memberId?: string },
): boolean {
  if (!canRead(actor, row)) return false;
  if (isTemplateSlug(actor.orgSlug)) return false;
  if (actor.memberKind === "child") return false;
  if (inDevelopment(row)) {
    return roomOf(actor.orgKind) === "family" && ACCOUNTABLE.has(actor.stance);
  }
  if (row.memberId && row.memberId === actor.memberId) return true;
  return WRITERS.has(actor.stance);
}
