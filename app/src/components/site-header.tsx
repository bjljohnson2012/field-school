"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutPortal } from "@/lib/auth/sign-out";
import { usePortal } from "@/hooks/use-portal";
import { activeDoor, type Door } from "@/lib/shell/routes";
import { accountItems, OPEN_PALETTE_EVENT, type ShellViewer } from "@/lib/shell/model";
import { LeaveReturnNext } from "@/components/leave-return-next";
import { OrgPicker } from "@/components/org-picker";
import { TasksNavBadge } from "@/components/tasks-nav-badge";
import { ThemeToggle } from "@/components/theme-toggle";

const LEADER_STANCES = new Set(["admin", "guardian", "trainer", "teacher"]);

export function isLeader(stance: string) {
  return LEADER_STANCES.has(stance);
}

export const NEW_DOORS: readonly { href: string; label: string; hint?: string }[] = [
  { href: "/library/video", label: "Long-form video" },
  { href: "/library/wizard", label: "Wizard", hint: "One branched flow" },
  { href: "/settings/ai", label: "Connect AI" },
];

function openPalette(event: { currentTarget: Element }) {
  const root = event.currentTarget.closest("details");
  if (root) root.open = false;
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

function closeMenu(event: { currentTarget: Element }) {
  const root = event.currentTarget.closest("details");
  if (root) root.open = false;
}

const linkClass =
  "flex h-11 items-center px-2 text-muted-foreground hover:text-foreground sm:px-2.5";
const currentClass = "flex h-11 items-center px-2 text-foreground underline underline-offset-8 sm:px-2.5";

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
            className={`${linkClass} gap-2 whitespace-nowrap`}
            onClick={closeMenu}
          >
            {door.label}
            {door.hint ? <span className="text-xs">{door.hint}</span> : null}
          </Link>
        ))}
      </div>
    </details>
  );
}

type NavLink = { href: string; label: string; door: Door };

const stoneLink =
  "flex h-11 items-center px-2 text-[#7a746a] hover:text-foreground sm:px-2.5";

function GuestOrgMenu() {
  return (
    <details className="relative">
      <summary className={`${stoneLink} cursor-pointer list-none`}>
        Org
      </summary>
      <div className="absolute right-0 z-40 mt-1 flex min-w-44 flex-col rounded-xl border border-border bg-background p-1 shadow-md">
        <Link href="/o/household" className={stoneLink}>
          Household
        </Link>
        <Link href="/o/sales" className={stoneLink}>
          Sales
        </Link>
      </div>
    </details>
  );
}

export function navLinks(opts: {
  loggedIn: boolean;
  guest: boolean;
  leader: boolean;
  org: string;
}): NavLink[] {
  if (opts.guest || !opts.loggedIn) {
    // Guest rooms: People, Library, Insights, and New stay hidden.
    // Learn stays on the home page rail (Learn with Ben), not in the nav,
    // because the signed-in Learn door is /dashboard.
    return [];
  }
  const org = opts.org;
  if (!opts.leader) {
    return [
      { href: "/dashboard", label: "Learn", door: "learn" },
      { href: org === "sales" ? "/skills" : "/pattern", label: "Me", door: "me" },
    ];
  }
  return [
    { href: "/dashboard", label: "Learn", door: "learn" },
    { href: "/people", label: "People", door: "people" },
    { href: org ? `/o/${org}/l` : "/dashboard", label: "Library", door: "library" },
    { href: "/insights", label: "Insights", door: "insights" },
  ];
}

