import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { getUsersStatus } from "@/lib/course/campus";

export const Route = createFileRoute("/office/users")({
  component: UsersPage,
});

type Users = Awaited<ReturnType<typeof getUsersStatus>>;

function fmtDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function UsersPage() {
  const { user, isPending } = useCurrentUserState();
  const [users, setUsers] = useState<Users | null | "denied">(null);

  useEffect(() => {
    if (isPending || !user) return;
    getUsersStatus()
      .then(setUsers)
      .catch(() => setUsers("denied"));
  }, [user, isPending]);

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted">Loading users…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Admin</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Users &amp; status</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Everyone with a campus account, their role, and where they are in the
          ladder. Guests never appear here.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/office"
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Back to catalog
          </Link>
          <Link
            to="/office/students"
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Progress board
          </Link>
          <Link
            to="/office/feedback"
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Course feedback
          </Link>
        </div>

        {users === null ? (
          <p className="mt-8 text-sm text-muted">Reading accounts…</p>
        ) : users === "denied" ? (
          <p className="mt-8 text-sm text-muted">This page is for the dean account.</p>
        ) : users.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No campus accounts yet.</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Enrolled</th>
                  <th className="px-4 py-3 font-medium">Certified</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Last active</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          u.role === "student"
                            ? "bg-raised text-muted"
                            : "bg-accent/15 text-accent"
                        }`}
                      >
                        {u.role === "student" ? "Student" : "Admin"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{u.enrolledCount}</td>
                    <td className="px-4 py-3 text-muted">{u.certifiedCount}</td>
                    <td className="px-4 py-3 text-muted">{fmtDate(u.joinedAt)}</td>
                    <td className="px-4 py-3 text-muted">{fmtDate(u.lastActivity)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to="/inbox"
                        search={{ student: u.id }}
                        className="md-interactive rounded-lg px-2 py-1 text-sm"
                      >
                        Message
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
