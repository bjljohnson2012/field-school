"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOutPortal } from "@/lib/auth/sign-out";
import { COMPANY_NAME } from "@/lib/brand";
import { preferPlatformAdmin } from "@/lib/campus-runtime/lessons";
import { coachingNav, tasksCount, type NavItem } from "@/lib/coaching/nav";
import { CommandPalette, paletteItems, type PaletteItem } from "@/components/command-palette";
import { LEADER_STANCES, NEW_DOORS, navLinks } from "@/components/site-header";
import { SynthesisStatusBanner } from "@/components/synthesis-status-banner";
import { TasksNavBadge } from "@/components/tasks-nav-badge";

type OrgChoice = { slug: string; name: string };

type ShellSession = {
  kind: string;
  name: string;
  slug: string;
  capabilities: string[];
  memberships: OrgChoice[];
  platformAdmin?: boolean;
};

const BAR =
  "sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-md text-foreground";
const WORDMARK = "font-display text-lg font-medium tracking-tight text-foreground";
const SEAL = "/branding/assets/isolated-seal-56.png";

/** Sales room matches coaching nav family(): sales and company. */
export function shellRoom(orgKind: string): "sales" | "household" | "operator" {
  const kind = orgKind.trim().toLowerCase();
  if (kind === "sales" || kind === "company") return "sales";
  if (kind === "household" || kind === "homeschool") return "household";
  return "operator";
}

