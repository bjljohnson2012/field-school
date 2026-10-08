"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Dialog } from "@/components/saas/dialog";
import { signOutPortal } from "@/lib/auth/sign-out";
import { usePortal } from "@/hooks/use-portal";
import { activeDoor, type Door } from "@/lib/shell/routes";
import { accountItems, OPEN_PALETTE_EVENT, type ShellItem, type ShellViewer } from "@/lib/shell/model";
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
];

function openPalette(event: { currentTarget: Element }) {
  const root = event.currentTarget.closest("details");
  if (root) root.open = false;
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

function closeMenu(event: { currentTarget: Element }) {
  let node: Element | null = event.currentTarget;
  while (node) {
    if (node instanceof HTMLDetailsElement) node.open = false;
    node = node.parentElement;
  }
}

const HELP_LINKS = [
  { href: "/docs/api", label: "API" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/c/grok-bot", label: "Catalog" },
  { href: "/tools", label: "Tools" },
] as const;

const menuRow =
  "flex h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground";

function MenuAccountLink({ item }: { item: ShellItem }) {
  return (
    <Link href={item.href} data-account-item={item.group} className={menuRow} onClick={closeMenu}>
      {item.label}
      {item.badge === "tasks" ? <TasksNavBadge /> : null}
    </Link>
  );
}

/** `<details>` menus stay open on their own across navigation, Escape, ⌘K, and clicks elsewhere. */
function useBarMenusClose(pathname: string) {
  useEffect(() => {
    const closeAll = (keep: Node | null) => {
      for (const menu of document.querySelectorAll<HTMLDetailsElement>("header[data-bar] details[open]")) {
        if (!keep || !menu.contains(keep)) menu.open = false;
      }
    };
    closeAll(null);
    const onDown = (event: MouseEvent) => closeAll(event.target instanceof Node ? event.target : null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) closeAll(null);
    };
    const onPalette = () => closeAll(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onPalette);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onPalette);
    };
  }, [pathname]);
}

const linkClass =
  "flex h-11 items-center px-2 text-muted-foreground hover:text-foreground sm:px-2.5";
const currentClass = "flex h-11 items-center px-2 text-foreground underline underline-offset-8 sm:px-2.5";

const NEW_DELIVERY: Record<string, { delivers: string; body: string }> = {
  "/library/wizard": {
    delivers: "New knowledge",
    body: "This stores a new piece of knowledge. Drop a file, an idea, or a minute of audio. Submit adds it to the knowledge repository. Generate Lesson writes the lesson after, and only from what you stored.",
  },
  "/library/video": {
    delivers: "New lesson",
    body: "This starts a lesson from a long video. You mark the parts worth teaching. The lesson is written from those parts and stays unpublished until you publish it.",
  },
};

export function NewMenu() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const choice = NEW_DOORS.find((door) => door.href === picked) ?? null;
  const delivery = picked ? NEW_DELIVERY[picked] : null;

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground"
        onClick={() => {
          setPicked(null);
          setOpen(true);
        }}
      >
        <Plus className="size-4" aria-hidden="true" />
        New
      </button>
      {open ? (
        <Dialog
          title={delivery ? delivery.delivers : "What are you adding?"}
          onClose={() => setOpen(false)}
        >
          {delivery && choice ? (
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">{delivery.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={choice.href}
                  className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                  onClick={() => setOpen(false)}
                >
                  Continue
                </Link>
                <button type="button" className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm" onClick={() => setPicked(null)}>
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                Choose knowledge or a lesson. The next step explains what will be delivered before you leave this page.
              </p>
              {NEW_DOORS.map((door) => (
                <button
                  key={door.href}
                  type="button"
                  className="rounded-xl border border-border px-4 py-3 text-left hover:bg-secondary"
                  onClick={() => setPicked(door.href)}
                >
                  <span className="block text-sm font-medium">{door.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{NEW_DELIVERY[door.href]?.delivers}</span>
                  {door.hint ? <span className="mt-1 block text-xs text-muted-foreground">{door.hint}</span> : null}
                </button>
              ))}
            </div>
          )}
        </Dialog>
      ) : null}
    </>
  );
}

