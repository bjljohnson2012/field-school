"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QuizPanel } from "@/components/quiz-panel";
import { useCoursePortal } from "@/hooks/use-portal";
import { getCourse } from "@/lib/course/catalog";
import { saveExamAnswers } from "@/lib/portal";

export default function ExamPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const course = getCourse(courseSlug);
  const { tally } = useCoursePortal(courseSlug);

  if (!course) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-muted-foreground">Course not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Exam · Field School
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{course.title}</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        {course.examQuestions.length} questions. Pass at{" "}
        {Math.ceil(course.examQuestions.length * course.examPassRatio)}/
        {course.examQuestions.length}. The Field School certificate also needs
        every station cleared.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Stations passed {tally.passed}/{tally.total}.
      </p>
      <div className="mt-8">
        <QuizPanel
          title="Course exam"
          questions={course.examQuestions}
          ratio={course.examPassRatio}
          priorScore={tally.exam?.score ?? null}
          priorPassed={Boolean(tally.exam?.passed)}
          shareTitle={`${course.title} exam`}
          onSubmit={(answers) => saveExamAnswers(course.slug, answers)}
        />
      </div>
      {tally.certified ? (
        <Link
          href={`/c/${course.slug}/certificate`}
          className="mt-6 inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          View certificate
        </Link>
      ) : null}
    </main>
  );
}
