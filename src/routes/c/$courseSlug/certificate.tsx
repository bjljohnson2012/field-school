import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { usePublishedCourse } from "@/lib/course/use-course";
import { useCourseProgress } from "@/lib/course/use-progress";
import { UNI_NAME } from "@/lib/course/types";

export const Route = createFileRoute("/c/$courseSlug/certificate")({
  component: CertificatePage,
});

function CertificatePage() {
  const { courseSlug } = Route.useParams();
  const course = usePublishedCourse(courseSlug);
  const user = useCurrentUser();
  const { certified, passedCount, total, exam } = useCourseProgress(course ?? null);
  const name = user?.displayName ?? user?.primaryEmail ?? "Guest";

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
        <div className="md-card rounded-xl border border-border bg-surface px-6 py-10 sm:px-12">
          <p className="text-center text-xs uppercase tracking-[0.22em] text-muted">
            {UNI_NAME}
          </p>
          <h1 className="mt-6 text-center font-display text-4xl tracking-tight">
            Passed the ladder
          </h1>
          <p className="mt-6 text-center text-lg">{name}</p>
          <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted">
            {course.title}
            {exam ? ` · exam ${exam.score}/${course.examQuestions.length}` : ""}.
            Study credential from this campus — not a vendor certification.
            {!user
              ? " Signed in later, this name becomes your account name."
              : null}
          </p>
          <p className="mt-8 text-center font-mono text-xs text-faint">
            {new Date().toISOString().slice(0, 10)} · {course.kicker || course.slug}
          </p>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/c/$courseSlug/desk"
            params={{ courseSlug: course.slug }}
            className="md-interactive inline-flex h-11 items-center rounded-xl px-2 text-sm text-muted"
          >
            Export share desk
          </Link>
          <Link
            to="/"
            className="md-interactive inline-flex h-11 items-center rounded-xl px-2 text-sm text-muted"
          >
            Campus
          </Link>
        </div>
      </main>
    </div>
  );
}
