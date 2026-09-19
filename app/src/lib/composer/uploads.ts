import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MAX_FILE_BYTES, MAX_ORG_BYTES } from "./rules";

export { MAX_FILE_BYTES, MAX_ORG_BYTES };

export function uploadRoot() {
  return (
    process.env.COMPOSER_UPLOAD_ROOT?.trim() ||
    "/opt/field-school/uploads"
  );
}

export function orgUploadDir(orgId: string) {
  return join(uploadRoot(), orgId);
}

export function safeFileName(name: string) {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
  return base || "upload.bin";
}

export function assertFileBudget(size: number, orgUsed: number) {
  if (size > MAX_FILE_BYTES) return "file_too_large";
  if (orgUsed + size > MAX_ORG_BYTES) return "org_quota";
  return null;
}

export function writeOrgUpload(opts: {
  orgId: string;
  sourceId: string;
  fileName: string;
  bytes: Uint8Array;
}) {
  const dir = orgUploadDir(opts.orgId);
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, `${opts.sourceId}-${safeFileName(opts.fileName)}`);
  writeFileSync(dest, opts.bytes);
  return dest;
}

export function fileExists(path: string) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
