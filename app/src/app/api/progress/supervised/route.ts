import { NextResponse } from "next/server";
import { selectSupervisedChild } from "@/lib/progress/supervised";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const childId = new URL(request.url).searchParams.get("child");
  const evidence = selectSupervisedChild(childId);
  return NextResponse.json({
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
  });
}
