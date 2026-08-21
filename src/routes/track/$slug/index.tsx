import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getPublishedCertification,
  getTrackAccess,
} from "@/lib/course/certifications";

export const Route = createFileRoute("/track/$slug/")({
  component: TrackPage,
});

type Access = Awaited<ReturnType<typeof getTrackAccess>>;
type Public = Awaited<ReturnType<typeof getPublishedCertification>>;

function TrackPage() {
  const { slug } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [pub, setPub] = useState<Public | null | undefined>(undefined);
  const [access, setAccess] = useState<Access | null>(null);

  useEffect(() => {
    getPublishedCertification({ data: { slug } })
      .then(setPub)
      .catch(() => setPub(null));
  }, [slug]);

  useEffect(() => {
    if (isPending || !user) return;
    getTrackAccess({ data: { slug } })
      .then(setAccess)
      .catch(() => setAccess(null));
  }, [slug, user, isPending]);

  if (pub === undefined) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">Loading…</p>
      </div>
    );
  }
  if (!pub) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-xl px-4 py-16">
          <h1 className="font-display text-3xl">Certification not found</h1>
          <Link to="/" className="md-interactive mt-6 inline-flex h-11 items-center text-sm">
            Back to campus
          </Link>
        </main>
      </div>
    );
  }

  const certifiedBySlug = new Map(
    (access?.courses ?? []).map((c) => [c.slug, c.certified]),
  );
  const done = access?.completedCourses ?? 0;
  const total = access?.totalCourses ?? pub.courses.length;
  const complete = access?.complete ?? false;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Certification</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          {pub.title}
        </h1>
        {pub.description ? (
          <p className="mt-4 max-w-xl leading-relaxed text-muted">{pub.description}</p>
        ) : null}

        {user ? (
          <div className="mt-6">
            <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-raised">
              <div
                className="h-full bg-accent"
                style={{ width: `${total === 0 ? 0 : Math.round((done / total) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              {done}/{total} courses certified
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">
            Sign in to track your progress and earn the certificate.
          </p>
        )}

        <ol className="mt-8 grid gap-3">
          {pub.courses.map((c) => {
            const isCert = certifiedBySlug.get(c.slug);
            return (
              <li key={c.slug}>
                <Link
                  to="/c/$courseSlug"
                  params={{ courseSlug: c.slug }}
                  className="md-interactive md-card flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-4"
                >
                  <h2 className="font-display text-lg tracking-tight">{c.title}</h2>
                  <span className="inline-flex items-center gap-2 text-sm">
                    {isCert ? (
                      <>
                        <Check className="size-4 text-pass" />
                        <span className="text-pass">Certified</span>
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

        {complete || access?.faculty ? (
          <div className="mt-8">
            <Link
              to="/track/$slug/certificate"
              params={{ slug }}
              className="md-interactive inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg"
            >
              {complete ? "View your certificate" : "Preview certificate"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
