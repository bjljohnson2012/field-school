import { NextResponse } from "next/server";
import { deny, requireTeacher } from "@/lib/composer/access";
import { submitWizardKnowledge } from "@/lib/library/submit-knowledge";

export const dynamic = "force-dynamic";

const KINDS = new Set(["file", "link", "text", "idea"]);

export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny(400, "invalid_json");
  }
  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!KINDS.has(kind)) return deny(400, "invalid_kind");
  const audience = Array.isArray(body.audience)
    ? body.audience.filter((name): name is string => typeof name === "string")
    : [];
  const result = await submitWizardKnowledge(auth.identity, {
    title: typeof body.title === "string" ? body.title : "",
    outcome: typeof body.outcome === "string" ? body.outcome : "",
    kind: kind as "file" | "link" | "text" | "idea",
    detail: typeof body.detail === "string" ? body.detail : "",
    mode: typeof body.mode === "string" ? body.mode : "",
    audience,
  });
  if ("error" in result && typeof result.error === "string") return deny(400, result.error);
  return NextResponse.json(result);
}
