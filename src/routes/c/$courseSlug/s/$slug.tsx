import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AssignmentPanel } from "@/components/assignment-panel";
import { QuizPanel } from "@/components/quiz-panel";
import { SiteHeader } from "@/components/site-header";
import { YoutubeClip } from "@/components/youtube-clip";
import { emptyProgress } from "@/lib/course/content";
import { usePublishedCourse } from "@/lib/course/use-course";
import { useCourseProgress } from "@/lib/course/use-progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/c/$courseSlug/s/$slug")({
  component: StationPage,
});

function StationPage() {
  const { courseSlug, slug } = Route.useParams();
  const course = usePublishedCourse(courseSlug);
  const { map, markWatched, persistAssignment, persistQuiz, passedCount, total } =
    useCourseProgress(course ?? null);

  if (course === undefined) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted">
          Loading station…
        </div>
      </div>
    );
  }
  if (!course) return <Navigate to="/" />;

  const mod = course.modules.find((m) => m.slug === slug);
  if (!mod) return <Navigate to="/c/$courseSlug" params={{ courseSlug }} />;

  const idx = course.modules.findIndex((m) => m.slug === mod.slug);
  const prev = idx > 0 ? course.modules[idx - 1] : null;
  const next = idx < course.modules.length - 1 ? course.modules[idx + 1] : null;
  const progress = map[mod.slug] ?? emptyProgress();
  const passPct = Math.round(course.passRatio * 100);

  return (
    <div className="min-h-dvh">
      <SiteHeader course={course} passed={passedCount} total={total} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">
            Stations
          </p>
          <ol className="space-y-1">
            {course.modules.map((m) => {
              const done = map[m.slug]?.passed;
              return (
                <li key={m.slug}>
                  <Link
                    to="/c/$courseSlug/s/$slug"
                    params={{ courseSlug: course.slug, slug: m.slug }}
                    className={cn(
                      "flex h-10 items-center justify-between rounded-sm px-2 text-sm",
                      m.slug === mod.slug
                        ? "bg-raised text-fg"
                        : "text-muted hover:text-fg",
                    )}
                  >
                    <span className="truncate">
                      <span className="mr-2 font-mono text-[11px] text-faint">
                        {m.station}
                      </span>
                      {m.title}
                    </span>
                    {done ? <Check className="size-3.5 text-pass" /> : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>

        <article className="min-w-0 pb-16">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Station {mod.station} · {mod.durationLabel}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">{mod.title}</h1>
          <p className="mt-3 text-lg text-muted">{mod.kicker}</p>
          <p className="mt-6 max-w-2xl leading-relaxed">{mod.summary}</p>
          {mod.thesis ? (
            <blockquote className="mt-6 max-w-2xl border-l-2 border-accent/40 pl-4 text-muted">
              {mod.thesis}
            </blockquote>
          ) : null}

          <div className="mt-10 space-y-6">
            {mod.clips.map((clip) => (
              <YoutubeClip
                key={`${clip.start}-${clip.end}-${clip.label}`}
                videoId={course.videoId}
                start={clip.start}
                end={clip.end}
                label={clip.label}
                why={clip.why}
              />
            ))}
          </div>

          <div className="mt-4">
            <Button
              variant={progress.watched ? "secondary" : "primary"}
              onClick={() => void markWatched(mod.slug)}
            >
              {progress.watched ? "Clip marked watched" : "Mark clip watched"}
            </Button>
          </div>

          {mod.bullets.length ? (
            <section className="mt-12">
              <h2 className="font-display text-2xl tracking-tight">On the tape</h2>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
                {mod.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid gap-3">
                {mod.quotes.map((q) => (
                  <figure
                    key={`${q.t}-${q.text.slice(0, 24)}`}
                    className="rounded-md border border-border bg-raised/40 px-4 py-3"
                  >
                    <blockquote className="text-sm leading-relaxed">
                      “{q.text}”
                    </blockquote>
                    <figcaption className="mt-2 font-mono text-xs text-muted">
                      {q.t}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-10">
            <AssignmentPanel
              module={mod}
              assignment={progress.assignment}
              notes={progress.notes}
              onSave={(assignment, notes) =>
                persistAssignment(mod.slug, assignment, notes)
              }
            />
          </div>

          <div className="mt-8">
            <QuizPanel
              questions={mod.quiz}
              ratio={course.passRatio}
              priorScore={progress.quizScore}
              priorPassed={progress.quizPassed}
              onSubmit={(answers) => persistQuiz(mod.slug, answers)}
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            {prev ? (
              <Link
                to="/c/$courseSlug/s/$slug"
                params={{ courseSlug: course.slug, slug: prev.slug }}
                className="inline-flex h-11 items-center gap-2 text-sm text-muted hover:text-fg"
              >
                <ArrowLeft className="size-4" />
                {prev.title}
              </Link>
            ) : (
              <Link
                to="/c/$courseSlug"
                params={{ courseSlug: course.slug }}
                className="inline-flex h-11 items-center text-sm text-muted"
              >
                Course home
              </Link>
            )}
            {next ? (
              <Link
                to="/c/$courseSlug/s/$slug"
                params={{ courseSlug: course.slug, slug: next.slug }}
                className="inline-flex h-11 items-center gap-2 text-sm"
              >
                {next.title}
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link
                to="/c/$courseSlug/exam"
                params={{ courseSlug: course.slug }}
                className="inline-flex h-11 items-center gap-2 text-sm"
              >
                Field exam
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>

          {progress.passed ? (
            <p className="mt-6 text-sm text-pass">
              Station {mod.station} passed. Watch, field work, and quiz are all
              in.
            </p>
          ) : (
            <p className="mt-6 text-sm text-muted">
              To pass: mark the clip, finish required field work, and hit {passPct}%
              on the quiz.
            </p>
          )}
        </article>
      </div>
    </div>
  );
}
