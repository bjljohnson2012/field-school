import { mkdir, writeFile } from "node:fs/promises";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { coachingSources, sourceMappings } from "@/lib/db/schema";
import { persistVisibility } from "../knowledge/visibility";
import { isFileIntent, isFileKind, isUuid, storedFilePath, subjectFromStoragePath, uploadDirectory } from "./paths";

export class FileError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "FileError";
    this.code = code;
    this.status = status;
  }
}

export function fileDto(
  source: typeof coachingSources.$inferSelect,
  mapping: typeof sourceMappings.$inferSelect | null,
) {
  return {
    id: source.id,
    title: source.title,
    kind: source.kind,
    visibility: source.visibility,
    storagePath: source.storagePath,
    mime: source.mime,
    byteSize: source.byteSize,
    subjectMembershipId: subjectFromStoragePath(source.storagePath),
    createdAt: source.createdAt.toISOString(),
    mapping: mapping
      ? {
          id: mapping.id,
          kind: mapping.kind,
          intent: mapping.intent,
          visibility: mapping.visibility,
          aiSuggestedKind: mapping.aiSuggestedKind,
          aiSuggestedIntent: mapping.aiSuggestedIntent,
          aiConfidence: mapping.aiConfidence,
          aiRationale: mapping.aiRationale,
          confirmedAt: mapping.confirmedAt?.toISOString() ?? null,
        }
      : null,
  };
}

export async function listFiles(orgId: string, subjectMembershipId?: string) {
  const db = getDb();
  const sources = await db
    .select()
    .from(coachingSources)
    .where(eq(coachingSources.orgId, orgId))
    .orderBy(desc(coachingSources.createdAt));
  const maps = await db.select().from(sourceMappings).where(eq(sourceMappings.orgId, orgId));
  const bySource = new Map<string, typeof sourceMappings.$inferSelect>();
  for (const row of maps) {
    const current = bySource.get(row.sourceId);
    if (!current || row.createdAt > current.createdAt) bySource.set(row.sourceId, row);
  }
  return sources
    .map((source) => fileDto(source, bySource.get(source.id) ?? null))
    .filter((row) => !subjectMembershipId || row.subjectMembershipId === subjectMembershipId);
}

export async function storeConfirmedFile(input: {
  orgId: string;
  authorMembershipId: string;
  filename: string;
  mime: string | null;
  text: string;
  bytes: Buffer;
  kind: string;
  intent: string;
  visibility: unknown;
  subjectMembershipId: string;
  suggestion: {
    kind: string | null;
    intent: string | null;
    confidence: number | null;
    rationale: string | null;
  };
}) {
  if (!isFileKind(input.kind) || !isFileIntent(input.intent)) throw new FileError("invalid_body", 400);
  if (input.subjectMembershipId && !isUuid(input.subjectMembershipId)) throw new FileError("invalid_body", 400);
  const visibility = persistVisibility(input.visibility);
  if (!visibility) throw new FileError("invalid_body", 400);
  const leaf = `${crypto.randomUUID()}__${input.filename}`;
  const full = storedFilePath(input.orgId, input.subjectMembershipId, leaf);
  const dir = uploadDirectory(input.orgId);
  await mkdir(dir, { recursive: true });
  await writeFile(full, input.bytes);
  const db = getDb();
  const [source] = await db
    .insert(coachingSources)
    .values({
      orgId: input.orgId,
      kind: input.kind,
      title: input.filename,
      storagePath: full,
      body: input.text,
      mime: input.mime,
      byteSize: input.bytes.byteLength,
      visibility,
      storageStatus: "stored",
      authorMembershipId: input.authorMembershipId,
    })
    .returning();
  if (!source) throw new FileError("store_failed", 500);
  const [mapping] = await db
    .insert(sourceMappings)
    .values({
      orgId: input.orgId,
      sourceId: source.id,
      kind: input.kind,
      intent: input.intent,
      visibility,
      aiSuggestedKind: input.suggestion.kind,
      aiSuggestedIntent: input.suggestion.intent,
      aiConfidence: input.suggestion.confidence == null ? null : String(input.suggestion.confidence),
      aiRationale: input.suggestion.rationale,
      confirmedAt: new Date(),
    })
    .returning();
  return fileDto(source, mapping ?? null);
}
