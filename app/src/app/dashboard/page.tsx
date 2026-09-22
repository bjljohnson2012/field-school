"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePortal } from "@/hooks/use-portal";
import { listPublishedCourses } from "@/lib/course/catalog";
import { courseTally } from "@/lib/portal";
import { assessmentTools } from "@/lib/tools/registry";
import { formatDay } from "@/lib/utils";

export default function DashboardPage() {
  const { data: authSession } = useSession();
  const { ready, session, tools, impersonating } = usePortal();
  const courses = listPublishedCourses();
  const seatLabel = authSession?.user?.seatLabel;
  const [nextStation, setNextStation] = useState<{ href: string; title: string } | null>(null);
  const [activeOrg, setActiveOrg] = useState("");
  const [children, setChildren] = useState<
    { membershipId: string; name: string; welcomeWatched: boolean; patternTitle: string | null; locked: boolean; note: string }[]
  >([]);

  useEffect(() => {
    if (!authSession?.user?.email) return;
    void fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        const slug = data.activeOrg?.slug || "";
        setActiveOrg(slug);
        const course = slug === "household" ? "home" : slug === "sales" ? "sales" : "grok-bot";
        const next = fetch(`/api/chooser?course=${course}`).then((r) => r.json());
        if (slug === "household") {
          void fetch("/api/children", { headers: { "x-fs-org": "household" } })
            .then((r) => r.json())
            .then((body) => {
              if (body?.children) setChildren(body.children);
            })
            .catch(() => undefined);
        } else {
          setChildren([]);
        }
        return next;
      })
      .then((data) => {
        if (data?.next?.href) setNextStation({ href: data.next.href, title: data.next.title });
      })
      .catch(() => undefined);
  }, [authSession?.user?.email]);
  const household = activeOrg === "household";
  const sales = activeOrg === "sales";
  const hideGrokBot = household || sales;
  const signedIn = Boolean(authSession?.user?.email);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Portal
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Learn</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {signedIn
          ? session
            ? `Signed in as ${session.name}${session.role === "guest" ? "" : session.role === "admin" ? " (admin)" : ` (${seatLabel || "member"})`}${impersonating ? ", impersonating" : ""}. Courses and assessments stay on this desk.`
            : "Signed in. Courses and assessments stay on this desk."
          : "Join the free beta, continue as a guest, or sign in. Progress still saves on this device."}
      </p>
      {!signedIn && !session ? (
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

      {nextStation ? (
        <p className="mt-6 text-sm">
          Chooser (reads Field Pattern, does not rewrite the pack):{" "}
          <Link href={nextStation.href} className="underline underline-offset-4">
            {nextStation.title}
          </Link>
        </p>
      ) : null}

      {household ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl tracking-tight">Children</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Parent-facing children/subusers database. Kids have no own login.
            Record feedback and progress here.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {children.length === 0 ? (
              <Link
                href="/children"
                className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Household
                </p>
                <h3 className="mt-1 font-display text-2xl tracking-tight">
                  Add a child
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the children/subusers database.
                </p>
              </Link>
            ) : (
              children.map((child) => (
                <Link
                  key={child.membershipId}
                  href="/children"
                  className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Child · login none
                  </p>
                  <h3 className="mt-1 font-display text-2xl tracking-tight">
                    {child.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Welcome {child.welcomeWatched ? "watched" : "not yet"}
                    {child.patternTitle ? ` · ${child.patternTitle}` : " · Pattern not run"}
                    {child.locked ? " · locked" : ""}
                    {child.note ? " · note on file" : ""}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">Courses</h2>
        {hideGrokBot ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Link
              href={household ? "/o/household/welcome" : "/o/sales/welcome"}
              className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {household ? "home:welcome" : "sales:welcome"}
              </p>
              <h3 className="mt-1 font-display text-2xl tracking-tight">
                {household ? "Household welcome" : "Welcome to the desk"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {household
                  ? "Household lesson. Grok Bot is not in this catalog."
                  : "Sales lesson. Household Pattern stays off this board."}
              </p>
            </Link>
            {sales ? (
              <Link
                href="/skills"
                className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Sales diagnostic
                </p>
                <h3 className="mt-1 font-display text-2xl tracking-tight">Desk skills</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Discovery, qualification, next step.
                </p>
              </Link>
            ) : null}
          </div>
        ) : (
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
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">Assessments</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Field Pattern is the personality assessment. It is not a course.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {!sales ? (
            <Link
              href="/pattern"
              className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Personality
              </p>
              <h3 className="mt-1 font-display text-2xl tracking-tight">Field Pattern</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                fp-50-v1. Living profile on the person. Skills stay org-scoped.
              </p>
            </Link>
          ) : null}
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
