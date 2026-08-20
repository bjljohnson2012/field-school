import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CampusHeroArt } from "@/components/campus-hero-art";
import { GuestContinueDialog } from "@/components/guest-continue-dialog";
import { ShareCourseButton } from "@/components/share-course-button";
import { SiteHeader } from "@/components/site-header";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { getMyLearning } from "@/lib/course/campus";
import { listPublishedCourses } from "@/lib/course/catalog";
import { UNI_NAME, type CourseSummary } from "@/lib/course/types";
import { youtubePoster } from "@/lib/course/youtube";
import { markGuest } from "@/lib/guest";

type Learning = Awaited<ReturnType<typeof getMyLearning>>;

/**
 * Course-card banner. Admins pick the style per course in the edit page:
 * a video poster ("video"), an accent strip ("gradient"), or nothing ("none").
 */
function CourseCardBanner({ course }: { course: CourseSummary }) {
  if (course.bannerStyle === "none") return null;
  if (course.bannerStyle === "gradient" || !course.videoId) {
    const from = course.bannerColor || "var(--color-accent)";
    return (
      <div
        className="h-14 w-full"
        style={{
          backgroundImage: `linear-gradient(120deg, ${from}, color-mix(in oklab, ${from} 55%, transparent))`,
        }}
      />
    );
  }
  return (
    <div className="relative aspect-[16/6] overflow-hidden bg-raised">
      <img
        src={youtubePoster(course.videoId)}
        alt=""
        className="h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent" />
    </div>
  );
}

export const Route = createFileRoute("/")({ component: Campus });

function Campus() {
  const user = useCurrentUser();
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [learning, setLearning] = useState<Learning | null>(null);
  const [guestOpen, setGuestOpen] = useState(false);

  useEffect(() => {
    listPublishedCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!user) {
      setLearning(null);
      return;
    }
    getMyLearning()
      .then(setLearning)
      .catch(() => setLearning([]));
  }, [user]);

  const resume = (learning ?? []).slice(0, 3);

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
                guest, or sign in with Google, X, or email to keep a dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#catalog"
                  className="md-interactive inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg"
                >
                  Open the catalog
                  <ArrowRight className="size-4" />
                </a>
                <button
                  type="button"
                  className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm text-fg"
                  onClick={() => setGuestOpen(true)}
                >
                  Continue as guest
                </button>
                <Link
                  to="/office"
                  className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm text-fg"
                >
                  Admin
                </Link>
              </div>
            </div>
            <CampusHeroArt />
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

        {user && resume.length > 0 ? (
          <section className="border-b border-border bg-surface/40">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    Resume learning
                  </p>
                  <h2 className="mt-1 font-display text-2xl tracking-tight">
                    What’s next for you
                  </h2>
                </div>
                <Link
                  to="/dashboard"
                  className="md-interactive inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted"
                >
                  All enrolled
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {resume.map((c) => (
                  <Link
                    key={c.slug}
                    to="/c/$courseSlug"
                    params={{ courseSlug: c.slug }}
                    className="md-interactive md-card rounded-xl border border-border bg-surface px-4 py-4"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate font-display text-lg tracking-tight">
                        {c.title}
                      </h3>
                      <span className="shrink-0 text-xs uppercase tracking-[0.12em] text-muted">
                        {c.certified
                          ? "Certified"
                          : c.examPassed
                            ? "Exam cleared"
                            : `${c.percent}%`}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${c.percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {c.completedStations}/{c.requiredStations} stations ·{" "}
                      {c.certified ? "done" : "resume"}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

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

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses === null ? (
              <div className="h-28 animate-pulse rounded-xl border border-border bg-surface" />
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted">No published courses yet.</p>
            ) : (
              courses.map((c) => (
                <article
                  key={c.slug}
                  className="md-interactive md-card group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface"
                >
                  <Link
                    to="/c/$courseSlug"
                    params={{ courseSlug: c.slug }}
                    className="flex flex-1 flex-col"
                  >
                    <CourseCardBanner course={c} />
                    <div className="flex flex-1 flex-col px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                        {c.kicker || `${c.stationCount} stations`}
                      </p>
                      <h3 className="mt-1 font-display text-lg leading-snug tracking-tight">
                        {c.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                        {c.tagline}
                      </p>
                      <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg">
                        Enter
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </Link>
                  <div className="absolute top-2.5 right-2.5 z-10">
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
      <GuestContinueDialog
        open={guestOpen}
        nextPath="/"
        onCancel={() => setGuestOpen(false)}
        onConfirm={() => {
          markGuest();
          setGuestOpen(false);
          document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
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
