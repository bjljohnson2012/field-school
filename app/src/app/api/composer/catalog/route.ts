import { NextResponse } from "next/server";
import { requireMember } from "@/lib/composer/access";
import { canTeach } from "@/lib/composer/rules";
import { listLessons } from "@/lib/composer/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMember(request);
  if (!auth.ok) return auth.response;
  const lessons = await listLessons(auth.identity);
  return NextResponse.json({
    ok: true,
    org: auth.identity.orgSlug,
    canTeach: canTeach(auth.identity),
    lessons,
  });
}
