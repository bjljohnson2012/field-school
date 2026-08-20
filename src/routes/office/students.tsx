import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { getAdminProgressBoard } from "@/lib/course/campus";

export const Route = createFileRoute("/office/students")({
  component: StudentsPage,
});

type Board = Awaited<ReturnType<typeof getAdminProgressBoard>>;

function StudentsPage() {
  const { user, isPending } = useCurrentUserState();
  const [board, setBoard] = useState<Board | null | "denied">(null);

  useEffect(() => {
    if (isPending || !user) return;
    getAdminProgressBoard()
      .then(setBoard)
      .catch(() => setBoard("denied"));
  }, [user, isPending]);

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted">Loading the board…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Dean’s office</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Student progress</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Everyone who signed in with Google, X, or a campus account appears
          here. Guests stay on their own browser and do not show up.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/inbox"
            className="md-interactive inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            Open inbox
          </Link>
          <Link
            to="/office"
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Back to catalog
          </Link>
        </div>

        {board === null ? (
          <p className="mt-8 text-sm text-muted">Reading enrollments…</p>
        ) : board === "denied" ? (
          <p className="mt-8 text-sm text-muted">This board is for the dean account.</p>
        ) : board.students.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No campus accounts yet.</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  {board.courses.map((course) => (
                    <th key={course.slug} className="px-4 py-3 font-medium">
                      {course.title}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium">Chat</th>
                </tr>
              </thead>
              <tbody>
                {board.students.map((student) => (
                  <tr key={student.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted">{student.email}</p>
                    </td>
                    {student.courses.map((course) => (
                      <td key={course.slug} className="px-4 py-3 text-muted">
                        {course.completedStations}/{course.requiredStations}
                        {course.certified
                          ? " · certified"
                          : course.examPassed
                            ? " · exam"
                            : course.examScore !== null
                              ? ` · exam ${course.examScore}`
                              : ""}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Link
                        to="/inbox"
                        search={{ student: student.id }}
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
