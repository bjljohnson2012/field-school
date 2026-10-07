import { NextResponse } from "next/server";
import { deny, requireTeacher } from "@/lib/composer/access";
import { addSource, getLessonDetail } from "@/lib/composer/store";
import { completeWithConfiguredAi } from "@/lib/living-brain/ai";
import { expandFromModel } from "@/lib/library/expand-knowledge";
import { lessonProse } from "@/lib/library/teach-from-knowledge";

export const dynamic = "force-dynamic";

const PROMPT = `You expand only the knowledge in this message.
Reply with one JSON object and no markdown.
Do not add facts, names, or steps that are not in the knowledge.
If the knowledge does not say enough to explain it, set expansion to "needs more information".
Ask one to three short follow-up questions. One of them asks what the scope or limit of the knowledge is, unless the knowledge already states that limit.
{
  "expansion": "",
  "questions": ["What is the scope or limit of the knowledge?"]
}`;

export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const lessonId = typeof body.lessonId === "string" ? body.lessonId.trim() : "";
  if (!lessonId) return deny(400, "unknown_lesson");
  const detail = await getLessonDetail(auth.identity, lessonId);
  if (!detail) return deny(404, "unknown_lesson");

  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  if (answer) {
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (question.length < 8 || answer.length < 12) return deny(400, "needs_more");
    const saved = await addSource(auth.identity, {
      lessonId,
      kind: "text",
      title: question.slice(0, 80),
      body: answer.slice(0, 4000),
    });
    if ("error" in saved) return deny(400, typeof saved.error === "string" ? saved.error : "needs_more");
    return NextResponse.json({ ok: true });
  }

  const source = [lessonProse(detail.lesson.body), ...detail.units.map((unit) => unit.body)]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 8000);
  const asked = await completeWithConfiguredAi(auth.identity.orgId, `${PROMPT}\n\n${source}`);
  const reading = expandFromModel(asked, source);
  return NextResponse.json({ ok: true, ...reading });
}
