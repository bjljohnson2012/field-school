import { NextResponse } from "next/server";
import { requireMember } from "@/lib/composer/access";
import { canTeach } from "@/lib/composer/rules";
import { listLessons } from "@/lib/composer/store";
import { scopeSurface } from "@/lib/tenancy/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMember(request);
  if (!auth.ok) return auth.response;
  const actor = { orgId: auth.identity.orgId, memberKind: auth.identity.kind };
  const lessons = scopeSurface(
    actor,
    "library",
    (await listLessons(auth.identity)).map((lesson) => ({ ...lesson, orgId: auth.identity.orgId })),
  ).map(({ orgId: _orgId, ...lesson }) => lesson);
  return NextResponse.json({
    ok: true,
    org: auth.identity.orgSlug,
    canTeach: canTeach(auth.identity),
    lessons,
  });
}
