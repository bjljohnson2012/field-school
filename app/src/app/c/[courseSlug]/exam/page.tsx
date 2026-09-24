"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QuizPanel } from "@/components/quiz-panel";
import { buttonVariants } from "@/components/ui/button";
import { useCoursePortal } from "@/hooks/use-portal";
import { getCourse } from "@/lib/course/catalog";
import { saveExamAnswers } from "@/lib/portal";

export default function ExamPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const course = getCourse(courseSlug);
  const { tally } = useCoursePortal(courseSlug);

  if (!course) {
    return (
      <main className="mx-auto max-w-xl px-6 py-8">
        <p className="text-muted-foreground">Course not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Exam · Field School</p>
      <h1 className="h-page mt-2">{course.title}</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        {course.examQuestions.length} questions. Pass at 8/10. The Field School
        certificate also needs every station cleared.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Stations passed {tally.passed}/{tally.total}.
      </p>
      <div className="mt-8">
        <QuizPanel
          title="Course exam"
          questions={course.examQuestions}
          ratio={course.examPassRatio}
          showProgress
          priorScore={tally.exam?.score ?? null}
          priorPassed={Boolean(tally.exam?.passed)}
          shareTitle={`${course.title} exam`}
          onSubmit={(answers) => saveExamAnswers(course.slug, answers)}
        />
      </div>
      {tally.certified ? (
        <Link
          href={`/c/${course.slug}/certificate`}
          className={buttonVariants({ variant: "outline", className: "mt-6" })}
        >
          View certificate
        </Link>
      ) : null}
      </div>
    </main>
  );
}
