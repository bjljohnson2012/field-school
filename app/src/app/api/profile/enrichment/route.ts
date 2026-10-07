import { NextResponse } from "next/server";
import { adultOnly, readJson, refuse, unavailable } from "@/lib/assessments/actor";
import { isUuid } from "@/lib/enrichment/model";
import { enrichmentView, removeItem } from "@/lib/enrichment/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    return NextResponse.json({ ok: true, view: await enrichmentView(auth.actor.owner) });
  } catch (error) {
    return unavailable(error);
  }
}

/** Takes a skill, project, or imported line off the User's own profile. Catalog rows stay. */
export async function DELETE(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    const json = await readJson(request);
    if (!json.ok || typeof json.body !== "object" || json.body === null) return refuse(400, "invalid_json");
    const kind = Object.getOwnPropertyDescriptor(json.body, "kind")?.value;
    const id = Object.getOwnPropertyDescriptor(json.body, "id")?.value;
    if ((kind !== "skill" && kind !== "project" && kind !== "entry") || !isUuid(id)) return refuse(400, "item_invalid");
    return NextResponse.json({ ok: true, view: await removeItem(auth.actor.owner, kind, id) });
  } catch (error) {
    return unavailable(error);
  }
}
