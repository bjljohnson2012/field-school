import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { UNI_SHORT, type CourseRecord } from "@/lib/course/types";

export function SiteHeader({
  course,
  passed,
  total,
}: {
  course?: Pick<CourseRecord, "slug" | "title" | "kicker"> | null;
  passed?: number;
  total?: number;
}) {
  const { user, isPending } = useCurrentUserState();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <Link to="/" className="font-display text-lg tracking-tight">
            {UNI_SHORT}
          </Link>
          {course ? (
            <Link
              to="/c/$courseSlug"
              params={{ courseSlug: course.slug }}
              className="hidden truncate text-xs uppercase tracking-[0.16em] text-muted sm:inline"
            >
              {course.kicker || course.title}
            </Link>
          ) : (
            <span className="hidden text-xs uppercase tracking-[0.16em] text-muted sm:inline">
              University
            </span>
          )}
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/office"
            className="flex h-11 items-center px-3 text-muted hover:text-fg"
          >
            Office
          </Link>
          {course ? (
            <>
              <Link
                to="/c/$courseSlug/desk"
                params={{ courseSlug: course.slug }}
                className="flex h-11 items-center px-3 text-muted hover:text-fg"
              >
                Desk
              </Link>
              <Link
                to="/c/$courseSlug/exam"
                params={{ courseSlug: course.slug }}
                className="flex h-11 items-center px-3 text-muted hover:text-fg"
              >
                Exam
              </Link>
            </>
          ) : null}
          {typeof passed === "number" && typeof total === "number" ? (
            <span className="hidden h-8 items-center rounded-sm border border-border px-2 font-mono text-xs tabular-nums text-muted md:inline-flex">
              {passed}/{total}
            </span>
          ) : null}
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-raised" />
          ) : user ? (
            <UserButton />
          ) : (
            <Link
              to="/login"
              className="ml-1 flex h-9 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-fg"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
