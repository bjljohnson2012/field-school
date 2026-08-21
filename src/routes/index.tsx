import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CampusHeroArt } from "@/components/campus-hero-art";
import { SiteHeader } from "@/components/site-header";
import { listPublishedCourses } from "@/lib/course/catalog";
import { COMPANY_NAME, UNI_NAME, type CourseSummary } from "@/lib/course/types";
import { youtubePoster } from "@/lib/course/youtube";

export const Route = createFileRoute("/")({ component: Campus });

function Campus() {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);

  useEffect(() => {
    listPublishedCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-16">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {UNI_NAME}
              </p>
              <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">
                {COMPANY_NAME}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                Upskill for the future with AI, self-paced courses, and
                consistent tracking. {UNI_NAME} is the portal — watch the clip,
                do the field work, clear the exam.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#catalog"
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-accent-fg"
                >
                  Open the catalog
                  <ArrowRight className="size-4" />
                </a>
                <Link
                  to="/about"
                  className="inline-flex h-12 items-center rounded-md border border-border px-5 text-sm text-fg"
                >
                  About us
                </Link>
              </div>
            </div>
            <CampusHeroArt />
          </div>
        </section>

        <section className="border-b border-border bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
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
              body="75% on each station, 80% on the exam. Certificate needs the whole ladder plus the exam."
            />
          </div>
        </section>

        <section id="catalog" className="mx-auto max-w-6xl px-4 py-14">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Catalog
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">
            Current courses
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Each course is a staff you can actually run: tape, stations, desk,
            exam. New ones are built in the office from a YouTube URL and
            context.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {courses === null ? (
              <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted">No published courses yet.</p>
            ) : (
              courses.map((c) => (
                <Link
                  key={c.slug}
                  to="/c/$courseSlug"
                  params={{ courseSlug: c.slug }}
                  className="group overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:bg-raised"
                >
                  <div className="relative aspect-[16/8] bg-raised">
                    {c.videoId ? (
                      <img
                        src={youtubePoster(c.videoId)}
                        alt=""
                        className="h-full w-full object-cover opacity-80"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      {c.kicker || `${c.stationCount} stations`}
                    </p>
                    <h3 className="mt-1 font-display text-2xl tracking-tight">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {c.tagline}
                    </p>
                    <p className="mt-4 inline-flex h-11 items-center gap-2 text-sm">
                      Enter
                      <ArrowRight className="size-4" />
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
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
    <article>
      <p className="font-mono text-xs text-muted">{n}</p>
      <h3 className="mt-2 font-display text-2xl tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </article>
  );
}
