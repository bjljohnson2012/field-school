import { NextResponse } from "next/server";
import { hirePathBrainHint } from "@/lib/progress/hire-path-brain-sync";
import {
  selectSupervisedBrain,
  writeSupervisedBrain,
} from "@/lib/progress/supervised-brain";

export const dynamic = "force-dynamic";

function publicBrain(evidence: ReturnType<typeof selectSupervisedBrain>) {
  const selected = evidence.selected
    ? {
        ...evidence.selected,
        confidence: evidence.selected.progress.confidence,
      }
    : evidence.selected;
  return {
    ok: true,
    fr: evidence.fr,
    distribute: evidence.distribute,
    launch: evidence.launch,
    selected_child_id: evidence.selected_child_id,
    selected,
    children: evidence.children.map((child) => ({
      id: child.id,
      name: child.name,
      kind: child.kind,
      login: child.login,
      user: child.user,
    })),
  };
}

export async function GET(request: Request) {
  const childId = new URL(request.url).searchParams.get("child");
  const hint = hirePathBrainHint(childId);
  return NextResponse.json(publicBrain(selectSupervisedBrain(childId, hint)));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const childId = String(body.child || body.child_id || "").trim();
  const action = String(body.action || body.op || "").trim();
  const hint = hirePathBrainHint(childId);
  const confidence = body.confidence ?? body.confidence_state;
  const written = writeSupervisedBrain(childId, action || (confidence ? "confidence" : ""), {
    ...hint,
    title: typeof body.title === "string" ? body.title : undefined,
    sources: body.sources,
    notes: body.notes,
    confidence,
  });
  if (!written.ok) {
    return NextResponse.json({ ok: false, error: written.error }, { status: 400 });
  }
  return NextResponse.json({
    ...publicBrain(selectSupervisedBrain(childId, hint)),
    selected: {
      ...written.selected,
      confidence: written.selected.progress.confidence,
    },
  });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const childId = String(body.child || body.child_id || "").trim();
  const action = String(body.action || body.op || "sync").trim() || "sync";
  const hint = hirePathBrainHint(childId);
  const confidence = body.confidence ?? body.confidence_state;
  const written = writeSupervisedBrain(childId, action, {
    ...hint,
    confidence,
  });
  if (!written.ok) {
    return NextResponse.json({ ok: false, error: written.error }, { status: 400 });
  }
  return NextResponse.json({
    ...publicBrain(selectSupervisedBrain(childId, hint)),
    selected: {
      ...written.selected,
      confidence: written.selected.progress.confidence,
    },
  });
}
