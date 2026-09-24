import { NextResponse } from "next/server";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { writeCoachingAudit } from "@/lib/coaching/audit";
import { isResponse, jsonError, readJson } from "../tasks/session";
import { loadLibraryCoach } from "./access";
import { LibraryError, createRepo, createUnit, listLibrary } from "./library";
import { isRepoKind, isUnitStatus, isUuid } from "./visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  try {
    const library = await listLibrary(loaded.actor.orgId);
    return NextResponse.json({ ok: true, name: loaded.name, ...library });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}

export async function POST(request: Request) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const loaded = await loadLibraryCoach(request);
  if (!loaded.ok) return loaded.response;
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const type = body.type === "repo" || body.type === "article" ? body.type : "";
  if (!type) return jsonError("invalid_body", 400);
  try {
    if (type === "repo") {
      const repoKind = typeof body.repoKind === "string" ? body.repoKind.trim().toUpperCase() : "";
      const name = typeof body.name === "string" ? body.name : "";
      if (!isRepoKind(repoKind)) return jsonError("invalid_body", 400);
      const repo = await createRepo({
        orgId: loaded.actor.orgId,
        repoKind,
        name,
        visibility: body.visibility,
      });
      return NextResponse.json({ ok: true, repo });
    }
    const repositoryId = typeof body.repositoryId === "string" ? body.repositoryId.trim() : "";
    const title = typeof body.title === "string" ? body.title : "";
    const articleBody = typeof body.body === "string" ? body.body : "";
    const status = typeof body.status === "string" ? body.status : "pending";
    if (!isUuid(repositoryId) || !isUnitStatus(status)) return jsonError("invalid_body", 400);
    const created = await createUnit({
      orgId: loaded.actor.orgId,
      repositoryId,
      authorMembershipId: loaded.actor.membershipId,
      title,
      body: articleBody,
      tags: body.tags,
      visibility: body.visibility,
      status,
    });
    if (created.approved) {
      await writeCoachingAudit({
        orgId: loaded.actor.orgId,
        actorMembershipId: loaded.actor.membershipId,
        action: "coaching_knowledge.approve",
        targetType: "coaching_knowledge_unit",
        targetId: created.unit.id,
        metadata: { status: "approved", visibility: created.unit.visibility },
      });
    }
    return NextResponse.json({ ok: true, unit: created.unit });
  } catch (error) {
    if (error instanceof LibraryError) return jsonError(error.code, error.status);
    if (error instanceof DatabaseUnavailableError) return jsonError("database_unavailable", 503);
    throw error;
  }
}
