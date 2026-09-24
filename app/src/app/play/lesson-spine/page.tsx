import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { LessonSpineGuestSoftPanel } from "@/components/lesson-spine-guest-soft-panel";
import { LessonSpineHirePath } from "@/components/lesson-spine-hire-path";
import { LessonSpineParentSession } from "@/components/lesson-spine-parent-session";
import { LessonSpinePlayer, LessonSpineRailHydrate } from "@/components/lesson-spine-player";
import { LessonSpineRemotionPreview } from "@/components/lesson-spine-remotion-player";

export const metadata: Metadata = {
  title: "LessonSpine",
  description: "Play the locked Field School LessonSpine master in campus.",
};

export default async function LessonSpinePlayPage() {
  const session = await auth().catch(() => null);
  const signedIn = Boolean(session?.user?.email);
  return (
    <main data-plate className="mx-auto max-w-6xl px-6 py-8">
      <p className="eyebrow">Learn with Ben · filmed lesson</p>
      <h1 className="h-page mt-2">LessonSpine</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Ready / HLS play of the locked counterexample-encode master. The HTML5
        rail stays. A Remotion player previews the LessonSpine composition for
        the household and the sales desk. A signed-in play writes the next
        LessonSpine step into the living brain for the person already on the
        desk. A signed-in open continues at that living-brain next step. Guests
        still play and do not write. The child has no login. Launch stays closed.
        Distribute held.
      </p>
      <p
        className="mt-2 font-mono text-xs text-muted-foreground"
        data-master-cite="af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4"
      >
        sha256 af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4
      </p>
      <LessonSpineGuestSoftPanel />
      <LessonSpineParentSession />
      <LessonSpineHirePath />
      <LessonSpineRailHydrate
        signedIn={signedIn}
        html5={
          <div className="mt-8">
            <LessonSpinePlayer />
          </div>
        }
        preview={<LessonSpineRemotionPreview />}
      />
      <p className="mt-6 text-sm text-muted-foreground">
        Guest Grok Bot stays at{" "}
        <Link href="/c/grok-bot" className="underline">
          /c/grok-bot
        </Link>
        . Source dest is archived untouched.
      </p>
    </main>
  );
}
