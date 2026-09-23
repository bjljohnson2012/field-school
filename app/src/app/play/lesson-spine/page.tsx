import type { Metadata } from "next";
import Link from "next/link";
import { LessonSpineHirePath } from "@/components/lesson-spine-hire-path";
import { LessonSpineParentSession } from "@/components/lesson-spine-parent-session";
import { LessonSpinePlayer } from "@/components/lesson-spine-player";
import { LessonSpineRemotionPreview } from "@/components/lesson-spine-remotion-player";

export const metadata: Metadata = {
  title: "LessonSpine",
  description: "Play the locked Field School LessonSpine master in campus.",
};

export default function LessonSpinePlayPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Learn with Ben · filmed lesson
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">LessonSpine</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Ready / HLS play of the locked counterexample-encode master. The HTML5
        rail stays. A Remotion player previews the LessonSpine composition for
        the household and the sales desk. The child has no login. Launch stays
        closed. Distribute held.
      </p>
      <p
        className="mt-2 font-mono text-xs text-muted-foreground"
        data-master-cite="af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4"
      >
        sha256 af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4
      </p>
      <LessonSpineParentSession />
      <LessonSpineHirePath />
      <div className="mt-8">
        <LessonSpinePlayer />
      </div>
      <LessonSpineRemotionPreview />
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
