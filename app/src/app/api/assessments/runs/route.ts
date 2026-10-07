import { NextResponse } from "next/server";
import { readJson, refuse, signedIn, unavailable } from "@/lib/assessments/actor";
import { parseTrack, wizardRefusal } from "@/lib/assessments/model";
import { openRun } from "@/lib/assessments/store";

export const dynamic = "force-dynamic";

/** Starts a track, or resumes the open run for it from any device. */
export async function POST(request: Request) {
  try {
    const auth = await signedIn(request);
    if (!auth.ok) return auth.response;
    const json = await readJson(request);
    if (!json.ok) return refuse(400, "invalid_json");
    const track = parseTrack(json.body);
    if (!track) return refuse(400, "track_unknown");
    const refusal = wizardRefusal(auth.actor, track);
    if (refusal) return refuse(403, refusal);
    return NextResponse.json({ ok: true, run: await openRun(auth.actor.owner, track) });
  } catch (error) {
    return unavailable(error);
  }
}
