"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AssignmentPanel } from "@/components/assignment-panel";
import { QuizPanel } from "@/components/quiz-panel";
import { YoutubeClip } from "@/components/youtube-clip";
import { useCoursePortal } from "@/hooks/use-portal";
import { getCourse } from "@/lib/course/catalog";
import { emptyProgress } from "@/lib/course/content";
import { saveQuizAnswers, upsertModule } from "@/lib/portal";
import { cn } from "@/lib/utils";

export default function StationPage() {
  const { courseSlug, slug } = useParams<{ courseSlug: string; slug: string }>();
  const course = getCourse(courseSlug);
  const { course: state } = useCoursePortal(courseSlug);

  if (!course) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-muted-foreground">Course not found.</p>
      </main>
    );
  }

  const mod = course.modules.find((m) => m.slug === slug);
  if (!mod) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-muted-foreground">Station not found.</p>
        <Link href={`/c/${course.slug}`} className="mt-4 inline-flex text-sm">
          Back to ladder
        </Link>
      </main>
    );
  }

  const idx = course.modules.findIndex((m) => m.slug === mod.slug);
  const prev = idx > 0 ? course.modules[idx - 1] : null;
  const next = idx < course.modules.length - 1 ? course.modules[idx + 1] : null;
  const progress = state?.modules[mod.slug] ?? emptyProgress();
  const passPct = Math.round(course.passRatio * 100);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Stations
        </p>
        <ol className="space-y-1">
          {course.modules.map((m) => {
            const done = state?.modules[m.slug]?.passed;
            return (
              <li key={m.slug}>
                <Link
                  href={`/c/${course.slug}/s/${m.slug}`}
                  className={cn(
                    "flex h-10 items-center justify-between rounded-lg px-2 text-sm",
                    m.slug === mod.slug
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
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

      <main className="space-y-8 pb-16">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Station {mod.station} · pass at {passPct}%
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">{mod.title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{mod.summary}</p>
        </div>

        <div className="space-y-4">
          {mod.clips.map((clip) => (
            <YoutubeClip
              key={`${clip.start}-${clip.end}`}
              videoId={course.videoId}
              start={clip.start}
              end={clip.end}
              label={clip.label}
              why={clip.why}
            />
          ))}
          {!progress.watched ? (
            <button
              type="button"
              onClick={() => upsertModule(course.slug, mod.slug, { watched: true })}
              className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-4 text-sm"
            >
              Mark clip watched
            </button>
          ) : (
            <p className="text-sm text-pass">Clip credited.</p>
          )}
        </div>

        <section className="rounded-xl border border-border bg-card px-5 py-5">
          <h2 className="font-display text-2xl tracking-tight">Thesis</h2>
          <p className="mt-3 text-sm leading-relaxed">{mod.thesis}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {mod.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <AssignmentPanel
          module={mod}
          assignment={progress.assignment}
          notes={progress.notes}
          onSave={(assignment, notes) =>
            upsertModule(course.slug, mod.slug, { assignment, notes })
          }
        />

        <QuizPanel
          questions={mod.quiz}
          ratio={course.passRatio}
          priorScore={progress.quizScore}
          priorPassed={progress.quizPassed}
          onSubmit={(answers) => saveQuizAnswers(course.slug, mod.slug, answers)}
        />

        <div className="flex flex-wrap justify-between gap-3">
          {prev ? (
            <Link
              href={`/c/${course.slug}/s/${prev.slug}`}
              className="inline-flex h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/c/${course.slug}/s/${next.slug}`}
              className="inline-flex h-11 items-center gap-2 text-sm"
            >
              {next.title}
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link
              href={`/c/${course.slug}/exam`}
              className="inline-flex h-11 items-center gap-2 text-sm"
            >
              Exam
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
