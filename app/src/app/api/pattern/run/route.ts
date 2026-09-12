import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { itemsForSubset } from "@/lib/pattern/items";
import { ProfileLockedError, publicProfile, runInstrument } from "@/lib/pattern/profile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await identityFromRequest();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const subset = body.subset === "child" ? "child" : "adult";
  const answers =
    body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? (body.answers as Record<string, number>)
      : null;
  if (!answers) {
    return NextResponse.json({ ok: false, error: "answers_required" }, { status: 400 });
  }
  const required = itemsForSubset(subset);
  const missing = required.filter((item) => typeof answers[item.key] !== "number");
  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: "incomplete", missing: missing.map((item) => item.key) },
      { status: 400 },
    );
  }
  const membershipId =
    typeof body.membership_id === "string" && body.membership_id
      ? body.membership_id
      : auth.identity.membershipId;
  try {
    const out = await runInstrument({
      actor: auth.identity,
      membershipId,
      subset,
      answers,
    });
    return NextResponse.json({
      ok: true,
      reset: true,
      profile: publicProfile(out.profile),
      result: out.result,
    });
  } catch (error) {
    if (error instanceof ProfileLockedError) {
      return NextResponse.json({ ok: false, error: "profile_locked" }, { status: 403 });
    }
    throw error;
  }
}
