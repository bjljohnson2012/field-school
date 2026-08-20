import { Link, useRouterState } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { ShareCourseButton } from "@/components/share-course-button";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCampusNav } from "@/lib/course/campus";
import { UNI_SHORT, type CourseRecord } from "@/lib/course/types";
import { ThemeToggle } from "@/lib/theme";

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [nav, setNav] = useState<{ faculty: boolean; unread: number } | null>(null);

  useEffect(() => {
    if (!user) {
      setNav(null);
      return;
    }
    getCampusNav()
      .then(setNav)
      .catch(() => setNav({ faculty: false, unread: 0 }));
  }, [user]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/88 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <Link
            to="/"
            className="md-interactive rounded-lg px-1.5 py-0.5 font-display text-lg tracking-tight"
          >
            {UNI_SHORT}
          </Link>
          {course ? (
            <Link
              to="/c/$courseSlug"
              params={{ courseSlug: course.slug }}
              className="md-interactive hidden truncate rounded-lg px-1.5 py-0.5 text-xs uppercase tracking-[0.16em] text-muted sm:inline"
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
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="md-interactive md-nav flex h-11 items-center px-3 text-muted"
              >
                Dashboard
              </Link>
              <Link
                to="/inbox"
                className="md-interactive md-nav relative flex h-11 items-center px-3 text-muted"
              >
                Inbox
                {nav && nav.unread > 0 ? (
                  <span className="ml-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-fg">
                    {nav.unread}
                  </span>
                ) : null}
              </Link>
              {nav?.faculty ? (
                <Link
                  to="/office/students"
                  className="md-interactive md-nav hidden h-11 items-center px-3 text-muted sm:flex"
                >
                  Students
                </Link>
              ) : null}
            </>
          ) : null}
          <Link
            to="/office"
            className="md-interactive md-nav flex h-11 items-center px-3 text-muted"
          >
            Admin
          </Link>
          {course ? (
            <>
              <Link
                to="/c/$courseSlug/desk"
                params={{ courseSlug: course.slug }}
                className="md-interactive md-nav hidden h-11 items-center px-3 text-muted md:flex"
              >
                Desk
              </Link>
              <Link
                to="/c/$courseSlug/exam"
                params={{ courseSlug: course.slug }}
                className="md-interactive md-nav hidden h-11 items-center px-3 text-muted md:flex"
              >
                Exam
              </Link>
              <ShareCourseButton
                slug={course.slug}
                title={course.title}
                compact
                className="ml-1 hidden sm:inline-flex"
              />
            </>
          ) : null}
          {typeof passed === "number" && typeof total === "number" ? (
            <span className="hidden h-8 items-center rounded-lg border border-border px-2 font-mono text-xs tabular-nums text-muted md:inline-flex">
              {passed}/{total}
            </span>
          ) : null}
          <ThemeToggle />
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-raised" />
          ) : user ? (
            <UserButton />
          ) : (
            <div className="ml-1 flex items-center gap-1">
              <span className="hidden items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted sm:inline-flex">
                <UserRound className="size-3.5" />
                Guest
              </span>
              <Link
                to="/login"
                search={{ next: pathname }}
                className="md-interactive flex h-9 items-center rounded-xl bg-accent px-3 text-sm font-medium text-accent-fg"
              >
                Sign in
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
