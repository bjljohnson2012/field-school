"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { useCoursePortal } from "@/hooks/use-portal";
import { getCourse } from "@/lib/course/catalog";
import { cn } from "@/lib/utils";

export function CourseFrame({ courseSlug, children }: { courseSlug: string; children: ReactNode }) {
  const course = getCourse(courseSlug);
  const { tally } = useCoursePortal(courseSlug);

  if (!course) return <>{children}</>;

  const total = tally.total || course.modules.length;
  const pct = total ? Math.round((tally.passed / total) * 100) : 0;

  const progress = (
    <div className="mb-4">
      <p className="truncate text-sm font-medium">{course.title}</p>
      <p className="mt-1 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {tally.passed} of {total} stations passed
        </span>
        <span className="tabular-nums">{pct}%</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        <div className="h-full rounded-full bg-foreground transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto grid w-full max-w-6xl lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:items-start">
      <aside className="hidden px-4 py-6 lg:sticky lg:top-14 lg:block lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:border-r lg:border-border lg:py-8">
        {progress}
        <StationList courseSlug={course.slug} />
      </aside>
      <div className="min-w-0">
        <details className="border-b border-border px-4 py-3 lg:hidden">
          <summary className="cursor-pointer text-sm font-medium">
            Course outline
            <span className="ml-2 text-muted-foreground">
              {tally.passed}/{total}
            </span>
          </summary>
          <div className="mt-3">
            {progress}
            <StationList courseSlug={course.slug} />
          </div>
        </details>
        <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>
      </div>
    </div>
  );
}

function StationList({ courseSlug }: { courseSlug: string }) {
  const course = getCourse(courseSlug);
  const pathname = usePathname();
  const { course: state, tally } = useCoursePortal(courseSlug);
  if (!course) return null;

  function on(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav aria-label="Course outline" className="space-y-0.5">
      <OutlineLink href={`/c/${course.slug}`} active={on(`/c/${course.slug}`, true)} label="Overview" />
      <p className="px-2 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Stations</p>
      {course.modules.map((mod) => (
        <OutlineLink
          key={mod.slug}
          href={`/c/${course.slug}/s/${mod.slug}`}
          active={on(`/c/${course.slug}/s/${mod.slug}`)}
          label={mod.title}
          mark={mod.station}
          done={Boolean(state?.modules[mod.slug]?.passed)}
        />
      ))}
      <OutlineLink href={`/c/${course.slug}/desk`} active={on(`/c/${course.slug}/desk`)} label="Desk" />
      <OutlineLink href={`/c/${course.slug}/exam`} active={on(`/c/${course.slug}/exam`)} label="Exam" />
      {tally.certified ? (
        <OutlineLink href={`/c/${course.slug}/certificate`} active={on(`/c/${course.slug}/certificate`)} label="Certificate" done />
      ) : null}
    </nav>
  );
}

function OutlineLink({
  href,
  label,
  active,
  mark,
  done,
}: {
  href: string;
  label: string;
  active: boolean;
  mark?: string;
  done?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2 rounded-lg px-2 text-sm",
        active ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      {mark ? <span className="w-5 shrink-0 font-mono text-[11px]">{mark}</span> : <span className="w-5 shrink-0" />}
      <span className="truncate">{label}</span>
      {done ? <Check className="ml-auto size-3.5 shrink-0 text-pass" aria-label="Passed" /> : null}
    </Link>
  );
}
