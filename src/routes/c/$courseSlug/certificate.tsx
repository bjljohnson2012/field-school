import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Certificate } from "@/components/certificate";
import { CourseFeedback } from "@/components/course-feedback";
import { SiteHeader } from "@/components/site-header";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { usePublishedCourse } from "@/lib/course/use-course";
import { useCourseProgress } from "@/lib/course/use-progress";
import { getPublicSignature } from "@/lib/course/certifications";

export const Route = createFileRoute("/c/$courseSlug/certificate")({
  component: CertificatePage,
});

type Signature = Awaited<ReturnType<typeof getPublicSignature>>;

function CertificatePage() {
  const { courseSlug } = Route.useParams();
  const course = usePublishedCourse(courseSlug);
  const user = useCurrentUser();
  const { certified, passedCount, total, exam } = useCourseProgress(course ?? null);
  const name = user?.displayName ?? user?.primaryEmail ?? "Guest";
  const [signature, setSignature] = useState<Signature>({
    founderName: "",
    signatureText: "",
    signatureImage: "",
  });

  useEffect(() => {
    getPublicSignature()
      .then(setSignature)
      .catch(() => undefined);
  }, []);

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

  const examNote = exam ? ` · exam ${exam.score}/${course.examQuestions.length}` : "";

  return (
    <div className="min-h-dvh">
      <SiteHeader course={course} passed={passedCount} total={total} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Certificate
          recipientName={name}
          headline="Passed the ladder"
          subtitle={`has completed ${course.title}${examNote}. A study credential from this campus — not a vendor certification.`}
          signature={signature}
          dateStr={new Date().toISOString().slice(0, 10)}
        />
        <div data-noprint className="mt-6 flex justify-center gap-4">
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
        {user ? (
          <div data-noprint className="mt-6">
            <CourseFeedback courseSlug={course.slug} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
