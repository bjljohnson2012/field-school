import { NextResponse } from "next/server";
import { adultOnly, readJson, refuse, unavailable } from "@/lib/assessments/actor";
import { parseAcceptance } from "@/lib/enrichment/model";
import { acceptImport } from "@/lib/enrichment/store";

export const dynamic = "force-dynamic";

/** Saves only the reviewed items the User accepted, stamped with the source and today's date. */
export async function POST(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    const json = await readJson(request);
    if (!json.ok) return refuse(400, "invalid_json");
    const accepted = parseAcceptance(json.body);
    if (!accepted) return refuse(400, "import_invalid");
    const result = await acceptImport(auth.actor.owner, accepted.profileUrl, accepted.items);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return unavailable(error);
  }
}
