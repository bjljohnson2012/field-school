"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CourseSubnav } from "@/components/course-subnav";
import { GuestContinuity } from "@/components/guest-continuity";
import { LessonSpinePlayer } from "@/components/lesson-spine-player";
import { YoutubeClip } from "@/components/youtube-clip";
import {
  GUEST_CONTINUITY_COPY,
  LEARNER_STEPS,
  lessonHasFilm,
  measureLessonStep,
  readStoredLessons,
  type LibraryLesson,
} from "@/lib/library/m10";

function stepIndex(step: string): number {
  const index = LEARNER_STEPS.findIndex((item) => item.id === step);
  return index >= 0 ? index : 0;
}

export function LessonPlayer({
  courseSlug,
  lessonSlug,
  step,
  signedIn,
  initial,
}: {
  courseSlug: string;
  lessonSlug: string;
  step: string;
  signedIn: boolean;
  initial: LibraryLesson | null;
}) {
  const [lesson, setLesson] = useState<LibraryLesson | null>(initial);
  const current = LEARNER_STEPS[stepIndex(step)];
  const previous = stepIndex(step) > 0 ? LEARNER_STEPS[stepIndex(step) - 1] : null;
  const next = stepIndex(step) < LEARNER_STEPS.length - 1 ? LEARNER_STEPS[stepIndex(step) + 1] : null;

  useEffect(() => {
    if (initial) return;
    const stored = readStoredLessons().find((item) => item.slug === lessonSlug || item.id === lessonSlug);
    setLesson(stored && stored.status === "published" ? stored : null);
  }, [initial, lessonSlug]);

  if (!lesson || !current) {
    return <p className="m10-quiet-copy">This published lesson is not on this desk.</p>;
  }

  const film = lessonHasFilm(lesson);
  const measure = measureLessonStep(lesson, current.id);
  const primary =
    current.id === "example" && film
      ? null
      : current.id === "field"
        ? "Save"
        : current.id === "practice" || current.id === "check"
          ? "Submit"
          : "Next";
  const meter = Math.round(((stepIndex(step) + 1) / LEARNER_STEPS.length) * 100);
  const href = (id: string) => `/c/${courseSlug}/${lessonSlug}?step=${id}`;

  return (
    <div className="m10-lesson" data-step={current.id}>
      <aside className="m10-outline-desktop" aria-label="Lesson outline">
        {LEARNER_STEPS.map((item) => (
          <Link key={item.id} href={href(item.id)} aria-current={item.id === current.id ? "step" : undefined}>
            {item.label}
          </Link>
        ))}
        <CourseSubnav courseSlug={courseSlug} />
      </aside>
      <details className="m10-outline-drawer">
        <summary>Outline</summary>
        {LEARNER_STEPS.map((item) => (
          <Link key={item.id} href={href(item.id)}>
            {item.label}
          </Link>
        ))}
      </details>
      <main
        data-m10-canvas="true"
        data-scroll-height={measure.scrollHeight}
        data-inner-height={measure.limit / 2}
      >
        <p data-pass-rule="true">Pass at 75%. Exam pass is 8 of 10.</p>
        <div className="m10-meter" style={{ width: `${meter}%` }} />
        <h1 className="m10-step-title">{current.label}</h1>
        {current.slots.map((index) => {
          const block = lesson.blocks[index];
          if (!block) return null;
          if (block.kind === "text") return <p key={index}>{block.text}</p>;
          if (block.kind === "quiz") {
            return (
              <div key={index}>
                <p>Pass at 75%.</p>
                {block.questions.map((question) => (
                  <p key={question.id}>{question.prompt}</p>
                ))}
              </div>
            );
          }
          if (block.kind === "assignment") {
            return (
              <div key={index}>
                <p>{block.title}</p>
                <p>{block.brief}</p>
              </div>
            );
          }
          return null;
        })}
        {current.id === "example" && lesson.film?.provider === "youtube" ? (
          <div data-player="one" data-player-count="1">
            <YoutubeClip videoId={lesson.film.videoId} label={lesson.title} />
          </div>
        ) : null}
        {current.id === "example" && lesson.film?.provider === "lesson-spine" ? (
          <div data-player="one" data-player-count="1" data-film="lesson-spine">
            <LessonSpinePlayer />
          </div>
        ) : null}
        <footer className="m10-step-footer">
          {previous ? (
            <Link className="m10-quiet" href={href(previous.id)}>
              Previous
            </Link>
          ) : (
            <span />
          )}
          {primary === "Next" && next ? (
            <Link className="m10-fill" href={href(next.id)}>
              Next
            </Link>
          ) : primary ? (
            <button type="button" className="m10-fill">
              {primary}
            </button>
          ) : null}
          {primary !== "Next" && next ? (
            <Link className="m10-quiet" href={href(next.id)}>
              Next
            </Link>
          ) : null}
        </footer>
        {signedIn ? null : (
          <div data-guest-continuity="m10" style={{ color: "#5C5850" }}>
            <GuestContinuity />
            <p>{GUEST_CONTINUITY_COPY}</p>
          </div>
        )}
      </main>
    </div>
  );
}
