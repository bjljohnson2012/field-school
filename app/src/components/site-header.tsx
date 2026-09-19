"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutPortal } from "@/lib/auth/sign-out";
import { usePortal } from "@/hooks/use-portal";
import { OrgPicker } from "@/components/org-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: authSession, status } = useSession();
  const { session, ready, isAdmin, isStaff, impersonating, unreadNotices } =
    usePortal();
  const cart = useCart();
  const guestChrome = status === "unauthenticated";
  const loggedIn = status === "authenticated" && Boolean(authSession?.user?.email);
  const showAbout = guestChrome;
  const initial = (session?.name || "G").slice(0, 1).toUpperCase();
  const homeHref = guestChrome ? "/" : "/dashboard";
  const cartHref = cart.planId ? `/cart?plan=${cart.planId}` : "/cart";

  const links = [
    { href: "/dashboard", label: "Dashboard", compact: true },
    { href: "/tools", label: "Tools", compact: true },
    { href: cartHref, label: "Cart", compact: true, badge: cart.planId ? 1 : 0 },
    ...(loggedIn ? [{ href: "/children", label: "Children", compact: true }] : []),
    ...(showAbout ? [{ href: "/about", label: "About", compact: false }] : []),
    ...(isStaff
      ? [
          {
            href: "/admin",
            label: "Admin",
            compact: true,
            badge: isAdmin && !impersonating ? unreadNotices : 0,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={homeHref}
            className="flex items-center rounded-lg px-1.5 py-0.5"
          >
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
            className="hidden text-xs uppercase tracking-[0.16em] text-muted-foreground sm:inline"
          >
            Training portal
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
                  : l.label === "Cart"
                    ? pathname === "/cart"
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
          {loggedIn ? <OrgPicker /> : null}
          <ThemeToggle />
          {status === "loading" || !ready ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
          ) : loggedIn ? (
            <div className="ml-1 flex items-center gap-2">
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-full bg-foreground text-xs font-medium text-background"
              >
                {initial}
              </span>
              <span className="hidden max-w-[9rem] truncate text-sm text-muted-foreground lg:inline">
                {session?.email || session?.name}
              </span>
              <button
                type="button"
                onClick={() => signOutPortal("/login")}
                className="h-11 text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </div>
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
