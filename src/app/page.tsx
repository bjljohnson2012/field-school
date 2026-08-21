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

export default function Campus() {
  const router = useRouter();
  const { guest } = usePortal();

  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-16">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Field School University
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              One campus. Many courses. Same ladder.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Field School is the company. This university is the portal for the
              courses. Pull in a tape, walk the stations, keep a dashboard —
              or start as a guest and share a normal link.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#catalog"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                Open the catalog
                <ArrowRight className="size-4" />
              </a>
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
            </div>
          </div>
          <CampusLadder />
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
            body="Assignments assume you may not have the paid tool yet. You still name the job, map the logins, and write the brief."
          />
          <PassCard
            n="03"
            title="Clear the quiz"
            body="75% on each station, 80% on the exam. A Field School University certificate needs the whole ladder plus the exam."
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
          Each course is a staff you can actually run: tape, stations, desk,
          exam. Share a normal path —{" "}
          <span className="text-foreground">/c/grok-bot</span> — and anyone can
          start as a guest.
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
