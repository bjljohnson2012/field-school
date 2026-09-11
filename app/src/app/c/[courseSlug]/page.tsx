"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { CourseFeedback } from "@/components/course-feedback";
import { ShareLink } from "@/components/share-link";
import { YoutubeClip } from "@/components/youtube-clip";
import { useCoursePortal } from "@/hooks/use-portal";
import { getCourse } from "@/lib/course/catalog";
import { passingScore } from "@/lib/course/content";
import { cn } from "@/lib/utils";

export default function CourseHome() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const course = getCourse(courseSlug);
  const { course: state, tally } = useCoursePortal(courseSlug);

  if (!course) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Course not published</h1>
        <p className="mt-3 text-muted-foreground">
          The slug is wrong, or this ladder is still a draft.
        </p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center text-sm">
          Back to campus
        </Link>
      </main>
    );
  }

  const first = course.modules[0];
  const need = passingScore(course.examQuestions.length, course.examPassRatio);

  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {course.kicker} · {course.modules.length} stations · exam
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">
            {course.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {course.tagline}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {first ? (
              <Link
                href={`/c/${course.slug}/s/${first.slug}`}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                Start station 01
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
            <a
              href="#ladder"
              className="inline-flex h-12 items-center rounded-xl border border-border bg-card px-5 text-sm"
            >
              See the ladder
            </a>
            <ShareLink path={`/c/${course.slug}`} label="Copy course link" />
          </div>
        </div>
      </section>

      {course.videoId ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Source tape
          </p>
          <h2 className="mt-1 font-display text-3xl tracking-tight">The full stream</h2>
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
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Watch the clip, finish the required field work, score 75% on the
          station quiz. Then {need}/{course.examQuestions.length} on the exam
          for a Field School certificate.
        </p>
        <ol className="mt-8 grid gap-3">
          {course.modules.map((mod) => {
            const p = state?.modules[mod.slug];
            return (
              <li key={mod.slug}>
                <Link
                  href={`/c/${course.slug}/s/${mod.slug}`}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between",
                    p?.passed && "border-pass/30",
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-xs tabular-nums text-muted-foreground">
                      Station {mod.station} · {mod.durationLabel}
                    </p>
                    <h3 className="mt-1 font-display text-xl tracking-tight">
                      {mod.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{mod.kicker}</p>
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
            href={`/c/${course.slug}/desk`}
            className="inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
          >
            Build your share desk
          </Link>
          <Link
            href={`/c/${course.slug}/exam`}
            className="inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            {tally.exam?.passed ? "Exam passed" : "Take the exam"}
          </Link>
          {tally.certified ? (
            <Link
              href={`/c/${course.slug}/certificate`}
              className="inline-flex h-12 items-center rounded-xl border border-pass/40 px-5 text-sm text-pass"
            >
              View certificate
            </Link>
          ) : null}
        </div>
        <div className="mt-10">
          <CourseFeedback courseSlug={course.slug} />
        </div>
      </section>
    </main>
  );
}
