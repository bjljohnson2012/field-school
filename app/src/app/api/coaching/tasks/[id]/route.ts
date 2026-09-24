import { NextResponse } from "next/server";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { isTaskStatus } from "../access";
import { TaskError, setTaskStatus } from "../persist";
import { isResponse, jsonError, loadTaskActor, readJson } from "../session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const { id } = await context.params;
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const status = typeof body.status === "string" ? body.status : "";
  if (!isTaskStatus(status)) return jsonError("invalid_body", 400);
  try {
    const task = await setTaskStatus(loaded.world, loaded.actor, id, status);
    return NextResponse.json({ ok: true, task });
  } catch (error) {
    if (error instanceof TaskError) return jsonError(error.code, error.status);
    throw error;
  }
}
