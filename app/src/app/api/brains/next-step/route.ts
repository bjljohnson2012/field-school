import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { enrollmentNextFor, nextStepPayload } from "@/lib/brains/enrollment-next";
import { toolRead } from "@/lib/living-brain/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.identity.kind === "child") {
    return NextResponse.json({ ok: false, error: "child_has_no_login" }, { status: 403 });
  }
  let enrollment: Awaited<ReturnType<typeof enrollmentNextFor>> = null;
  try {
    enrollment = await enrollmentNextFor(auth.identity);
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }
  let people: { membershipId: string; outcomes: string }[] = [];
  try {
    const brain = await toolRead(auth.identity.orgId);
    people = (brain?.people ?? []).map((person) => ({
      membershipId: person.membershipId,
      outcomes: person.outcomes,
    }));
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }
  const next = nextStepPayload({
    enrollment,
    people,
    membershipId: auth.identity.membershipId,
  });
  return NextResponse.json({ ok: true, ...next });
}
