"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOutPortal } from "@/lib/auth/sign-out";
import { preferPlatformAdmin } from "@/lib/campus-runtime/lessons";
import { coachingNav, tasksCount, type NavItem } from "@/lib/coaching/nav";
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

export function AppShell({
  name,
  children,
  orgKind: orgKindProp,
  orgName: orgNameProp,
  capabilities: capabilitiesProp,
  platformAdmin: platformAdminProp = false,
  memberships: membershipsProp,
}: {
  name: string;
  children: ReactNode;
  orgKind?: string;
  orgName?: string;
  capabilities?: readonly string[];
  platformAdmin?: boolean;
  memberships?: readonly OrgChoice[];
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
  const orgName = orgNameProp ?? session?.name ?? "";
  const capabilities = capabilitiesProp ?? session?.capabilities ?? [];
  const memberships = membershipsProp ?? session?.memberships ?? [];
  const platformAdmin = preferPlatformAdmin(session?.platformAdmin, platformAdminProp);
  const items = coachingNav({ orgKind, capabilities, platformAdmin });
  const initial = (name || "F").slice(0, 1).toUpperCase();

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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link
            href={wordmarkHref(orgKind)}
            className="font-display text-lg font-semibold tracking-tight text-white"
          >
            <Wordmark orgKind={orgKind} orgName={orgName} />
          </Link>
          <NavLinks items={items} pathname={pathname} className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex" />
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 rounded-brand bg-brand-orange px-3 py-1.5 text-sm font-semibold text-white"
            >
              Tasks
              <TasksNavBadge fallback={openTasks} />
            </Link>
            <div className="relative">
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-orange text-sm font-semibold text-white"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {initial}
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 rounded-brand border border-white/10 bg-brand-navy py-1 text-sm shadow-card"
                >
                  <Link
                    href="/card"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-white hover:bg-white/10"
                  >
                    My card
                  </Link>
                  {memberships.length > 1
                    ? memberships.map((org) => (
                        <button
                          key={org.slug}
                          type="button"
                          role="menuitem"
                          className="block w-full px-3 py-2 text-left text-white hover:bg-white/10"
                          onClick={() => void switchOrg(org.slug)}
                        >
                          {org.name}
                        </button>
                      ))
                    : null}
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left font-semibold text-white hover:bg-white/10"
                    onClick={() => signOutPortal("/login")}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="px-2 text-sm font-semibold text-white md:hidden"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((open) => !open)}
            >
              Menu
            </button>
          </div>
        </div>
        {drawerOpen ? (
          <div className="border-t border-white/10 px-4 py-3 md:hidden">
            <NavLinks items={items} pathname={pathname} className="flex flex-col items-start gap-1" />
          </div>
        ) : null}
      </header>
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
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

function Wordmark({ orgKind, orgName }: { orgKind: string; orgName: string }) {
  const kind = orgKind.trim().toLowerCase();
  const sales = kind === "sales" || kind === "company";
  if (!sales && (!orgName || orgName === "Field School")) {
    return (
      <>
        Field <span className="text-brand-orange">School</span>
      </>
    );
  }
  return (
    <>
      {orgName || (sales ? "Sales" : "Field")}{" "}
      <span className="text-brand-orange">{sales ? "Coach" : "Field School"}</span>
    </>
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
            className="rounded-brand px-3 py-1.5 text-sm font-semibold text-white/50"
          >
            {item.label}
          </button>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname === item.href
                ? "rounded-brand bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                : "rounded-brand px-3 py-1.5 text-sm font-semibold text-white/80 hover:text-white"
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
      <header className="bg-brand-navy text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-white"
          >
            Field <span className="text-brand-orange">School</span>
          </Link>
          <Link href="/login" className="text-sm font-semibold text-white">
            Sign in
          </Link>
        </div>
      </header>
      {login ? (
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          {children}
        </div>
      ) : (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
          <div className="card p-6 md:p-8">{children}</div>
        </main>
      )}
    </div>
  );
}
