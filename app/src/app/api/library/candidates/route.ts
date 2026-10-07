import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/composer/access";
import { listOpenKnowledge } from "@/lib/library/submit-knowledge";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireTeacher(request);
  if (!auth.ok) return auth.response;
  const lessons = await listOpenKnowledge(auth.identity);
  return NextResponse.json({ ok: true, lessons });
}
