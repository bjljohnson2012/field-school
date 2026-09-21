import { NextResponse } from "next/server";
import { selectSupervisedIntent } from "@/lib/progress/supervised-intent";
import { selectSupervisedPath } from "@/lib/progress/supervised-path";
import {
  selectSupervisedPortion,
  writeSupervisedPortion,
} from "@/lib/progress/supervised-portion";

export const dynamic = "force-dynamic";

function publicPortion(evidence: ReturnType<typeof selectSupervisedPortion>) {
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
  const path = selectSupervisedPath(childId);
  const intent = selectSupervisedIntent(childId);
  return {
    pathItems: path.selected?.items || [],
    horizon: intent.selected?.timeHorizon || "",
    name: path.selected?.name || intent.selected?.name,
  };
}

export async function GET(request: Request) {
  const childId = new URL(request.url).searchParams.get("child");
  return NextResponse.json(publicPortion(selectSupervisedPortion(childId, boundHint(childId))));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const childId = String(body.child || body.child_id || "").trim();
  const action = String(body.action || body.op || "").trim();
  const hint = boundHint(childId);
  const written = writeSupervisedPortion(childId, action, {
    ...hint,
    items: body.items,
  });
  if (!written.ok) {
    return NextResponse.json({ ok: false, error: written.error }, { status: 400 });
  }
  return NextResponse.json({
    ...publicPortion(selectSupervisedPortion(childId, hint)),
    selected: written.selected,
  });
}
