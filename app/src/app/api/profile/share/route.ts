import { NextResponse } from "next/server";
import { adultOnly, readJson, refuse, unavailable } from "@/lib/assessments/actor";
import { shareMintStatus } from "@/lib/profile/share";
import { setShare } from "@/lib/profile/public-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    if (shareMintStatus(auth.actor.kind) === 403) return refuse(403, "child_cannot_share");
    const json = await readJson(request);
    if (!json.ok) return refuse(400, "invalid_json");
    const action = json.body && typeof json.body === "object" ? (json.body as { action?: unknown }).action : null;
    if (action !== "enable" && action !== "revoke") return refuse(400, "action_invalid");
    const sharing = await setShare(auth.actor.owner.memberId, action, []);
    return NextResponse.json({ ok: true, ...sharing });
  } catch (error) {
    return unavailable(error);
  }
}
