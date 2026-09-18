import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { applyComposerSqlIfConfigured } from "./sql";
import { canTeach } from "./rules";

export async function composerIdentity(request: Request) {
  await applyComposerSqlIfConfigured();
  return identityFromRequest(request);
}

export function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function requireTeacher(request: Request) {
  const auth = await composerIdentity(request);
  if (!auth.ok) return { ok: false as const, response: deny(auth.status, auth.error) };
  if (!canTeach(auth.identity)) {
    return {
      ok: false as const,
      response: deny(403, auth.identity.kind === "child" ? "child_cannot_teach" : "teacher_only"),
    };
  }
  return { ok: true as const, identity: auth.identity, memberships: auth.memberships };
}

export async function requireMember(request: Request) {
  const auth = await composerIdentity(request);
  if (!auth.ok) return { ok: false as const, response: deny(auth.status, auth.error) };
  return { ok: true as const, identity: auth.identity, memberships: auth.memberships };
}
