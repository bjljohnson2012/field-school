"use client";

import { useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";

export default function StationPage() {
  const { courseSlug, slug } = useParams<{ courseSlug: string; slug: string }>();
  const course = getCourse(courseSlug);
  const { course: state } = useCoursePortal(courseSlug);
  const { data: authSession } = useSession();
  const signedIn = Boolean(authSession?.user?.email);
  const endRef = useRef<HTMLElement>(null);
  const [endVisible, setEndVisible] = useState(false);

  useEffect(() => {
    const node = endRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setEndVisible(entry.isIntersecting);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [courseSlug, slug]);

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
    { href: "#clip", label: "Clip", kind: "Video" },
    { href: "#thesis", label: "Thesis", kind: "Document" },
    { href: "#field-work", label: "Field work", kind: "Assignment" },
    { href: "#quiz", label: "Quiz", kind: "Quiz" },
  ];
  return (
    <main className="mx-auto max-w-3xl pb-24">
        <p className="text-xs text-muted-foreground">
          <Link href={`/c/${course.slug}`} className="hover:text-foreground">
            {course.title}
          </Link>
          <span aria-hidden="true"> / </span>
          <a href={`/c/${course.slug}#ladder`} className="hover:text-foreground">
            The ladder
          </a>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{mod.title}</span>
        </p>

        <div className="activity-info-section mx-auto mt-6 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Station {mod.station} · pass at {passPct}%
          </p>
          <h1 className="h-page mt-2">{mod.title}</h1>
          <p className="mt-3 text-muted-foreground">{mod.summary}</p>
        </div>

        <nav aria-label="This station" className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
          {parts.map((part, index) => (
            <a
              key={part.href}
              href={part.href}
              className="rounded-lg border border-border bg-card px-3 py-2 hover:bg-secondary"
            >
              <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {index + 1} · {part.kind}
              </span>
              <span className="mt-0.5 block text-sm font-medium">{part.label}</span>
            </a>
          ))}
        </nav>

        <section id="clip" className="card mx-auto mt-8 max-w-2xl scroll-mt-24 space-y-4 border-l-2 border-l-primary p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">1 · Video</p>
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

        <section id="thesis" className="card mx-auto mt-8 max-w-2xl scroll-mt-24 border-l-2 border-l-primary px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">2 · Document</p>
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

        <div id="field-work" className="mx-auto mt-8 max-w-2xl scroll-mt-24">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">3 · Assignment</p>
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

        <div id="quiz" className="mx-auto mt-8 max-w-2xl scroll-mt-24">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">4 · Quiz</p>
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

        <nav ref={endRef} aria-label="Next station" className="mt-10 grid grid-cols-3 items-center gap-2 border-t border-border pt-4">
          {prev ? (
            <Link
              href={`/c/${course.slug}/s/${prev.slug}`}
              className="inline-flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span className="min-w-0">
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em]">Previous</span>
                <span className="block truncate text-sm">{prev.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          <p className="text-center text-xs text-muted-foreground">
            Activity {idx + 1} of {course.modules.length}
          </p>
          {next ? (
            <Link
              href={`/c/${course.slug}/s/${next.slug}`}
              className="inline-flex min-w-0 items-center justify-end gap-2 rounded-lg px-2 py-2 hover:bg-secondary"
            >
              <span className="min-w-0 text-right">
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Next</span>
                <span className="block truncate text-sm">{next.title}</span>
              </span>
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          ) : (
            <Link
              href={`/c/${course.slug}/exam`}
              className="inline-flex min-w-0 items-center justify-end gap-2 rounded-lg px-2 py-2 hover:bg-secondary"
            >
              <span className="min-w-0 text-right">
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Next</span>
                <span className="block truncate text-sm">Exam</span>
              </span>
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          )}
        </nav>

        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur transition-transform duration-300",
            endVisible && "translate-y-full",
          )}
        >
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3">
            <p className="hidden min-w-0 truncate text-sm font-medium sm:block">{course.title}</p>
            <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
              {prev ? (
                <Link
                  href={`/c/${course.slug}/s/${prev.slug}`}
                  className="inline-flex h-10 min-w-0 items-center gap-1 rounded-lg px-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <ArrowLeft className="size-4 shrink-0" />
                  <span className="hidden min-w-0 sm:block">
                    <span className="block text-[10px] uppercase tracking-[0.12em]">Previous</span>
                    <span className="block max-w-36 truncate text-sm">{prev.title}</span>
                  </span>
                </Link>
              ) : (
                <span className="w-8" />
              )}
              <p className="shrink-0 px-1 text-xs text-muted-foreground">
                Activity {idx + 1} of {course.modules.length}
              </p>
              {next ? (
                <Link
                  href={`/c/${course.slug}/s/${next.slug}`}
                  className="inline-flex h-10 min-w-0 items-center gap-1 rounded-lg px-2 hover:bg-secondary"
                >
                  <span className="hidden min-w-0 text-right sm:block">
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Next</span>
                    <span className="block max-w-36 truncate text-sm">{next.title}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              ) : (
                <Link
                  href={`/c/${course.slug}/exam`}
                  className="inline-flex h-10 items-center gap-1 rounded-lg px-2 hover:bg-secondary"
                >
                  <span className="hidden text-right sm:block">
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Next</span>
                    <span className="block text-sm">Exam</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              )}
            </div>
          </div>
        </div>
    </main>
  );
}
