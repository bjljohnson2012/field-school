"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AssignmentPanel } from "@/components/assignment-panel";
import { GuestContinuity } from "@/components/guest-continuity";
import { QuizPanel } from "@/components/quiz-panel";
import { YoutubeClip } from "@/components/youtube-clip";
import { useCoursePortal } from "@/hooks/use-portal";
import { postLearningEvent } from "@/lib/campus-runtime/client";
import { getCourse } from "@/lib/course/catalog";
import { emptyProgress, passingScore } from "@/lib/course/content";
import { saveQuizAnswers, upsertModule } from "@/lib/portal";

export default function StationPage() {
  const { courseSlug, slug } = useParams<{ courseSlug: string; slug: string }>();
  const course = getCourse(courseSlug);
  const { course: state } = useCoursePortal(courseSlug);
  const { data: authSession } = useSession();
  const signedIn = Boolean(authSession?.user?.email);

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

  const parts = [
    { href: "#clip", label: "Clip" },
    { href: "#thesis", label: "Thesis" },
    { href: "#field-work", label: "Field work" },
    { href: "#quiz", label: "Quiz" },
  ];

  return (
    <main className="mx-auto max-w-3xl pb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Station {mod.station} · pass at {passPct}%
          </p>
          <h1 className="h-page mt-2">{mod.title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{mod.summary}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          {prev ? (
            <Link
              href={`/c/${course.slug}/s/${prev.slug}`}
              className="inline-flex h-9 min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span className="truncate">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/c/${course.slug}/s/${next.slug}`}
              className="inline-flex h-9 min-w-0 items-center gap-2 text-sm"
            >
              <span className="truncate">{next.title}</span>
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          ) : (
            <Link href={`/c/${course.slug}/exam`} className="inline-flex h-9 items-center gap-2 text-sm">
              Exam
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        <nav aria-label="This station" className="mt-4 flex flex-wrap gap-2">
          {parts.map((part) => (
            <a
              key={part.href}
              href={part.href}
              className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-xs hover:bg-secondary"
            >
              {part.label}
            </a>
          ))}
        </nav>

        <section id="clip" className="card mt-8 scroll-mt-24 space-y-4 p-5">
          <h2 className="h-section">Clip</h2>
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
              onClick={() => {
                upsertModule(course.slug, mod.slug, { watched: true });
                if (signedIn) {
                  void postLearningEvent({
                    kind: "watch",
                    course: course.slug,
                    station: mod.slug,
                  });
                }
              }}
              className="btn-primary"
            >
              Mark clip watched
            </button>
          ) : (
            <p className="text-sm text-pass">Clip credited.</p>
          )}
        </section>

        <section id="thesis" className="card mt-8 scroll-mt-24 px-5 py-5">
          <h2 className="h-section">Thesis</h2>
          <p className="mt-3 text-sm leading-relaxed">{mod.thesis}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {mod.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <div className="mt-8">
          <GuestContinuity />
        </div>

        <div id="field-work" className="mt-8 scroll-mt-24">
        <AssignmentPanel
          module={mod}
          assignment={progress.assignment}
          notes={progress.notes}
          onSave={(assignment, notes) => {
            upsertModule(course.slug, mod.slug, { assignment, notes });
            if (signedIn) {
              void postLearningEvent({
                kind: "assignment",
                course: course.slug,
                station: mod.slug,
                raw: { assignment, notes },
              });
            }
          }}
        />
        </div>

        <div id="quiz" className="mt-8 scroll-mt-24">
        <QuizPanel
          questions={mod.quiz}
          ratio={course.passRatio}
          priorScore={progress.quizScore}
          priorPassed={progress.quizPassed}
          shareTitle={`${course.title} · ${mod.title}`}
          onSubmit={(answers) => {
            const next = saveQuizAnswers(course.slug, mod.slug, answers);
            if (signedIn) {
              let score = 0;
              for (const q of mod.quiz) {
                if (answers[q.id] === q.answer) score += 1;
              }
              const need = passingScore(mod.quiz.length, course.passRatio);
              void postLearningEvent({
                kind: "quiz",
                course: course.slug,
                station: mod.slug,
                score,
                raw: { answers, passed: score >= need },
              });
            }
            return next;
          }}
        />
        </div>

        <nav aria-label="Next station" className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-4">
          {prev ? (
            <Link
              href={`/c/${course.slug}/s/${prev.slug}`}
              className="inline-flex h-11 min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span className="truncate">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/c/${course.slug}/s/${next.slug}`}
              className="inline-flex h-11 min-w-0 items-center gap-2 text-sm"
            >
              <span className="truncate">{next.title}</span>
              <ArrowRight className="size-4 shrink-0" />
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
        </nav>
    </main>
  );
}
