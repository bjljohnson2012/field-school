import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CampusChat } from "@/components/campus-chat";
import { SiteHeader } from "@/components/site-header";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  listCampusInbox,
  listCampusStudents,
  seedTestStudents,
} from "@/lib/course/campus";

export const Route = createFileRoute("/inbox")({
  validateSearch: (s: Record<string, unknown>): { student?: string } => {
    const student = typeof s.student === "string" ? s.student : undefined;
    return student ? { student } : {};
  },
  component: InboxPage,
});

type Inbox = Awaited<ReturnType<typeof listCampusInbox>>;
type Roster = Awaited<ReturnType<typeof listCampusStudents>>;

function InboxPage() {
  const { user, isPending } = useCurrentUserState();
  const { student } = Route.useSearch();
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [query, setQuery] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const faculty = inbox?.faculty ?? false;

  const loadRoster = useMemo(
    () => () =>
      listCampusStudents()
        .then(setRoster)
        .catch(() => setRoster([])),
    [],
  );

  useEffect(() => {
    if (isPending || !user) return;
    listCampusInbox()
      .then((next) => {
        setInbox(next);
        setError(null);
        if (next.faculty) void loadRoster();
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load inbox.");
      });
  }, [user, isPending, loadRoster]);

  async function onSeed() {
    setSeeding(true);
    setError(null);
    try {
      await seedTestStudents();
      await loadRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create test students.");
    } finally {
      setSeeding(false);
    }
  }

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted">Opening inbox…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const filtered = (roster ?? []).filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  });
  const selected =
    student ?? (faculty ? filtered[0]?.studentId : user.id);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Campus chat</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {faculty ? "Student inbox" : "Ask the dean"}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          {faculty
            ? "Pick any student and send a message — even before they write in. Everyone who signed in with Google, X, or a campus account is listed."
            : "Questions about a station, quiz, or certificate land on the dean’s desk."}
        </p>

        {error ? (
          <p className="mt-8 text-sm text-warn">{error}</p>
        ) : (
          <div className={`mt-8 grid gap-4 ${faculty ? "lg:grid-cols-[18rem_1fr]" : ""}`}>
            {faculty ? (
              <aside className="flex flex-col rounded-xl border border-border bg-surface">
                <div className="border-b border-border p-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search students…"
                    className="md-field h-9 w-full rounded-lg border border-border bg-bg px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void onSeed()}
                    disabled={seeding}
                    className="md-interactive mt-2 h-9 w-full rounded-lg border border-border px-3 text-xs font-medium disabled:opacity-50"
                  >
                    {seeding ? "Creating…" : "Create test students"}
                  </button>
                </div>
                {roster === null ? (
                  <p className="p-4 text-sm text-muted">Loading students…</p>
                ) : filtered.length === 0 ? (
                  <p className="p-4 text-sm text-muted">
                    {roster.length === 0
                      ? "No campus accounts yet. Create test students to see the flow."
                      : "No students match that search."}
                  </p>
                ) : (
                  <ul className="max-h-[32rem] overflow-y-auto">
                    {filtered.map((r) => (
                      <li key={r.studentId}>
                        <Link
                          to="/inbox"
                          search={{ student: r.studentId }}
                          className={`md-interactive block border-b border-border px-4 py-3 ${
                            selected === r.studentId ? "bg-raised" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">{r.name}</p>
                            {r.unread > 0 ? (
                              <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-fg">
                                {r.unread}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted">{r.email}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted">
                            {r.lastBody || "No messages yet — start the thread."}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            ) : null}
            {faculty && !selected ? (
              <p className="text-sm text-muted">
                Pick a student, or create test students to try it out.
              </p>
            ) : (
              <CampusChat
                key={selected}
                studentId={faculty ? selected : undefined}
                emptyHint={
                  faculty
                    ? "No messages yet. Send the first one to open the thread."
                    : "No messages yet. Start with the station or exam that’s blocking you."
                }
                onSent={faculty ? loadRoster : undefined}
              />
            )}
          </div>
        )}
        {faculty ? (
          <p className="mt-6 text-xs text-muted">
            Looking for progress?{" "}
            <Link
              to="/office/students"
              className="md-interactive rounded px-1 underline-offset-2 hover:underline"
            >
              Open the progress board
            </Link>
            .
          </p>
        ) : null}
      </main>
    </div>
  );
}
