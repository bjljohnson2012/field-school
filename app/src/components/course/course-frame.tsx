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
    <div className="mx-auto grid w-full max-w-6xl lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:items-start">
      <aside className="hidden lg:sticky lg:top-14 lg:flex lg:h-[calc(100vh-3.5rem)] lg:flex-col lg:border-r lg:border-border lg:bg-secondary/30">
        <div className="border-b border-border px-4 py-4">{progress}</div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-16 pt-3">
          <StationList courseSlug={course.slug} />
        </div>
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
    <nav aria-label="Course outline">
      <OutlineLink href={`/c/${course.slug}`} active={on(`/c/${course.slug}`, true)} label="Overview" />
      <div className="mt-4">
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-[10px] font-medium text-background">
            1
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Chapter</span>
            <span className="block truncate text-sm font-medium">The ladder</span>
          </span>
        </div>
        <ol className="mt-1">
          {course.modules.map((mod) => (
            <li key={mod.slug}>
              <ActivityLink
                href={`/c/${course.slug}/s/${mod.slug}`}
                active={on(`/c/${course.slug}/s/${mod.slug}`)}
                label={mod.title}
                meta={`Station ${mod.station} · ${mod.durationLabel}`}
                done={Boolean(state?.modules[mod.slug]?.passed)}
              />
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-3 border-t border-border pt-2">
        <OutlineLink href={`/c/${course.slug}/desk`} active={on(`/c/${course.slug}/desk`)} label="Desk" />
        <OutlineLink href={`/c/${course.slug}/exam`} active={on(`/c/${course.slug}/exam`)} label="Exam" />
        {tally.certified ? (
          <OutlineLink href={`/c/${course.slug}/certificate`} active={on(`/c/${course.slug}/certificate`)} label="Certificate" done />
        ) : null}
      </div>
    </nav>
  );
}

function ActivityLink({
  href,
  label,
  meta,
  active,
  done,
}: {
  href: string;
  label: string;
  meta: string;
  active: boolean;
  done?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-start gap-2 border-s-2 py-2 pl-2 pr-2",
        active ? "border-primary bg-secondary" : "border-transparent text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
      )}
    >
      {done ? (
        <Check className="mt-0.5 size-3.5 shrink-0 text-pass" aria-label="Passed" />
      ) : (
        <span className="mt-1 size-3 shrink-0 rounded-full border border-current" aria-hidden="true" />
      )}
      <span className="min-w-0">
        <span className={cn("block truncate text-sm", active && "font-medium text-foreground")}>{label}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{meta}</span>
      </span>
    </Link>
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
      {mark ? (
        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-background px-1 font-mono text-[10px] text-muted-foreground">
          {mark}
        </span>
      ) : (
        <span className="w-5 shrink-0" />
      )}
      <span className="truncate">{label}</span>
      {done ? <Check className="ml-auto size-3.5 shrink-0 text-pass" aria-label="Passed" /> : null}
    </Link>
  );
}
