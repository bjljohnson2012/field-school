import { NextResponse } from "next/server";
import { countOpenTasks } from "../persist";
import { jsonError, loadTaskActor } from "../session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const count = await countOpenTasks(loaded.actor.orgId, loaded.actor.membershipId);
  return NextResponse.json({ ok: true, count });
}
