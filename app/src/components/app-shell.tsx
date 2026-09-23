"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOutPortal } from "@/lib/auth/sign-out";

export function AppShell({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const initial = (name || "F").slice(0, 1).toUpperCase();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-white"
          >
            Field <span className="text-brand-orange">School</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-orange text-sm font-semibold text-white">
              {initial}
            </span>
            <button
              type="button"
              className="text-sm font-semibold text-white"
              onClick={() => signOutPortal("/login")}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</div>
    </div>
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
