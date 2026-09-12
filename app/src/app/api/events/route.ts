import { NextResponse } from "next/server";
import { recordEvent, stationObjectId } from "@/lib/campus-runtime/events";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { courseAllowedInOrg } from "@/lib/campus-runtime/org";

export const dynamic = "force-dynamic";

const KINDS = new Set(["watch", "quiz", "assignment", "diagnostic"]);

export async function POST(request: Request) {
  const result = await identityFromRequest(request);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, guest: result.status === 401 },
      { status: result.status },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!KINDS.has(kind)) {
    return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 400 });
  }

  const course = typeof body.course === "string" ? body.course.trim() : "";
  if (course && !courseAllowedInOrg(result.identity.orgSlug, course)) {
    return NextResponse.json({ ok: false, error: "cross_org" }, { status: 403 });
  }
  const station = typeof body.station === "string" ? body.station.trim() : "";
  const objectType =
    typeof body.object_type === "string" ? body.object_type : "station";
  const objectId =
    typeof body.object_id === "string" && body.object_id
      ? body.object_id
      : station
        ? stationObjectId(course, station)
        : course;

  const score =
    typeof body.score === "number" && Number.isFinite(body.score) ? body.score : null;
  const raw =
    body.raw && typeof body.raw === "object" && !Array.isArray(body.raw)
      ? (body.raw as Record<string, unknown>)
      : {};

  const row = await recordEvent(result.identity, {
    kind,
    objectType,
    objectId,
    score,
    raw: { ...raw, course, station },
  });

  return NextResponse.json({
    ok: true,
    id: row.id,
    org: result.identity.orgSlug,
    membershipId: result.identity.membershipId,
  });
}
