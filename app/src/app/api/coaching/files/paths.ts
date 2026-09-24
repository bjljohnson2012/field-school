import path from "node:path";

export const UPLOAD_ROOT = "/opt/field-school/uploads";

export const FILE_KINDS = [
  "AE_PREP_DOC",
  "COACHING_DOC",
  "PROFILE_ASSET",
  "PRODUCT_REFERENCE",
  "PERSONALITY_NOTE",
  "GENERAL",
  "OTHER",
] as const;

export const FILE_INTENTS = ["ADD_TO_COACHING_LOG", "UPDATE_PROFILE", "REFERENCE_ONLY"] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isFileKind(value: string): value is (typeof FILE_KINDS)[number] {
  return (FILE_KINDS as readonly string[]).includes(value);
}

export function isFileIntent(value: string): value is (typeof FILE_INTENTS)[number] {
  return (FILE_INTENTS as readonly string[]).includes(value);
}

export function isUuid(value: string) {
  return UUID.test(value);
}

export function uploadDirectory(orgId: string) {
  if (!isUuid(orgId)) throw new Error("invalid_org");
  return path.join(UPLOAD_ROOT, orgId);
}

export function safeFileName(filename: string) {
  const base = filename.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "").slice(0, 80);
  return cleaned || "file";
}

export function storedFilePath(orgId: string, subjectMembershipId: string, filename: string) {
  const dir = uploadDirectory(orgId);
  const subject = subjectMembershipId ? `${subjectMembershipId}--` : "";
  const full = path.join(dir, `${subject}${safeFileName(filename)}`);
  if (full !== dir && !full.startsWith(dir + path.sep)) throw new Error("invalid_path");
  return full;
}

export function subjectFromStoragePath(storagePath: string | null | undefined) {
  const base = storagePath?.split(/[/\\]/).pop() ?? "";
  const match = base.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})--/i);
  return match?.[1] ?? "";
}
