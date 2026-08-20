import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CampusChat } from "@/components/campus-chat";
import { SiteHeader } from "@/components/site-header";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listCampusInbox } from "@/lib/course/campus";

export const Route = createFileRoute("/inbox")({
  validateSearch: (s: Record<string, unknown>): { student?: string } => {
    const student = typeof s.student === "string" ? s.student : undefined;
    return student ? { student } : {};
  },
  component: InboxPage,
});

type Inbox = Awaited<ReturnType<typeof listCampusInbox>>;

function InboxPage() {
  const { user, isPending } = useCurrentUserState();
  const { student } = Route.useSearch();
  const [inbox, setInbox] = useState<Inbox | null | "error">(null);

  useEffect(() => {
    if (isPending || !user) return;
    listCampusInbox()
      .then(setInbox)
      .catch(() => setInbox("error"));
  }, [user, isPending, student]);

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted">Opening inbox…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const faculty = inbox && inbox !== "error" ? inbox.faculty : false;
  const selected =
    student ??
    (inbox && inbox !== "error" && inbox.faculty ? inbox.threads[0]?.studentId : user.id);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Campus chat</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {faculty ? "Student questions" : "Ask the dean"}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          {faculty
            ? "Reply to anyone who signed in with Google, X, or a campus account."
            : "Questions about a station, quiz, or certificate land on the dean’s desk."}
        </p>

        {inbox === "error" ? (
          <p className="mt-8 text-sm text-warn">Could not load inbox.</p>
        ) : (
          <div className={`mt-8 grid gap-4 ${faculty ? "lg:grid-cols-[16rem_1fr]" : ""}`}>
            {faculty ? (
              <aside className="rounded-xl border border-border bg-surface">
                {inbox === null ? (
                  <p className="p-4 text-sm text-muted">Loading threads…</p>
                ) : inbox.threads.length === 0 ? (
                  <p className="p-4 text-sm text-muted">No student messages yet.</p>
                ) : (
                  <ul>
                    {inbox.threads.map((thread) => (
                      <li key={thread.studentId}>
                        <Link
                          to="/inbox"
                          search={{ student: thread.studentId }}
                          className={`md-interactive block border-b border-border px-4 py-3 ${
                            selected === thread.studentId ? "bg-raised" : ""
                          }`}
                        >
                          <p className="text-sm font-medium">{thread.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted">{thread.lastBody}</p>
                          {thread.unread > 0 ? (
                            <p className="mt-1 text-xs text-accent">{thread.unread} unread</p>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            ) : null}
            {faculty && !selected ? (
              <p className="text-sm text-muted">Pick a student thread.</p>
            ) : (
              <CampusChat
                studentId={faculty ? selected : undefined}
                emptyHint="No messages yet. Start with the station or exam that’s blocking you."
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
