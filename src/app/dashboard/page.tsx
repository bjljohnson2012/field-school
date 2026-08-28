"use client";

import Link from "next/link";
import { usePortal } from "@/hooks/use-portal";
import { listPublishedCourses } from "@/lib/course/catalog";
import { courseTally } from "@/lib/portal";
import { assessmentTools } from "@/lib/tools/registry";
import { formatDay } from "@/lib/utils";

export default function DashboardPage() {
  const { ready, session, tools, isStaff, impersonating } = usePortal();
  const courses = listPublishedCourses();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Portal
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Dashboard</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {session
          ? `Signed in as ${session.name}${session.role === "guest" ? " (guest)" : session.role === "admin" ? " (admin)" : " (free beta)"}${impersonating ? " — impersonating" : ""}. Courses and tools stay on this portal.`
          : "Join the free beta, continue as a guest, or sign in. Progress still saves on this device."}
      </p>
      {isStaff && !impersonating ? (
        <Link
          href="/admin/demo"
          className="mt-6 inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
        >
          Run the student demo
        </Link>
      ) : null}
      {!session ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Join free beta
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
          >
            Back to campus
          </Link>
        </div>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">Courses</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {courses.map((c) => {
            const tally = ready ? courseTally(c.slug) : { passed: 0, total: c.stationCount, exam: null, certified: false };
            return (
              <Link
                key={c.slug}
                href={`/c/${c.slug}`}
                className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {c.kicker}
                </p>
                <h3 className="mt-1 font-display text-2xl tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stations {tally.passed}/{tally.total}
                  {tally.exam
                    ? ` · exam ${tally.exam.score}`
                    : " · exam not taken"}
                  {tally.certified ? " · certificate ready" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">Assessments</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {assessmentTools.map((tool) => {
            const result = tools[tool.slug];
            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {tool.status === "live" ? "Live" : "Coming later"}
                </p>
                <h3 className="mt-1 font-display text-xl tracking-tight">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {result
                    ? `${result.summary} · ${formatDay(result.completedAt)}`
                    : tool.status === "live"
                      ? "Not taken yet. Results will land here."
                      : tool.comingNote}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
