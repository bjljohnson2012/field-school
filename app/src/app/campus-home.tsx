"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CampusLadder } from "@/components/campus-ladder";
import { ShareLink } from "@/components/share-link";
import { buttonVariants } from "@/components/ui/button";
import { usePortal } from "@/hooks/use-portal";
import { listPublishedCourses } from "@/lib/course/catalog";
import { youtubePoster } from "@/lib/course/youtube";
import { cn } from "@/lib/utils";

const courses = listPublishedCourses();

const outlineLink = cn(buttonVariants({ variant: "outline" }), "h-12");

export function CampusHome() {
  const router = useRouter();
  const { guest, ready, isStaff } = usePortal();

  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-10">
          <div>
            <p className="eyebrow">Field School training portal</p>
            <h1 className="h-page mt-3 text-4xl sm:text-5xl">
              Lead yourself. Learn yourself. Do the Work.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              This is the Field School training portal. AI. Sales. Go-to-market.
              Leadership. Small moves you can make with your family. Pull in a
              tape, walk the stations, keep a dashboard, or start as a guest
              and share a normal link.
            </p>
            <div className="mt-6">
              <Link
                href="/c/grok-bot"
                onClick={() => guest()}
                className="inline-flex items-center gap-2 rounded-brand bg-[#1f5eff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-brand hover:-translate-y-px hover:shadow-card-hover"
              >
                Start Grok Bot
                <ArrowRight className="size-4" />
              </Link>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Open the free campus course. Watch, work, and clear as a guest.
              </p>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Three rails on this portal: campus ladder to start; Learn with Ben
              for LessonSpine, progress, and metering; Org for household and
              sales desks.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/signup" className={outlineLink}>
                Join free beta
              </Link>
              <button
                type="button"
                onClick={() => {
                  guest();
                  router.push("/c/grok-bot");
                }}
                className={outlineLink}
              >
                Continue as guest
              </button>
              {ready && isStaff ? (
                <>
                  <Link href="/admin" className={outlineLink}>
                    Admin
                  </Link>
                  <Link href="/admin/demo" className={outlineLink}>
                    Student demo
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <CampusLadder />
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <div>
            <p className="eyebrow">Learn with Ben</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/play/lesson-spine"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                LessonSpine
              </Link>
              <Link
                href="/progress"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Progress
              </Link>
              <Link
                href="/metering"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Metering
              </Link>
            </div>
          </div>
          <div className="mt-6">
            <p className="eyebrow">Org</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href="/o/household" className="text-foreground underline underline-offset-[3px]">
                Household
              </Link>
              <Link href="/o/sales" className="text-foreground underline underline-offset-[3px]">
                Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-8 md:grid-cols-3">
          <PassCard
            n="01"
            title="Watch the clip"
            body="Every station points at the minutes that actually teach it. Credit for watching, not scrolling."
          />
          <PassCard
            n="02"
            title="Do the field work"
            body="Assignments assume you may not have the paid tool yet. You still name the work, map the logins, and write the brief."
          />
          <PassCard
            n="03"
            title="Clear the quiz and exam"
            body="Score 75% on each station quiz. Score 8/10 on the exam. A Field School certificate needs the whole ladder plus the exam."
          />
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-6xl px-6 py-8">
        <p className="eyebrow">Catalog</p>
        <h2 className="h-section mt-2 text-3xl">Current courses</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Each course is a staff you can run: tape, stations, desk, exam. Share
          a normal path like /c/grok-bot. Guests can start.
        </p>
        <div className="mt-5">
          <ShareLink path="/c/grok-bot" label="Copy catalog link" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className="group overflow-hidden rounded-card border border-border bg-card shadow-card transition-all duration-200 ease-brand hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover"
            >
              <div className="relative aspect-[16/8] bg-secondary">
                {c.videoId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={youtubePoster(c.videoId)}
                    alt=""
                    className="h-full w-full object-cover opacity-80"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              </div>
              <div className="px-4 py-4">
                <p className="eyebrow">{c.kicker || `${c.stationCount} stations`}</p>
                <h3 className="h-card mt-1">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.tagline}
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-[3px]">
                  Enter
                  <ArrowRight className="size-4" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function PassCard({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-card border border-border bg-card px-5 py-5 shadow-card">
      <p className="font-mono text-xs text-muted-foreground">{n}</p>
      <h3 className="h-card mt-2">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}
