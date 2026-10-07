import { NextResponse } from "next/server";
import { adultOnly, readJson, refuse, unavailable } from "@/lib/assessments/actor";
import { parseSkillInput } from "@/lib/enrichment/model";
import { addSkill } from "@/lib/enrichment/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    const json = await readJson(request);
    if (!json.ok) return refuse(400, "invalid_json");
    const input = parseSkillInput(json.body);
    if (!input) return refuse(400, "skill_invalid");
    const result = await addSkill(auth.actor.owner, input);
    if (result.ok) return NextResponse.json({ ok: true, view: result.view });
    if (result.error === "already_in_system") {
      return NextResponse.json({ ok: false, error: result.error, existing: result.existing }, { status: 409 });
    }
    return refuse(404, result.error);
  } catch (error) {
    return unavailable(error);
  }
}
