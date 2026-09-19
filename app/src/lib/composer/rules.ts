export const SOURCE_KINDS = ["text", "upload", "book", "link"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export const TEACH_STANCES = ["admin", "guardian", "trainer", "teacher"] as const;

export const MAX_FILE_BYTES = 200 * 1024 * 1024;
export const MAX_ORG_BYTES = 2 * 1024 * 1024 * 1024;

export function isSourceKind(value: string): value is SourceKind {
  return (SOURCE_KINDS as readonly string[]).includes(value);
}

export function canTeach(actor: { kind: string; stance: string }) {
  if (actor.kind === "child") return false;
  return (TEACH_STANCES as readonly string[]).includes(actor.stance);
}

export function canSeeDrafts(actor: { kind: string; stance: string }) {
  return canTeach(actor);
}

export function lessonVisibleTo(
  lesson: { status: string; orgId: string },
  actor: { kind: string; stance: string; orgId: string },
) {
  if (lesson.orgId !== actor.orgId) return false;
  if (lesson.status === "published") return true;
  return canSeeDrafts(actor);
}

export function quizRequiresUnit(sourceUnitId: string | null | undefined) {
  return Boolean(sourceUnitId && sourceUnitId.trim());
}

export function slugify(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "lesson";
}
