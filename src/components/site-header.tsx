"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutLocal } from "@/lib/portal";
import { usePortal } from "@/hooks/use-portal";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { session, ready, isAdmin, isStaff, impersonating, unreadNotices } =
    usePortal();
  const initial = (session?.name || "G").slice(0, 1).toUpperCase();
  const inboxHref = isAdmin && !impersonating ? "/admin/notifications" : "/inbox";
  const inboxCount = isStaff ? unreadNotices : 0;

  const links = [
    { href: "/dashboard", label: "Dashboard", compact: true },
    { href: inboxHref, label: "Inbox", compact: true, badge: inboxCount },
    { href: "/tools", label: "Tools", compact: true },
    { href: "/about", label: "About", compact: false },
    { href: "/admin", label: "Admin", compact: true, badge: isAdmin ? unreadNotices : 0 },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <Link
            href="/"
            className="rounded-lg px-1.5 py-0.5 font-display text-lg tracking-tight"
          >
            Field School
          </Link>
          <Link
            href="/"
            className="hidden text-xs uppercase tracking-[0.16em] text-muted-foreground sm:inline"
          >
            University
          </Link>
        </div>
        <nav className="flex items-center gap-0.5 text-sm">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                l.compact
                  ? "flex h-11 items-center gap-1.5 px-2 text-muted-foreground hover:text-foreground sm:px-2.5"
                  : "hidden h-11 items-center px-2.5 text-muted-foreground hover:text-foreground md:flex",
                (l.label === "Admin"
                  ? pathname.startsWith("/admin")
                  : l.label === "Inbox"
                    ? pathname === "/inbox" || pathname === "/admin/notifications"
                    : pathname === l.href) && "text-foreground",
              )}
            >
              {l.label}
              {l.badge ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                  {l.badge}
                </span>
              ) : null}
            </Link>
          ))}
          <ThemeToggle />
          {!ready ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
          ) : session ? (
            <div className="ml-1 flex items-center gap-2">
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-full bg-foreground text-xs font-medium text-background"
              >
                {initial}
              </span>
              <span className="hidden max-w-[9rem] truncate text-sm text-muted-foreground lg:inline">
                {session.email || session.name}
              </span>
              <button
                type="button"
                onClick={() => signOutLocal("/login")}
                className="h-11 text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-1 flex h-9 items-center rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
