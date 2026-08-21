import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { getOfficeState } from "@/lib/course/catalog";
import type { CourseSummary } from "@/lib/course/types";

export const Route = createFileRoute("/office/")({ component: OfficePage });

function OfficePage() {
  const { user, isPending } = useCurrentUserState();
  const [state, setState] = useState<
    | {
        open: boolean;
        isFaculty: boolean;
        role: string | null;
        courses: CourseSummary[];
      }
    | null
    | "denied"
  >(null);

  useEffect(() => {
    if (isPending || !user) return;
    getOfficeState()
      .then(setState)
      .catch(() => setState("denied"));
  }, [user, isPending]);

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-muted">
          Checking admin access…
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Admin
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Manage the catalog
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Catalog edits stay with the dean account. Signed-in students keep a
          dashboard and can message this desk. Guests can still walk a published
          course, then lose that progress when they leave.
        </p>

        {state === null ? (
          <p className="mt-8 text-sm text-muted">Loading catalog…</p>
        ) : state === "denied" || !state.isFaculty ? (
          <p className="mt-8 text-sm text-muted">
            This desk is for the dean. Sign in with that email to add courses.
            Everyone else uses the catalog.
          </p>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/office/new"
                className="md-interactive inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg"
              >
                New course from a tape
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/office/students"
                className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
              >
                Student progress
              </Link>
              <Link
                to="/inbox"
                className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
              >
                Student inbox
              </Link>
              <Link
                to="/office/users"
                className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
              >
                Users &amp; status
              </Link>
              <Link
                to="/office/feedback"
                className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
              >
                Course feedback
              </Link>
              <Link
                to="/office/certifications"
                className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
              >
                Certifications
              </Link>
              <Link
                to="/office/settings"
                className="md-interactive inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
              >
                Profile settings
              </Link>
            </div>
            <ol className="mt-8 grid gap-3">
              {state.courses.map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/office/$slug"
                    params={{ slug: c.slug }}
                    className="md-interactive md-card flex flex-col gap-1 rounded-xl border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        {c.published ? "Published" : "Draft"} · {c.stationCount}{" "}
                        stations
                      </p>
                      <h2 className="mt-1 font-display text-xl">{c.title}</h2>
                      <p className="mt-1 text-sm text-muted">{c.tagline}</p>
                    </div>
                    <span className="text-sm text-muted">Edit</span>
                  </Link>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
    </div>
  );
}
