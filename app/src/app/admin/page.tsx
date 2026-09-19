"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePortal } from "@/hooks/use-portal";
import { listPublishedCourses } from "@/lib/course/catalog";
import { courseTally, resetDemo } from "@/lib/portal";
import { assessmentTools } from "@/lib/tools/registry";
import { formatDay } from "@/lib/utils";

type RosterPerson = { org: string; kind: string };
type ChildProgress = { welcomeWatched: boolean; patternTitle: string | null; locked: boolean };

export default function AdminPage() {
  const { isStaff, unreadNotices, users, ready, tools } = usePortal();
  const courses = listPublishedCourses();
  const [roster, setRoster] = useState<RosterPerson[]>([]);
  const [kids, setKids] = useState<ChildProgress[]>([]);
  const [pendingAccess, setPendingAccess] = useState(0);

  useEffect(() => {
    if (!ready || !isStaff) return;
    void fetch("/api/org/people")
      .then((r) => r.json())
      .then((data) => setRoster(data.people ?? []))
      .catch(() => undefined);
    void fetch("/api/children", { headers: { "x-fs-org": "household" } })
      .then((r) => r.json())
      .then((data) => setKids(data.children ?? []))
      .catch(() => undefined);
    void fetch("/api/admin/access-requests")
      .then((r) => r.json())
      .then((data) => {
        const rows = data.requests ?? [];
        setPendingAccess(rows.filter((row: { status?: string }) => row.status === "pending").length);
      })
      .catch(() => undefined);
  }, [ready, isStaff]);

  if (!ready || !isStaff) return null;

  const householdKids = kids.length;
  const patternRun = kids.filter((kid) => kid.patternTitle).length;
  const welcomeDone = kids.filter((kid) => kid.welcomeWatched).length;
  const peopleCount = roster.length || users.length;
  const orgCount = new Set(roster.map((row) => row.org)).size;

  const startHere = [
    {
      href: "/children",
      title: "Children database",
      body: "Parent-facing children/subusers. Say child, not student. Kids have no own login. Parent records progress.",
    },
    {
      href: "/o/household",
      title: "Open household",
      body: "Household org. Add a child. Parent records feedback and progress. Kids have no own login.",
    },
    {
      href: "/o/sales",
      title: "Open sales",
      body: "Sales org. Trainer stance. Events stay off household.",
    },
    {
      href: "/pattern",
      title: "Run Field Pattern",
      body: "Personality assessment. Lives under Assessments. Writes the member profile.",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Staff
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Admin</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Start here. Courses are lessons. Assessments are Pattern and tools.
        Inbox is only on this desk.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-tight">Start here</h2>
        <p className="mt-2 text-sm text-muted-foreground">Do this first.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {startHere.map((step, i) => (
            <Link
              key={step.href}
              href={step.href}
              className="flex flex-col rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
            >
              <p className="font-mono text-xs text-muted-foreground">
                0{i + 1}
              </p>
              <h3 className="mt-2 font-display text-2xl tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {step.body}
              </p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm">
                Open
                <ArrowRight className="size-4" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">Courses</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Lessons and stations. Not assessments.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Link
            href="/o/household/welcome"
            className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              home:welcome
            </p>
            <h3 className="mt-1 font-display text-2xl tracking-tight">
              Household welcome
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Household fixture. Grok Bot stays off this catalog.
            </p>
          </Link>
          <Link
            href="/o/sales/welcome"
            className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              sales:welcome
            </p>
            <h3 className="mt-1 font-display text-2xl tracking-tight">
              Welcome to the desk
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sales fixture. Household Pattern stays off this board.
            </p>
          </Link>
          {courses.map((c) => {
            const tally = courseTally(c.slug);
            return (
              <Link
                key={c.slug}
                href={`/c/${c.slug}`}
                className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Course
                </p>
                <h3 className="mt-1 font-display text-2xl tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stations {tally.passed}/{tally.total}
                  {tally.exam ? ` · exam ${tally.exam.score}` : " · exam not taken"}
                  {tally.certified ? " · certificate ready" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">Assessments</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Personality and tools. Field Pattern sits here.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Link
            href="/pattern"
            className="rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Personality
            </p>
            <h3 className="mt-1 font-display text-2xl tracking-tight">
              Field Pattern
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              fp-50-v1. Eight Bearing dimensions. Not a course.
            </p>
          </Link>
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
                      ? "Not taken yet."
                      : tool.comingNote}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">Progress</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          More surfaces than a single course tally. People, children, Pattern,
          Inbox, and access.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-card px-5 py-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              People
            </p>
            <p className="mt-2 font-display text-3xl">{peopleCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {orgCount ? `${orgCount} orgs. ` : ""}Open{" "}
              <Link href="/people" className="underline">
                View all
              </Link>
              .
            </p>
          </article>
          <article className="rounded-xl border border-border bg-card px-5 py-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Household children
            </p>
            <p className="mt-2 font-display text-3xl">{householdKids}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome {welcomeDone}/{householdKids || 0}.{" "}
              <Link href="/children" className="underline">
                Children database
              </Link>
              .
            </p>
          </article>
          <article className="rounded-xl border border-border bg-card px-5 py-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Field Pattern
            </p>
            <p className="mt-2 font-display text-3xl">{patternRun}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Child profiles with a Pattern title.{" "}
              <Link href="/pattern" className="underline">
                Open assessment
              </Link>
              .
            </p>
          </article>
          <article className="rounded-xl border border-border bg-card px-5 py-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Inbox
            </p>
            <p className="mt-2 font-display text-3xl">{unreadNotices}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Unread.{" "}
              <Link href="/admin/notifications" className="underline">
                Open Inbox
              </Link>
              .
            </p>
          </article>
          <article className="rounded-xl border border-border bg-card px-5 py-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Grok Bot
            </p>
            <p className="mt-2 font-display text-3xl">
              {courseTally("grok-bot").passed}/{courseTally("grok-bot").total}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Stations passed on this seat.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-card px-5 py-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Access requests
            </p>
            <p className="mt-2 font-display text-3xl">{pendingAccess}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pending.{" "}
              <Link href="/admin/access-requests" className="underline">
                Review
              </Link>
              .
            </p>
          </article>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/admin/demo"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
        >
          Student demo
        </Link>
        <button
          type="button"
          className="h-10 rounded-xl border border-border px-4 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => resetDemo()}
        >
          Reset demo data
        </button>
      </div>
    </main>
  );
}
