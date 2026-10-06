import { NextResponse } from "next/server";
import { refuse, signedIn, unavailable } from "@/lib/assessments/actor";
import { WIZARD_COPY, wizardRefusal } from "@/lib/assessments/model";
import { wizardOverview } from "@/lib/assessments/store";
import { loadAdultProfile } from "@/lib/profile/store";

export const dynamic = "force-dynamic";

/** The three tracks, each with its open run or latest placements, plus the profile gate state. */
export async function GET(request: Request) {
  try {
    const auth = await signedIn(request);
    if (!auth.ok) return auth.response;
    const refusal = wizardRefusal(auth.actor, null);
    if (refusal) return refuse(403, refusal);
    const tracks = await wizardOverview(auth.actor.owner);
    const profile = await loadAdultProfile(auth.actor.owner);
    const personalityRefusal = wizardRefusal(auth.actor, "personality");
    return NextResponse.json({
      ok: true,
      copy: WIZARD_COPY,
      tracks: tracks.map((track) => ({
        ...track,
        refusal: track.track === "personality" ? personalityRefusal : null,
      })),
      setup: profile.setup,
    });
  } catch (error) {
    return unavailable(error);
  }
}
