import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ShareCourseButton } from "@/components/share-course-button";
import { SiteHeader } from "@/components/site-header";
import { listPublishedCourses } from "@/lib/course/catalog";
import { UNI_NAME, type CourseSummary } from "@/lib/course/types";
import { youtubePoster } from "@/lib/course/youtube";
import { markGuest } from "@/lib/guest";

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
                One campus. Many courses. Same ladder.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                Pull in a source tape and a briefing. The office builds stations,
                clips, field work, and an exam. Walk any published course as a
                guest, or sign in to keep progress.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#catalog"
                  className="md-interactive inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg"
                >
                  Open the catalog
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="#catalog"
                  className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm text-fg"
                  onClick={() => markGuest()}
                >
                  Continue as guest
                </a>
                <Link
                  to="/office"
                  className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm text-fg"
                >
                  Dean’s office
                </Link>
              </div>
            </div>
            <div className="md-interactive md-card relative overflow-hidden rounded-xl border border-border">
              <img
                src="/hero.jpg"
                alt="Operations desk for Johnson Field School University"
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface/40">
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
            exam. Share the link with anyone — they can start as a guest.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {courses === null ? (
              <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted">No published courses yet.</p>
            ) : (
              courses.map((c) => (
                <article
                  key={c.slug}
                  className="md-interactive md-card group relative overflow-hidden rounded-xl border border-border bg-surface"
                >
                  <Link
                    to="/c/$courseSlug"
                    params={{ courseSlug: c.slug }}
                    className="block"
                  >
                    <div className="relative aspect-[16/8] bg-raised">
                      {c.videoId ? (
                        <img
                          src={youtubePoster(c.videoId)}
                          alt=""
                          className="h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-[1.03]"
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
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </Link>
                  <div className="absolute top-3 right-3 z-10">
                    <ShareCourseButton
                      slug={c.slug}
                      title={c.title}
                      compact
                      className="bg-bg/80"
                    />
                  </div>
                </article>
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
    <article className="md-interactive md-card rounded-xl border border-border bg-surface px-5 py-5">
      <p className="font-mono text-xs text-muted">{n}</p>
      <h3 className="mt-2 font-display text-2xl tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </article>
  );
}
