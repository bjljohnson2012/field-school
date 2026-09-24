"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { CourseFeedback } from "@/components/course-feedback";
import { ShareLink } from "@/components/share-link";
import { buttonVariants } from "@/components/ui/button";
import { YoutubeClip } from "@/components/youtube-clip";
import { useCoursePortal } from "@/hooks/use-portal";
import { getCourse } from "@/lib/course/catalog";
import { cn } from "@/lib/utils";

export default function CourseHome() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const course = getCourse(courseSlug);
  const { course: state, tally } = useCoursePortal(courseSlug);

  if (!course) {
    return (
      <main className="mx-auto max-w-xl px-6 py-8">
        <h1 className="h-page">Course not published</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The slug is wrong, or this ladder is still a draft.
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "mt-6")}>
          Back to campus
        </Link>
      </main>
    );
  }

  const first = course.modules[0];

  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="eyebrow">
            {course.kicker} · {course.modules.length} stations · exam
          </p>
          <h1 className="h-page mt-3 max-w-3xl text-4xl sm:text-5xl">
            {course.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {course.tagline}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {first ? (
              <Link
                href={`/c/${course.slug}/s/${first.slug}`}
                className="inline-flex items-center gap-2 rounded-brand bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 ease-brand hover:-translate-y-px hover:bg-primary/90 hover:shadow-card-hover"
              >
                Start station 01
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
            <a href="#ladder" className={buttonVariants({ variant: "outline" })}>
              See the ladder
            </a>
            <ShareLink path={`/c/${course.slug}`} label="Copy course link" />
          </div>
        </div>
      </section>

      {course.videoId ? (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <p className="eyebrow">Source tape</p>
          <h2 className="h-section mt-2 text-3xl">The full stream</h2>
          <div className="mt-5">
            <YoutubeClip
              videoId={course.videoId}
              full
              label={course.videoTitle || course.title}
              why={course.kicker}
            />
          </div>
        </section>
      ) : null}

      <section id="ladder" className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="h-section text-3xl">The ladder</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Watch the clip, finish the required field work, score 75% on the
          station quiz. Then 8/10 on the exam for a Field School certificate.
        </p>
        <ol className="mt-6 grid gap-3">
          {course.modules.map((mod) => {
            const p = state?.modules[mod.slug];
            return (
              <li key={mod.slug}>
                <Link
                  href={`/c/${course.slug}/s/${mod.slug}`}
                  className={cn(
                    "flex flex-col gap-2 rounded-card border border-border bg-card px-4 py-4 shadow-card transition-all duration-200 ease-brand hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between",
                    p?.passed && "border-pass/30",
                  )}
                >
                  <div className="min-w-0">
                    <p className="eyebrow">
                      Station {mod.station} · {mod.durationLabel}
                    </p>
                    <h3 className="h-card mt-1">{mod.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{mod.kicker}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold">
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
            className={buttonVariants({ variant: "outline" })}
          >
            Build your share desk
          </Link>
          <Link
            href={`/c/${course.slug}/exam`}
            className={buttonVariants({ variant: "outline" })}
          >
            {tally.exam?.passed ? "Exam passed" : "Take the exam"}
          </Link>
          {tally.certified ? (
            <Link
              href={`/c/${course.slug}/certificate`}
              className={cn(buttonVariants({ variant: "outline" }), "border-pass/40 text-pass")}
            >
              View certificate
            </Link>
          ) : null}
        </div>
        <div className="mt-8">
          <CourseFeedback courseSlug={course.slug} />
        </div>
      </section>
    </main>
  );
}
