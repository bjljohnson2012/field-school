import { NextResponse } from "next/server";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { canAssign, subjectAllowed } from "./access";
import { TaskError, createTask, listTasks, loadAssigneeChoices } from "./persist";
import { isResponse, jsonError, loadTaskActor, readJson } from "./session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function dueAtOf(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "invalid" as const;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "invalid" as const;
  return date;
}

export async function GET(request: Request) {
  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const tasks = await listTasks(loaded.world, loaded.actor);
  const assignees = await loadAssigneeChoices(loaded.world, loaded.actor);
  return NextResponse.json({ ok: true, tasks, assignees });
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadTaskActor(request);
  if (!loaded.ok) return jsonError(loaded.error, loaded.status);
  const body = await readJson(request);
  if (isResponse(body)) return body;

  const title = text(body.title);
  const assigneeMembershipId = text(body.assigneeMembershipId) || loaded.actor.membershipId;
  const subjectRaw = body.subjectMembershipId;
  const subjectMembershipId =
    subjectRaw == null || subjectRaw === "" ? null : text(subjectRaw);
  if (!title || (subjectRaw != null && subjectRaw !== "" && !subjectMembershipId)) {
    return jsonError("invalid_body", 400);
  }
  if (!canAssign(loaded.world, loaded.actor, assigneeMembershipId)) {
    return jsonError("forbidden", 403);
  }
  if (!subjectAllowed(loaded.world, loaded.actor.orgId, subjectMembershipId)) {
    return jsonError("invalid_subject", 400);
  }
  const dueAt = dueAtOf(body.dueAt);
  if (dueAt === "invalid") return jsonError("invalid_body", 400);
  const description = text(body.body);
  try {
    const task = await createTask(loaded.world, loaded.actor, {
      title,
      body: description || null,
      assigneeMembershipId,
      subjectMembershipId,
      dueAt,
    });
    return NextResponse.json({ ok: true, task });
  } catch (error) {
    if (error instanceof TaskError) return jsonError(error.code, error.status);
    throw error;
  }
}
