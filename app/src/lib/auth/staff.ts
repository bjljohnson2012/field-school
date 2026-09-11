import { DEAN_EMAIL, isDeanEmail } from "@/lib/campus";

function parseStaffEmails(): string[] {
  const raw = process.env.STAFF_ADMIN_EMAILS?.trim();
  if (!raw) return [DEAN_EMAIL];
  const fromEnv = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : [DEAN_EMAIL];
}

export function isStaffEmail(email?: string | null) {
  const mail = (email ?? "").trim().toLowerCase();
  if (!mail) return false;
  if (isDeanEmail(mail)) return true;
  return parseStaffEmails().includes(mail);
}
