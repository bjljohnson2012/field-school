import { NextResponse } from "next/server";
import { selectSupervisedIntent } from "@/lib/progress/supervised-intent";
import { selectSupervisedPath } from "@/lib/progress/supervised-path";
import { selectSupervisedPortion } from "@/lib/progress/supervised-portion";
import { selectSupervisedChild } from "@/lib/progress/supervised";
import {
  selectSupervisedBrain,
  writeSupervisedBrain,
} from "@/lib/progress/supervised-brain";

export const dynamic = "force-dynamic";

function publicBrain(evidence: ReturnType<typeof selectSupervisedBrain>) {
  return {
    ok: true,
    fr: evidence.fr,
    distribute: evidence.distribute,
    launch: evidence.launch,
    selected_child_id: evidence.selected_child_id,
    selected: evidence.selected,
    children: evidence.children.map((child) => ({
      id: child.id,
      name: child.name,
      kind: child.kind,
      login: child.login,
      user: child.user,
    })),
  };
}

function boundHint(childId: string | null) {
  const intent = selectSupervisedIntent(childId);
  const path = selectSupervisedPath(childId);
  const portion = selectSupervisedPortion(childId, {
    pathItems: path.selected?.items || [],
    horizon: intent.selected?.timeHorizon || "",
    name: path.selected?.name || intent.selected?.name,
  });
  const progress = selectSupervisedChild(childId);
  return {
    intent: intent.selected
      ? {
          goals: intent.selected.goals,
          subjects: intent.selected.subjects,
          themes: intent.selected.themes,
          timeHorizon: intent.selected.timeHorizon,
          constraints: intent.selected.constraints,
          name: intent.selected.name,
        }
      : undefined,
    pathItems: path.selected?.items || [],
    portion: portion.selected
      ? { horizon: portion.selected.horizon, items: portion.selected.items }
      : undefined,
    progress: progress.selected
      ? {
          now: progress.selected.now,
          confidence: progress.selected.confidence,
          next: progress.selected.next,
        }
      : undefined,
    name: path.selected?.name || intent.selected?.name || progress.selected?.name,
  };
}

export async function GET(request: Request) {
  const childId = new URL(request.url).searchParams.get("child");
  return NextResponse.json(publicBrain(selectSupervisedBrain(childId, boundHint(childId))));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const childId = String(body.child || body.child_id || "").trim();
  const action = String(body.action || body.op || "").trim();
  const hint = boundHint(childId);
  const written = writeSupervisedBrain(childId, action, {
    ...hint,
    title: typeof body.title === "string" ? body.title : undefined,
    sources: body.sources,
    notes: body.notes,
  });
  if (!written.ok) {
    return NextResponse.json({ ok: false, error: written.error }, { status: 400 });
  }
  return NextResponse.json({
    ...publicBrain(selectSupervisedBrain(childId, hint)),
    selected: written.selected,
  });
}
