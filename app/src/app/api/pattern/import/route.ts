import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { SALES_SLUG } from "@/lib/campus-runtime/org";
import { getLiveProfile, publicProfile } from "@/lib/pattern/profile";
import { getDb } from "@/lib/db/client";
import { memberProfiles, memberProfileRevisions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (auth.identity.orgSlug === SALES_SLUG) {
    return NextResponse.json({ ok: false, error: "not_on_sales_board" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const imported = {
    imported: true,
    note: "Imported official result. Overrides Field Pattern estimates only. Bearing is unchanged.",
    nine_patterns: body.nine_patterns ?? null,
    type_codes: body.type_codes ?? null,
    leading_type_code: typeof body.type_code === "string" ? body.type_code : null,
    influence: body.influence ?? null,
    clusters: body.clusters ?? null,
  };
  const profile = await getLiveProfile(auth.identity.orgId, auth.identity.membershipId);
  const current = (profile.correspondence ?? {}) as Record<string, unknown>;
  const next = { ...current, estimates: current.estimates ?? current, imported };
  const db = getDb();
  const [updated] = await db
    .update(memberProfiles)
    .set({ correspondence: next, updatedAt: new Date() })
    .where(eq(memberProfiles.id, profile.id))
    .returning();
  await db.insert(memberProfileRevisions).values({
    profileId: profile.id,
    orgId: profile.orgId,
    membershipId: profile.membershipId,
    cause: "correspondence_import",
    bearingDeg: profile.bearingDeg,
    correspondence: next,
    narratives: profile.narratives,
    raw: { imported: true },
  });
  return NextResponse.json({ ok: true, profile: publicProfile(updated) });
}
