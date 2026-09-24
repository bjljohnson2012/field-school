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
    <main className="mx-auto max-w-6xl px-6 py-8">
      <p className="eyebrow">Staff</p>
      <h1 className="h-page mt-2">Admin</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Start here. Courses are lessons. Assessments are Pattern and tools.
        Inbox is only on this desk.
      </p>

      <section className="mt-10">
        <h2 className="h-section">Start here</h2>
        <p className="mt-2 text-sm text-muted-foreground">Do this first.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {startHere.map((step, i) => (
            <Link
              key={step.href}
              href={step.href}
              className="card flex flex-col px-5 py-5 transition-all duration-200 ease-brand hover:-translate-y-px hover:shadow-card-hover"
            >
              <p className="eyebrow">0{i + 1}</p>
              <h3 className="h-card mt-2">
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
        <h2 className="h-section">Courses</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Lessons and stations. Not assessments.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Link
            href="/o/household/welcome"
            className="card block px-5 py-5 transition-all duration-200 ease-brand hover:-translate-y-px hover:shadow-card-hover"
          >
            <p className="eyebrow">home:welcome</p>
            <h3 className="h-card mt-1">
              Household welcome
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Household fixture. Grok Bot stays off this catalog.
            </p>
          </Link>
          <Link
            href="/o/sales/welcome"
            className="card block px-5 py-5 transition-all duration-200 ease-brand hover:-translate-y-px hover:shadow-card-hover"
          >
            <p className="eyebrow">sales:welcome</p>
            <h3 className="h-card mt-1">
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
                className="card block px-5 py-5 transition-all duration-200 ease-brand hover:-translate-y-px hover:shadow-card-hover"
              >
                <p className="eyebrow">Course</p>
                <h3 className="h-card mt-1">
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
        <h2 className="h-section">Assessments</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Personality and tools. Field Pattern sits here.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Link
            href="/pattern"
            className="card block px-5 py-5 transition-all duration-200 ease-brand hover:-translate-y-px hover:shadow-card-hover"
          >
            <p className="eyebrow">Personality</p>
            <h3 className="h-card mt-1">
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
                className="card block px-5 py-5 transition-all duration-200 ease-brand hover:-translate-y-px hover:shadow-card-hover"
              >
                <p className="eyebrow">
                  {tool.status === "live" ? "Live" : "Coming later"}
                </p>
                <h3 className="h-card mt-1">
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
        <h2 className="h-section">Progress</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          More surfaces than a single course tally. People, children, Pattern,
          Inbox, and access.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="card px-5 py-5">
            <p className="eyebrow">
              People
            </p>
            <p className="mt-2 font-sans text-3xl font-semibold tracking-tight">{peopleCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {orgCount ? `${orgCount} orgs. ` : ""}Open{" "}
              <Link href="/people" className="underline">
                View all
              </Link>
              .
            </p>
          </article>
          <article className="card px-5 py-5">
            <p className="eyebrow">
              Household children
            </p>
            <p className="mt-2 font-sans text-3xl font-semibold tracking-tight">{householdKids}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome {welcomeDone}/{householdKids || 0}.{" "}
              <Link href="/children" className="underline">
                Children database
              </Link>
              .
            </p>
          </article>
          <article className="card px-5 py-5">
            <p className="eyebrow">
              Field Pattern
            </p>
            <p className="mt-2 font-sans text-3xl font-semibold tracking-tight">{patternRun}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Child profiles with a Pattern title.{" "}
              <Link href="/pattern" className="underline">
                Open assessment
              </Link>
              .
            </p>
          </article>
          <article className="card px-5 py-5">
            <p className="eyebrow">
              Inbox
            </p>
            <p className="mt-2 font-sans text-3xl font-semibold tracking-tight">{unreadNotices}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Unread.{" "}
              <Link href="/admin/notifications" className="underline">
                Open Inbox
              </Link>
              .
            </p>
          </article>
          <article className="card px-5 py-5">
            <p className="eyebrow">
              Grok Bot
            </p>
            <p className="mt-2 font-sans text-3xl font-semibold tracking-tight">
              {courseTally("grok-bot").passed}/{courseTally("grok-bot").total}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Stations passed on this seat.
            </p>
          </article>
          <article className="card px-5 py-5">
            <p className="eyebrow">
              Access requests
            </p>
            <p className="mt-2 font-sans text-3xl font-semibold tracking-tight">{pendingAccess}</p>
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
          className="btn border border-input bg-card text-foreground hover:bg-muted"
        >
          Student demo
        </Link>
        <button
          type="button"
          className="btn border border-input bg-card text-muted-foreground hover:text-foreground"
          onClick={() => resetDemo()}
        >
          Reset demo data
        </button>
      </div>
    </main>
  );
}