type NavLink = { href: string; label: string; door: Door };

const stoneLink =
  "flex h-11 items-center px-2 text-muted-foreground hover:text-foreground sm:px-2.5";

function GuestOrgMenu() {
  return (
    <details className="relative">
      <summary className={`${stoneLink} cursor-pointer list-none`}>
        Org
      </summary>
      <div className="absolute right-0 z-40 mt-1 flex min-w-44 flex-col rounded-xl border border-border bg-background p-1 shadow-md">
        <Link href="/o/household" className={stoneLink}>
          Family
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
    // Guest rooms: Insights, People, Library, Knowledge, and New stay hidden.
    // Learn is the signed-in action at /learn, not a guest tab.
    return [];
  }
  const org = opts.org;
  if (!opts.leader) {
    return [
      { href: "/learn", label: "Learn", door: "learn" },
      { href: org === "sales" ? "/skills" : "/pattern", label: "Me", door: "me" },
    ];
  }
  return [
    { href: "/insights", label: "Insights", door: "insights" },
    { href: "/people", label: "People", door: "people" },
    { href: org ? `/o/${org}/l` : "/insights", label: "Library", door: "library" },
    { href: "/knowledge", label: "Knowledge", door: "knowledge" },
    { href: "/learn", label: "Learn", door: "learn" },
  ];
}

function DoorLink({ link, current }: { link: NavLink; current: Door | null }) {
  const on = current === link.door;
  if (link.door === "learn") {
    return (
      <Link
        href={link.href}
        aria-current={on ? "page" : undefined}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-[0_8px_20px_-14px_rgba(26,25,22,0.45)]"
      >
        Learn
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    );
  }
  return (
    <Link
      href={link.href}
      className={on ? currentClass : linkClass}
      aria-current={on ? "page" : undefined}
    >
      {link.label}
    </Link>
  );
}

