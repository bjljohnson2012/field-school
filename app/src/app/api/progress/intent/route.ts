import { NextResponse } from "next/server";
import { syncHirePathBrain } from "@/lib/progress/hire-path-brain-sync";
import {
  parseSupervisedIntentFields,
  selectSupervisedIntent,
  writeSupervisedIntent,
} from "@/lib/progress/supervised-intent";

export const dynamic = "force-dynamic";

function publicIntent(evidence: ReturnType<typeof selectSupervisedIntent>) {
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

export async function GET(request: Request) {
  const childId = new URL(request.url).searchParams.get("child");
  return NextResponse.json(publicIntent(selectSupervisedIntent(childId)));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const childId = String(body.child || body.child_id || "").trim();
  const written = writeSupervisedIntent(childId, parseSupervisedIntentFields(body));
  if (!written.ok) {
    return NextResponse.json({ ok: false, error: written.error }, { status: 400 });
  }
  syncHirePathBrain(childId);
  return NextResponse.json({
    ...publicIntent(selectSupervisedIntent(childId)),
    selected: written.selected,
  });
}