export function AppShell({
  name,
  children,
  orgKind: orgKindProp,
  capabilities: capabilitiesProp,
  platformAdmin: platformAdminProp = false,
  memberships: membershipsProp,
  logoUrl = "",
  orgSlug: orgSlugProp,
}: {
  name: string;
  children: ReactNode;
  orgKind?: string;
  capabilities?: readonly string[];
  platformAdmin?: boolean;
  memberships?: readonly OrgChoice[];
  logoUrl?: string;
  orgSlug?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<ShellSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openTasks = tasksCount();

  useEffect(() => {
    setMenuOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.authenticated) return;
        const rows = Array.isArray(data.memberships) ? data.memberships : [];
        const slug = typeof data.activeOrg?.slug === "string" ? data.activeOrg.slug : "";
        const active = rows.find((row: { org?: string }) => row.org === slug) ?? null;
        const stance = typeof active?.stance === "string" ? active.stance : "";
        setSession({
          kind: typeof active?.kind === "string" ? active.kind : "",
          name:
            (typeof active?.name === "string" && active.name) ||
            (typeof data.activeOrg?.name === "string" ? data.activeOrg.name : ""),
          slug: typeof active?.org === "string" ? active.org : slug,
          capabilities: stance ? [stance] : [],
          platformAdmin:
            typeof data.platformAdmin === "boolean" ? data.platformAdmin : undefined,
          memberships: rows
            .filter((row: { org?: string }) => typeof row.org === "string" && row.org)
            .map((row: { org: string; name?: string }) => ({
              slug: row.org,
              name: row.name || row.org,
            })),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const orgKind = orgKindProp ?? session?.kind ?? "";
  const capabilities = capabilitiesProp ?? session?.capabilities ?? [];
  const memberships = membershipsProp ?? session?.memberships ?? [];
  const platformAdmin = preferPlatformAdmin(session?.platformAdmin, platformAdminProp);
  const items = coachingNav({ orgKind, capabilities, platformAdmin });
  const initial = (name || "F").slice(0, 1).toUpperCase();
  const room = shellRoom(orgKind);
  const leader = capabilities.some((cap) => LEADER_STANCES.has(cap));
  const orgSlug = orgSlugProp ?? session?.slug ?? "";
  const links = navLinks({
    loggedIn: true,
    guest: false,
    leader,
    org: orgSlug,
  });
  const doors: PaletteItem[] = leader
    ? NEW_DOORS.map((door) => ({ href: door.href, label: door.label }))
    : [];
  const coachingLinks: PaletteItem[] = items
    .filter((item) => !item.disabled)
    .map((item) => ({ href: item.href, label: item.label }));
  const jumpItems = paletteItems({
    room,
    nav: links,
    doors,
    coaching: coachingLinks,
  });

  async function switchOrg(slug: string) {
    await fetch("/api/org/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setMenuOpen(false);
    router.push(`/o/${slug}`);
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col" data-shell-room={room}>
      <CommandPalette items={jumpItems} />
      <header className={BAR}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link href={wordmarkHref(orgKind)} className="flex shrink-0 items-center gap-2">
            <img src={SEAL} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
            <Wordmark />
          </Link>
          <nav
            aria-label="Leader"
            className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex"
          >
            <LeaderLinks links={links} pathname={pathname} />
            {leader ? <NewMenu /> : null}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {room === "sales" ? (
              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 rounded-brand bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                data-tasks="sales"
              >
                Tasks
                <TasksNavBadge fallback={openTasks} />
              </Link>
            ) : null}
            <div className="md:hidden">{leader ? <NewMenu /> : null}</div>
            <div className="relative">
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {logoUrl.trim() ? (
                  <img src={logoUrl.trim()} alt="" className="size-9 rounded-full object-cover" />
                ) : (
                  <span data-logo="monogram">{initial}</span>
                )}
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 rounded-brand border border-border bg-card py-1 text-sm text-foreground shadow-card"
                >
                  <Link
                    href="/card"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left hover:bg-secondary"
                  >
                    My card
                  </Link>
                  <Link
                    href="/account"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left hover:bg-secondary"
                  >
                    Account
                  </Link>
                  {memberships.length > 1
                    ? memberships.map((org) => (
                        <button
                          key={org.slug}
                          type="button"
                          role="menuitem"
                          className="block w-full px-3 py-2 text-left hover:bg-secondary"
                          onClick={() => void switchOrg(org.slug)}
                        >
                          {org.name}
                        </button>
                      ))
                    : null}
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left font-medium hover:bg-secondary"
                    onClick={() => signOutPortal("/login")}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="px-2 text-sm font-medium text-foreground md:hidden"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((open) => !open)}
            >
              Menu
            </button>
          </div>
        </div>
        {items.length > 0 ? (
          <div className="hidden border-t border-border md:block">
            <NavLinks
              items={items}
              pathname={pathname}
              className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2"
            />
          </div>
        ) : null}
        {drawerOpen ? (
          <div className="border-t border-border px-4 py-3 md:hidden">
            <LeaderLinks links={links} pathname={pathname} className="flex flex-col items-start gap-1" />
            <NavLinks items={items} pathname={pathname} className="mt-2 flex flex-col items-start gap-1" />
          </div>
        ) : null}
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <SynthesisStatusBanner />
        {children}
      </div>
    </div>
  );
}

function wordmarkHref(orgKind: string) {
  const kind = orgKind.trim().toLowerCase();
  if (kind === "sales" || kind === "company") return "/o/sales/welcome";
  if (kind === "household" || kind === "homeschool") return "/o/household/welcome";
  return "/";
}

function Wordmark() {
  return (
    <span data-wordmark="" className={WORDMARK}>
      {COMPANY_NAME}
    </span>
  );
}

function NewMenu() {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-brand px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        New
      </summary>
      <div className="absolute left-0 z-40 mt-2 flex min-w-48 flex-col rounded-brand border border-border bg-card p-1 shadow-card">
        {NEW_DOORS.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className="whitespace-nowrap rounded-brand px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
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

function LeaderLinks({
  links,
  pathname,
  className = "flex items-center gap-1",
}: {
  links: { href: string; label: string }[];
  pathname: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className={
            pathname === link.href
              ? "border-b-2 border-primary px-3 py-1.5 text-sm font-medium text-foreground"
              : "px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          }
          aria-current={pathname === link.href ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function NavLinks({
  items,
  pathname,
  className,
}: {
  items: NavItem[];
  pathname: string;
  className: string;
}) {
  return (
    <nav className={className} aria-label="Coaching">
      {items.map((item) =>
        item.disabled ? (
          <button
            key={item.href}
            type="button"
            disabled
            className="rounded-brand px-3 py-1.5 text-sm font-medium text-muted-foreground"
          >
            {item.label}
          </button>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname === item.href
                ? "border-b-2 border-primary px-3 py-1.5 text-sm font-medium text-foreground"
                : "rounded-brand px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}

export function GuestChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const login = pathname === "/login";
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className={BAR}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <img src={SEAL} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
            <Wordmark />
          </Link>
          <Link href="/login" className="text-sm font-medium text-foreground">
            Sign in
          </Link>
        </div>
      </header>
      {login ? (
        <div className="flex flex-1 items-center justify-center px-4 py-16">{children}</div>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </div>
  );
}