export function SiteHeader({ viewer }: { viewer: ShellViewer | null }) {
  const { data: authSession, status } = useSession();
  const { session, ready, isStaff } = usePortal();
  const pathname = usePathname();
  useBarMenusClose(pathname);
  const guestChrome = status === "unauthenticated";
  const loggedIn = status === "authenticated" && Boolean(authSession?.user?.email);
  const initial = (viewer?.name || session?.name || "G").slice(0, 1).toUpperCase();
  const homeHref = guestChrome ? "/" : "/dashboard";
  const stance = loggedIn ? (viewer?.stance ?? "") : "";
  const org = loggedIn ? (viewer?.org ?? "") : "";
  const logoUrl = viewer?.logoUrl.trim() ?? "";

  const leader = LEADER_STANCES.has(stance);
  const links =
    loggedIn && !viewer
      ? []
      : navLinks({
          loggedIn,
          guest: guestChrome,
          leader,
          org,
        });
  const showNew = loggedIn && leader;
  const learn = links.find((link) => link.door === "learn") ?? null;
  const tabs = learn ? links.filter((link) => link.door !== "learn") : links;
  const current = activeDoor(pathname, links.map((l) => l.door));
  const extras = loggedIn && viewer ? accountItems(viewer) : [];
  const accountLinks = extras.filter((item) => item.group !== "Profiles");
  const profileLinks = extras.filter((item) => item.group === "Profiles");
  const canManage = Boolean(viewer && (isStaff || viewer.platformAdmin || viewer.stance === "admin"));

  return (
    <header data-bar="" className="sticky top-0 z-30 border-b border-border bg-card shadow-[0_8px_24px_-18px_rgba(26,25,22,0.45)]">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-4">
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
        <nav className="flex items-center gap-1 text-sm" aria-label="Field School">
          <div className="hidden items-center gap-0.5 md:flex">
            {tabs.map((l) => (
              <DoorLink key={l.label} link={l} current={current} />
            ))}
            {guestChrome ? <GuestOrgMenu /> : null}
          </div>
          {showNew ? <NewMenu /> : null}
          {learn ? <DoorLink link={learn} current={current} /> : null}
          <details className="relative md:hidden">
            <summary className="flex h-11 cursor-pointer list-none items-center px-2 text-muted-foreground">
              Menu
            </summary>
            <div className="absolute right-0 z-40 mt-1 flex min-w-56 flex-col rounded-2xl border border-border bg-card p-2 shadow-[0_16px_36px_-24px_rgba(26,25,22,0.55)]">
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
                  <p className="px-2 pt-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Org
                  </p>
                  <Link href="/o/household" className={stoneLink}>
                    Family
                  </Link>
                  <Link href="/o/sales" className={stoneLink}>
                    Sales
                  </Link>
                </>
              ) : null}
            </div>
          </details>
          {status === "loading" || !ready ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
          ) : loggedIn ? (
            <details className="relative ml-1">
              <summary
                aria-label="Account menu"
                className="grid size-8 cursor-pointer list-none place-items-center overflow-hidden rounded-full bg-foreground text-xs font-medium text-background"
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="size-8 object-cover" />
                ) : (
                  <span data-logo="monogram">{initial}</span>
                )}
              </summary>
              <div className="absolute right-0 z-40 mt-2 flex max-h-[70vh] w-72 flex-col gap-0.5 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-[0_16px_36px_-24px_rgba(26,25,22,0.45)]">
                <button
                  type="button"
                  className="flex h-11 items-center rounded-lg px-2 text-left text-sm text-foreground hover:bg-secondary"
                  onClick={openPalette}
                >
                  Jump to… <span className="ml-auto font-mono text-xs text-muted-foreground">⌘K</span>
                </button>
                <Link
                  href="/profile"
                  className="flex h-11 items-center rounded-lg px-2 text-sm text-foreground hover:bg-secondary"
                  onClick={closeMenu}
                >
                  View Profile
                </Link>
                <details className="rounded-lg">
                  <summary className="flex h-11 cursor-pointer list-none items-center rounded-lg px-2 text-sm text-foreground hover:bg-secondary">
                    Settings
                  </summary>
                  <div className="flex flex-col gap-0.5 pb-1 pl-2">
                    {accountLinks.map((item) => (
                      <MenuAccountLink key={item.id} item={item} />
                    ))}
                    <Link href="/metering" className={menuRow} onClick={closeMenu}>
                      Credits
                    </Link>
                    {canManage ? (
                      <>
                        <Link href="/admin" className={menuRow} onClick={closeMenu}>
                          Admin
                        </Link>
                        <Link href="/account#connect-ai" className={menuRow} onClick={closeMenu}>
                          Connect AI
                        </Link>
                        <Link href="/admin/demo" className={menuRow} onClick={closeMenu}>
                          Test child
                        </Link>
                      </>
                    ) : null}
                    {profileLinks.map((item) => (
                      <MenuAccountLink key={item.id} item={item} />
                    ))}
                    {viewer && viewer.memberships.length > 0 ? (
                      <details className="rounded-lg">
                        <summary className="flex h-11 cursor-pointer list-none items-center rounded-lg px-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                          Switch org
                        </summary>
                        <div className="px-2 pb-2">
                          <OrgPicker quiet memberships={viewer.memberships} active={org} />
                        </div>
                      </details>
                    ) : null}
                  </div>
                </details>
                <div className="mt-1 px-1">
                  <ThemeToggle />
                </div>
                <button
                  type="button"
                  onClick={() => signOutPortal("/login")}
                  className="h-11 rounded-lg px-2 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                className="flex h-9 items-center rounded-xl border border-border px-3 text-sm text-muted-foreground hover:text-foreground"
              >
                Join free
              </Link>
            </div>
          )}
        </nav>
      </div>
      {loggedIn ? (
        <details className="fixed bottom-5 right-5 z-40">
          <summary
            aria-label="Help"
            className="grid size-12 cursor-pointer list-none place-items-center rounded-full bg-foreground text-lg text-background shadow-[0_12px_28px_-12px_rgba(26,25,22,0.45)]"
          >
            ?
          </summary>
          <div className="absolute bottom-14 right-0 flex min-w-44 flex-col rounded-2xl border border-border bg-card p-2 shadow-[0_16px_36px_-24px_rgba(26,25,22,0.45)]">
            {HELP_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className={menuRow} onClick={closeMenu}>
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      ) : null}
    </header>
  );
}
