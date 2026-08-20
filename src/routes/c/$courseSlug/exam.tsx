import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { QuizPanel } from "@/components/quiz-panel";
import { usePublishedCourse } from "@/lib/course/use-course";
import { useCourseProgress } from "@/lib/course/use-progress";

export const Route = createFileRoute("/c/$courseSlug/exam")({
  component: ExamPage,
});

function ExamPage() {
  const { courseSlug } = Route.useParams();
  const course = usePublishedCourse(courseSlug);
  const { exam, persistExam, passedCount, total, certified } = useCourseProgress(
    course ?? null,
  );
  const stationsReady = total > 0 && passedCount === total;

  if (!course) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">
          {course === undefined ? "Loading exam…" : "Course not found."}
        </div>
      </div>
    );
  }

  const need = Math.ceil(course.examQuestions.length * course.examPassRatio);

  return (
    <div className="min-h-dvh">
      <SiteHeader course={course} passed={passedCount} total={total} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Capstone</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Field exam</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          {course.examQuestions.length} questions from the ladder. Pass at {need}/
          {course.examQuestions.length}. The certificate also requires every
          station.
        </p>
        <p className="mt-3 text-sm text-muted">
          Stations passed: {passedCount}/{total}
          {stationsReady ? " — ladder complete." : " — keep working the stations."}
        </p>
        <div className="mt-8">
          {course.examQuestions.length ? (
            <QuizPanel
              questions={course.examQuestions}
              ratio={course.examPassRatio}
              priorScore={exam?.score ?? null}
              priorPassed={Boolean(exam?.passed)}
              onSubmit={(answers) => persistExam(answers)}
            />
          ) : (
            <p className="text-sm text-muted">This course has no exam yet.</p>
          )}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/c/$courseSlug/desk"
            params={{ courseSlug: course.slug }}
            className="inline-flex h-11 items-center rounded-md border border-border px-4 text-sm"
          >
            Share desk
          </Link>
          {certified ? (
            <Link
              to="/c/$courseSlug/certificate"
              params={{ courseSlug: course.slug }}
              className="inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
            >
              Certificate
            </Link>
          ) : course.modules[0] ? (
            <Link
              to="/c/$courseSlug/s/$slug"
              params={{ courseSlug: course.slug, slug: course.modules[0].slug }}
              className="inline-flex h-11 items-center text-sm text-muted"
            >
              Back to station 01
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
