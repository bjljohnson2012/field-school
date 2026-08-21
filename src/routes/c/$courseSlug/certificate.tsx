import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { usePublishedCourse } from "@/lib/course/use-course";
import { useCourseProgress } from "@/lib/course/use-progress";
import { COMPANY_NAME, UNI_NAME } from "@/lib/course/types";

export const Route = createFileRoute("/c/$courseSlug/certificate")({
  component: CertificatePage,
});

function CertificatePage() {
  const { courseSlug } = Route.useParams();
  const course = usePublishedCourse(courseSlug);
  const user = useCurrentUser();
  const { certified, passedCount, total, exam } = useCourseProgress(course ?? null);
  const name = user?.displayName ?? user?.primaryEmail ?? "Field operator";

  if (course === undefined) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">
          Loading…
        </div>
      </div>
    );
  }
  if (!course) return <Navigate to="/" />;
  if (!certified) {
    return (
      <Navigate to="/c/$courseSlug/exam" params={{ courseSlug: course.slug }} />
    );
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader course={course} passed={passedCount} total={total} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div
          id="certificate-print"
          className="rounded-xl border border-border bg-surface px-6 py-10 sm:px-12"
        >
          <p className="text-center text-xs uppercase tracking-[0.22em] text-muted">
            {UNI_NAME}
          </p>
          <h1 className="mt-6 text-center font-display text-4xl tracking-tight">
            Passed the ladder
          </h1>
          <p className="mt-2 text-center text-xs uppercase tracking-[0.18em] text-muted">
            Awarded to
          </p>
          <p className="mt-3 text-center font-display text-3xl tracking-tight">
            {name}
          </p>
          <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted">
            has completed {course.title}
            {exam ? ` · exam ${exam.score}/${course.examQuestions.length}` : ""}.
            A study credential from {UNI_NAME} — not a vendor certification.
          </p>
          <div className="mt-10 flex items-end justify-between gap-4 border-t border-border pt-6">
            <div>
              <p className="text-sm font-medium">{COMPANY_NAME}</p>
              <p className="text-xs text-muted">Course portal · {UNI_NAME}</p>
            </div>
            <p className="font-mono text-xs text-faint">
              {new Date().toISOString().slice(0, 10)} ·{" "}
              {course.kicker || course.slug}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/c/$courseSlug/desk"
            params={{ courseSlug: course.slug }}
            className="h-11 text-sm text-muted hover:text-fg"
          >
            Export share desk
          </Link>
          <Link to="/" className="h-11 text-sm text-muted hover:text-fg">
            Campus
          </Link>
        </div>
      </main>
    </div>
  );
}
