import { NextResponse } from "next/server";
import { loadSession } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";

export type Actor = { owner: { memberId: string; name: string }; kind: string; orgSlug: string };

/** The signed-in User. Tracked children have no login of their own, so a child kind is refused by callers. */
export async function signedIn(request: Request): Promise<{ ok: true; actor: Actor } | { ok: false; response: NextResponse }> {
  const session = await loadSession(request);
  if (!session) return { ok: false, response: refuse(401, "sign_in_required") };
  return {
    ok: true,
    actor: {
      owner: { memberId: session.member.id, name: session.user.name },
      kind: session.member.kind ?? "adult",
      orgSlug: session.active?.orgSlug ?? "",
    },
  };
}

/** Enrichment belongs to an adult profile only. */
export async function adultOnly(request: Request): Promise<{ ok: true; actor: Actor } | { ok: false; response: NextResponse }> {
  const auth = await signedIn(request);
  if (auth.ok && auth.actor.kind === "child") return { ok: false, response: refuse(403, "child_has_no_adult_profile") };
  return auth;
}

export function refuse(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false };
  }
}

export function unavailable(error: unknown) {
  if (error instanceof DatabaseUnavailableError) return refuse(503, "database_unavailable");
  throw error;
}
