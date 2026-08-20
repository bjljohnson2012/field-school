import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { getStudentDashboard } from "@/lib/course/campus";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

type Dashboard = Awaited<ReturnType<typeof getStudentDashboard>>;

function DashboardPage() {
  const { user, isPending } = useCurrentUserState();
  const [board, setBoard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending || !user) return;
    getStudentDashboard()
      .then((next) => {
        setBoard(next);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load progress.");
      });
  }, [user, isPending]);

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-4xl px-4 py-16 text-sm text-muted">Loading your dashboard…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Student desk</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Your progress</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Signed-in work stays on this campus account. Message the dean from
          inbox if a station or exam is stuck.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/inbox"
            className="md-interactive inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            Chat the dean
          </Link>
          {board?.faculty ? (
            <Link
              to="/office/students"
              className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
            >
              All student progress
            </Link>
          ) : null}
        </div>

        {error ? (
          <p className="mt-8 text-sm text-warn">{error}</p>
        ) : board === null ? (
          <p className="mt-8 text-sm text-muted">Reading enrollments…</p>
        ) : board.courses.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No published courses yet.</p>
        ) : (
          <ol className="mt-8 grid gap-3">
            {board.courses.map((course) => (
              <li key={course.slug}>
                <Link
                  to="/c/$courseSlug"
                  params={{ courseSlug: course.slug }}
                  className="md-interactive md-card block rounded-xl border border-border bg-surface px-4 py-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-2xl tracking-tight">{course.title}</h2>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      {course.certified
                        ? "Certified"
                        : course.examPassed
                          ? "Exam cleared"
                          : "In progress"}
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${course.percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {course.completedStations}/{course.requiredStations} stations
                    {course.examScore !== null
                      ? ` · latest exam ${course.examScore}`
                      : " · exam not yet taken"}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
