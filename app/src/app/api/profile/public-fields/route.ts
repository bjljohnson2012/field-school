import { NextResponse } from "next/server";
import { adultOnly, readJson, refuse, unavailable } from "@/lib/assessments/actor";
import { sanitizePublicPatch } from "@/lib/profile/public";
import { loadEditorFields, saveEditorFields } from "@/lib/profile/public-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    const fields = await loadEditorFields(auth.actor.owner.memberId);
    if (!fields) return refuse(404, "profile_missing");
    return NextResponse.json({ ok: true, fields });
  } catch (error) {
    return unavailable(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    const json = await readJson(request);
    if (!json.ok) return refuse(400, "invalid_json");
    const current = await loadEditorFields(auth.actor.owner.memberId);
    if (!current) return refuse(404, "profile_missing");
    const clean = sanitizePublicPatch(json.body, {
      skills: current.skills.map((skill) => skill.name),
      projects: current.projects.map((project) => ({ name: project.name, link: project.link })),
    });
    if (!clean.ok) return refuse(400, clean.error);
    const fields = await saveEditorFields(auth.actor.owner.memberId, clean.patch);
    return NextResponse.json({ ok: true, fields });
  } catch (error) {
    return unavailable(error);
  }
}
