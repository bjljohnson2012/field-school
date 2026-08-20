import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { listAllFeedback } from "@/lib/course/campus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/office/feedback")({
  component: FeedbackPage,
});

type Feedback = Awaited<ReturnType<typeof listAllFeedback>>;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            rating >= n ? "fill-accent text-accent" : "text-muted",
          )}
        />
      ))}
    </span>
  );
}

function FeedbackPage() {
  const { user, isPending } = useCurrentUserState();
  const [items, setItems] = useState<Feedback | null | "denied">(null);

  useEffect(() => {
    if (isPending || !user) return;
    listAllFeedback()
      .then(setItems)
      .catch(() => setItems("denied"));
  }, [user, isPending]);

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-4xl px-4 py-16 text-sm text-muted">Loading feedback…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Admin</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Course feedback</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Ratings and notes learners leave after a course. Only admins see this.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/office"
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Back to catalog
          </Link>
          <Link
            to="/office/users"
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Users &amp; status
          </Link>
        </div>

        {items === null ? (
          <p className="mt-8 text-sm text-muted">Reading feedback…</p>
        ) : items === "denied" ? (
          <p className="mt-8 text-sm text-muted">This page is for the dean account.</p>
        ) : items.length === 0 ? (
          <p className="mt-8 text-sm text-muted">
            No feedback yet. It appears here once a signed-in learner rates a course.
          </p>
        ) : (
          <ul className="mt-8 grid gap-3">
            {items.map((f) => (
              <li
                key={f.id}
                className="md-card rounded-xl border border-border bg-surface px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Stars rating={f.rating} />
                    <span className="text-sm font-medium">{f.courseTitle}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {f.comment ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {f.comment}
                  </p>
                ) : (
                  <p className="mt-2 text-sm italic text-muted">No comment.</p>
                )}
                <p className="mt-2 text-xs text-muted">
                  {f.studentName}
                  {f.studentEmail ? ` · ${f.studentEmail}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
