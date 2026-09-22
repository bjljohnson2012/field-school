"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOutPortal } from "@/lib/auth/sign-out";
import { usePortal } from "@/hooks/use-portal";
import { OrgPicker } from "@/components/org-picker";
import { ThemeToggle } from "@/components/theme-toggle";

const LEADER_STANCES = new Set(["admin", "guardian", "trainer", "teacher"]);

const NEW_DOORS = [
  { href: "/library/video", label: "Long-form video" },
  { href: "/library/wizard", label: "Wizard" },
  { href: "/settings/ai", label: "Connect AI" },
] as const;

const linkClass =
  "flex h-11 items-center px-2 text-muted-foreground hover:text-foreground sm:px-2.5";

function NewMenu() {
  return (
    <details className="relative">
      <summary className={`${linkClass} cursor-pointer list-none`}>
        New
      </summary>
      <div className="absolute right-0 z-40 mt-1 flex min-w-44 flex-col rounded-xl border border-border bg-background p-1 shadow-md">
        {NEW_DOORS.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className={`${linkClass} whitespace-nowrap`}
            onClick={(event) => {
              const root = event.currentTarget.closest("details");
              if (root) root.open = false;
            }}
          >
            {door.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

type NavLink = { href: string; label: string };

function navLinks(opts: {
  loggedIn: boolean;
  guest: boolean;
  leader: boolean;
  org: string;
}): NavLink[] {
  if (!opts.loggedIn) {
    return opts.guest ? [{ href: "/about", label: "About" }] : [];
  }
  const org = opts.org;
  if (!opts.leader) {
    return [
      { href: "/dashboard", label: "Learn" },
      { href: org === "sales" ? "/skills" : "/pattern", label: "Me" },
    ];
  }
  return [
    { href: "/dashboard", label: "Learn" },
    { href: "/people", label: "People" },
    { href: org ? `/o/${org}/l` : "/dashboard", label: "Library" },
    { href: "/insights", label: "Insights" },
  ];
}

export function SiteHeader() {
  const { data: authSession, status } = useSession();
  const { session, ready } = usePortal();
  const guestChrome = status === "unauthenticated";
  const loggedIn = status === "authenticated" && Boolean(authSession?.user?.email);
  const initial = (session?.name || "G").slice(0, 1).toUpperCase();
  const homeHref = guestChrome ? "/" : "/dashboard";
  const [stance, setStance] = useState("");
  const [org, setOrg] = useState("");

  useEffect(() => {
    if (!loggedIn) {
      setStance("");
      setOrg("");
      return;
    }
    void fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setStance(data.activeOrg?.stance || "");
        setOrg(data.activeOrg?.slug || "");
      })
      .catch(() => undefined);
  }, [loggedIn]);

  const leader = LEADER_STANCES.has(stance);
  const links = navLinks({
    loggedIn,
    guest: guestChrome,
    leader,
    org,
  });
  const showNew = loggedIn && leader;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={homeHref} className="flex items-center rounded-lg px-1.5 py-0.5">
            <img
              src="/branding/assets/isolated-seal.png"
              alt="Field School"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </Link>
          <Link
            href={homeHref}
            className="hidden text-sm text-foreground sm:inline"
          >
            Field School
          </Link>
        </div>
        <nav className="flex items-center gap-0.5 text-sm">
          <div className="hidden items-center gap-0.5 md:flex">
            {links.map((l) => (
              <Link key={l.label} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            ))}
          </div>
          {showNew ? <NewMenu /> : null}
          <details className="relative md:hidden">
            <summary className="flex h-11 cursor-pointer list-none items-center px-2 text-muted-foreground">
              Menu
            </summary>
            <div className="absolute right-0 z-40 mt-1 flex min-w-40 flex-col rounded-xl border border-border bg-background p-1 shadow-md">
              {links.map((l) => (
                <Link key={l.label} href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              ))}
            </div>
          </details>
          {loggedIn ? <OrgPicker /> : null}
          {loggedIn ? (
            <Link href="/metering" className="flex h-11 items-center px-2 text-sm text-muted-foreground hover:text-foreground">
              Credits
            </Link>
          ) : null}
          {status === "loading" || !ready ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
          ) : loggedIn ? (
            <details className="relative ml-1">
              <summary className="grid size-8 cursor-pointer list-none place-items-center rounded-full bg-foreground text-xs font-medium text-background">
                {initial}
              </summary>
              <div className="absolute right-0 z-40 mt-1 flex min-w-40 flex-col gap-2 rounded-xl border border-border bg-background p-3 shadow-md">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => signOutPortal("/login")}
                  className="h-11 text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </div>
            </details>
          ) : (
            <div className="ml-1 flex items-center gap-2">
              <Link
                href="/login"
                className="hidden h-11 items-center text-sm text-muted-foreground hover:text-foreground sm:flex"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="flex h-9 items-center rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                Join free
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
