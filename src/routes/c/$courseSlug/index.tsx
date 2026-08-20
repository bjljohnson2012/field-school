import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { CourseFeedback } from "@/components/course-feedback";
import { GuestBanner } from "@/components/guest-banner";
import { ShareCourseButton } from "@/components/share-course-button";
import { SiteHeader } from "@/components/site-header";
import { YoutubeClip } from "@/components/youtube-clip";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { usePublishedCourse } from "@/lib/course/use-course";
import { useCourseProgress } from "@/lib/course/use-progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/c/$courseSlug/")({
  component: CourseHome,
});

function CourseHome() {
  const { courseSlug } = Route.useParams();
  const course = usePublishedCourse(courseSlug);
  const user = useCurrentUser();
  const { map, passedCount, total, exam, certified } = useCourseProgress(
    course ?? null,
  );

  if (course === undefined) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted">
          Loading course…
        </div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-xl px-4 py-16">
          <h1 className="font-display text-3xl">Course not published</h1>
          <p className="mt-3 text-muted">
            It may still be a draft in the office, or the slug is wrong.
          </p>
          <Link
            to="/"
            className="md-interactive mt-6 inline-flex h-11 items-center rounded-xl px-2 text-sm"
          >
            Back to campus
          </Link>
        </main>
      </div>
    );
  }

  const first = course.modules[0];

  return (
    <div className="min-h-dvh">
      <SiteHeader course={course} passed={passedCount} total={total} />
      <GuestBanner />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {course.kicker || "Course"} · {course.modules.length} stations · exam
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              {course.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {course.tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {first ? (
                <Link
                  to="/c/$courseSlug/s/$slug"
                  params={{ courseSlug: course.slug, slug: first.slug }}
                  className="md-interactive inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg"
                >
                  Start station 01
                  <ArrowRight className="size-4" />
                </Link>
              ) : null}
              <a
                href="#ladder"
                className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
              >
                See the ladder
              </a>
              <ShareCourseButton slug={course.slug} title={course.title} />
            </div>
          </div>
        </section>

        {course.videoId ? (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Source tape
            </p>
            <h2 className="mt-1 font-display text-3xl tracking-tight">
              The full stream
            </h2>
            <div className="mt-6">
              <YoutubeClip
                videoId={course.videoId}
                full
                label={course.videoTitle || course.title}
                why={course.kicker}
              />
            </div>
          </section>
        ) : null}

        <section id="ladder" className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-display text-3xl tracking-tight">The ladder</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Watch the clip, finish the required field work, score 75% on the
            station quiz. Then {Math.ceil(10 * course.examPassRatio)}/
            {course.examQuestions.length || 10} on the exam.
          </p>
          <ol className="mt-8 grid gap-3">
            {course.modules.map((mod) => {
              const p = map[mod.slug];
              return (
                <li key={mod.slug}>
                  <Link
                    to="/c/$courseSlug/s/$slug"
                    params={{ courseSlug: course.slug, slug: mod.slug }}
                    className={cn(
                      "md-interactive md-card flex flex-col gap-2 rounded-xl border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                      p?.passed && "border-pass/40",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-xs tabular-nums text-muted">
                        Station {mod.station} · {mod.durationLabel}
                      </p>
                      <h3 className="mt-1 font-display text-xl tracking-tight">
                        {mod.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{mod.kicker}</p>
                    </div>
                    <span className="inline-flex h-11 shrink-0 items-center gap-2 text-sm">
                      {p?.passed ? (
                        <>
                          <Check className="size-4 text-pass" />
                          <span className="text-pass">Passed</span>
                        </>
                      ) : (
                        <>
                          Open
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/c/$courseSlug/desk"
              params={{ courseSlug: course.slug }}
              className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
            >
              Build your share desk
            </Link>
            <Link
              to="/c/$courseSlug/exam"
              params={{ courseSlug: course.slug }}
              className="md-interactive inline-flex h-12 items-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg"
            >
              {exam?.passed ? "Exam passed" : "Take the exam"}
            </Link>
            {certified ? (
              <Link
                to="/c/$courseSlug/certificate"
                params={{ courseSlug: course.slug }}
                className="md-interactive inline-flex h-12 items-center rounded-xl border border-pass/40 px-5 text-sm text-pass"
              >
                View certificate
              </Link>
            ) : null}
          </div>

          {certified && user ? (
            <div className="mt-8">
              <CourseFeedback courseSlug={course.slug} />
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