export function SiteHeader({ viewer }: { viewer: ShellViewer | null }) {
  const { data: authSession, status } = useSession();
  const { session, ready } = usePortal();
  const pathname = usePathname();
  const guestChrome = status === "unauthenticated";
  const loggedIn = status === "authenticated" && Boolean(authSession?.user?.email);
  const initial = (viewer?.name || session?.name || "G").slice(0, 1).toUpperCase();
  const homeHref = guestChrome ? "/" : "/dashboard";
  const stance = loggedIn ? (viewer?.stance ?? "") : "";
  const org = loggedIn ? (viewer?.org ?? "") : "";
  const logoUrl = viewer?.logoUrl.trim() ?? "";

  const leader = LEADER_STANCES.has(stance);
  const links = navLinks({
    loggedIn,
    guest: guestChrome,
    leader,
    org,
  });
  const showNew = loggedIn && leader;
  const current = activeDoor(pathname, links.map((l) => l.door));
  const extras = loggedIn && viewer ? accountItems(viewer) : [];

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
          {loggedIn ? <LeaveReturnNext /> : null}
        </div>
        <nav className="flex items-center gap-0.5 text-sm" aria-label="Field School">
          <div className="hidden items-center gap-0.5 md:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={current === l.door ? currentClass : linkClass}
                aria-current={current === l.door ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
            {guestChrome ? <GuestOrgMenu /> : null}
          </div>
          {showNew ? <NewMenu /> : null}
          <details className="relative md:hidden">
            <summary className="flex h-11 cursor-pointer list-none items-center px-2 text-muted-foreground">
              Menu
            </summary>
            <div className="absolute right-0 z-40 mt-1 flex min-w-56 flex-col rounded-xl border border-border bg-background p-2 shadow-md">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className={current === l.door ? currentClass : linkClass}
                  aria-current={current === l.door ? "page" : undefined}
                  onClick={closeMenu}
                >
                  {l.label}
                </Link>
              ))}
              {guestChrome ? (
                <>
                  <p className="px-2 pt-2 text-xs uppercase tracking-[0.16em] text-[#7a746a]">
                    Org
                  </p>
                  <Link href="/o/household" className={stoneLink}>
                    Household
                  </Link>
                  <Link href="/o/sales" className={stoneLink}>
                    Sales
                  </Link>
                </>
              ) : null}
              {loggedIn ? (
                <>
                  <div className="border-t border-border px-2 py-2">
                    <OrgPicker memberships={viewer?.memberships ?? []} active={org} />
                  </div>
                  <Link href="/metering" className={linkClass} onClick={closeMenu}>
                    Credits
                  </Link>
                  <button type="button" className={`${linkClass} text-left`} onClick={openPalette}>
                    Jump to… <span className="ml-auto font-mono text-xs">⌘K</span>
                  </button>
                </>
              ) : null}
            </div>
          </details>
          {loggedIn ? (
            <div className="hidden md:flex">
              <OrgPicker memberships={viewer?.memberships ?? []} active={org} />
            </div>
          ) : null}
          {loggedIn ? (
            <Link href="/metering" className="hidden h-11 items-center px-2 text-sm text-muted-foreground hover:text-foreground md:flex">
              Credits
            </Link>
          ) : null}
          {status === "loading" || !ready ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
          ) : loggedIn ? (
            <details className="relative ml-1">
              <summary className="grid size-8 cursor-pointer list-none place-items-center overflow-hidden rounded-full bg-foreground text-xs font-medium text-background">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="size-8 object-cover" />
                ) : (
                  <span data-logo="monogram">{initial}</span>
                )}
              </summary>
              <div className="absolute right-0 z-40 mt-1 flex min-w-56 flex-col gap-1 rounded-xl border border-border bg-background p-3 shadow-md">
                <Link
                  href="/profile"
                  className="flex h-11 items-center text-sm text-muted-foreground hover:text-foreground"
                  onClick={closeMenu}
                >
                  View Profile
                </Link>
                {extras.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    data-account-item={item.group}
                    className="flex h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={closeMenu}
                  >
                    {item.label}
                    {item.badge === "tasks" ? <TasksNavBadge /> : null}
                  </Link>
                ))}
                <button
                  type="button"
                  className="flex h-11 items-center text-left text-sm text-muted-foreground hover:text-foreground"
                  onClick={openPalette}
                >
                  Jump to… <span className="ml-auto font-mono text-xs">⌘K</span>
                </button>
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
                className="flex h-9 items-center rounded-xl border border-border px-3 text-sm text-[#7a746a] hover:text-foreground"
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
