import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Certificate } from "@/components/certificate";
import { SiteHeader } from "@/components/site-header";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getTrackAccess } from "@/lib/course/certifications";

export const Route = createFileRoute("/track/$slug/certificate")({
  component: TrackCertificate,
});

type Access = Awaited<ReturnType<typeof getTrackAccess>>;

function TrackCertificate() {
  const { slug } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [access, setAccess] = useState<Access | null | undefined>(undefined);

  useEffect(() => {
    if (isPending || !user) return;
    getTrackAccess({ data: { slug } })
      .then(setAccess)
      .catch(() => setAccess(null));
  }, [slug, user, isPending]);

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">Loading…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (access === undefined) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">Loading certificate…</p>
      </div>
    );
  }
  if (!access) return <Navigate to="/" />;

  const earned = access.complete;
  const isPreview = !earned && access.faculty;

  if (!earned && !access.faculty) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="font-display text-3xl tracking-tight">Almost there</h1>
          <p className="mt-4 text-muted">
            Certify in all {access.totalCourses} courses in “{access.title}” to unlock
            this certificate. You’re at {access.completedCourses}/{access.totalCourses}.
          </p>
          <Link
            to="/track/$slug"
            params={{ slug }}
            className="md-interactive mt-6 inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Back to the track
          </Link>
        </main>
      </div>
    );
  }

  const recipient = user.displayName ?? user.primaryEmail ?? "Student";

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        {isPreview ? (
          <p data-noprint className="mb-4 rounded-lg border border-border bg-surface px-3 py-2 text-center text-xs text-muted">
            Preview — students see this once they certify in all courses.
          </p>
        ) : null}
        <Certificate
          recipientName={recipient}
          headline="Certificate of Completion"
          subtitle={`has completed every course in the ${access.title} certification at ${"Johnson Field School University"}.`}
          signature={access.signature}
          dateStr={new Date().toISOString().slice(0, 10)}
        />
        <div data-noprint className="mt-6 flex justify-center">
          <Link
            to="/track/$slug"
            params={{ slug }}
            className="md-interactive inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted"
          >
            Back to the track
          </Link>
        </div>
      </main>
    </div>
  );
}
