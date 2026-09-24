"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CampusLadder } from "@/components/campus-ladder";
import { ShareLink } from "@/components/share-link";
import { usePortal } from "@/hooks/use-portal";
import { listPublishedCourses } from "@/lib/course/catalog";
import { youtubePoster } from "@/lib/course/youtube";

const courses = listPublishedCourses();

export function CampusHome() {
  const router = useRouter();
  const { guest, ready, isStaff } = usePortal();

  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-16">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Field School training portal
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              Lead yourself. Learn yourself. Do the Work.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              This is the Field School training portal. AI. Sales. Go-to-market.
              Leadership. Small moves you can make with your family. Pull in a
              tape, walk the stations, keep a dashboard, or start as a guest
              and share a normal link.
            </p>
            <div className="mt-8">
              <Link
                href="/c/grok-bot"
                onClick={() => guest()}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#1f5eff] px-5 text-sm font-medium text-white"
              >
                Start Grok Bot
                <ArrowRight className="size-4" />
              </Link>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Open the free campus course. Watch, work, and clear as a guest.
              </p>
            </div>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Three rails on this portal: campus ladder to start; Learn with Ben
              for LessonSpine, progress, and metering; Org for household and
              sales desks.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center rounded-xl border border-border bg-card px-5 text-sm"
              >
                Join free beta
              </Link>
              <button
                type="button"
                onClick={() => {
                  guest();
                  router.push("/c/grok-bot");
                }}
                className="inline-flex h-12 items-center rounded-xl border border-border bg-card px-5 text-sm"
              >
                Continue as guest
              </button>
              {ready && isStaff ? (
                <>
                  <Link
                    href="/admin"
                    className="inline-flex h-12 items-center rounded-xl border border-border bg-card px-5 text-sm"
                  >
                    Admin
                  </Link>
                  <Link
                    href="/admin/demo"
                    className="inline-flex h-12 items-center rounded-xl border border-border bg-card px-5 text-sm"
                  >
                    Student demo
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <CampusLadder />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Learn with Ben
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/play/lesson-spine"
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm text-muted-foreground"
              >
                LessonSpine
              </Link>
              <Link
                href="/progress"
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm text-muted-foreground"
              >
                Progress
              </Link>
              <Link
                href="/metering"
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm text-muted-foreground"
              >
                Metering
              </Link>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Org
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href="/o/household" className="text-muted-foreground hover:text-foreground">
                Household
              </Link>
              <Link href="/o/sales" className="text-muted-foreground hover:text-foreground">
                Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
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

      <section id="catalog" className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Catalog
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">
          Current courses
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Each course is a staff you can run: tape, stations, desk, exam. Share
          a normal path like /c/grok-bot. Guests can start.
        </p>
        <div className="mt-6">
          <ShareLink path="/c/grok-bot" label="Copy catalog link" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-secondary/40"
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
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {c.kicker || `${c.stationCount} stations`}
                </p>
                <h3 className="mt-1 font-display text-2xl tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.tagline}
                </p>
                <p className="mt-4 inline-flex h-11 items-center gap-2 text-sm">
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
    <article className="rounded-xl border border-border bg-card px-5 py-5">
      <p className="font-mono text-xs text-muted-foreground">{n}</p>
      <h3 className="mt-2 font-display text-2xl tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}
