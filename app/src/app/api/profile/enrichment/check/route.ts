import { NextResponse } from "next/server";
import { adultOnly, readJson, refuse, unavailable } from "@/lib/assessments/actor";
import { parseNameCheck } from "@/lib/enrichment/model";
import { checkName } from "@/lib/enrichment/store";

export const dynamic = "force-dynamic";

/** As the User types: is this name already in the system, and what is close to it. */
export async function POST(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    const json = await readJson(request);
    if (!json.ok) return refuse(400, "invalid_json");
    const query = parseNameCheck(json.body);
    if (!query) return refuse(400, "name_invalid");
    return NextResponse.json({ ok: true, check: await checkName(auth.actor.owner, query.kind, query.name) });
  } catch (error) {
    return unavailable(error);
  }
}
