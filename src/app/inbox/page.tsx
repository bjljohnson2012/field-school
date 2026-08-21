"use client";

import Link from "next/link";
import { usePortal } from "@/hooks/use-portal";
import { formatDay } from "@/lib/utils";

export default function InboxPage() {
  const { inbox, ready, isStaff, unreadNotices, impersonating } = usePortal();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Inbox
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Campus notes</h1>
      <p className="mt-3 text-muted-foreground">
        Certificates, saved assessments, and notes you sent to staff. Nothing
        leaves this browser.
      </p>
      {isStaff && !impersonating ? (
        <Link
          href="/admin/notifications"
          className="mt-4 inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
        >
          Staff notifications
          {unreadNotices > 0 ? ` · ${unreadNotices} unread` : ""}
        </Link>
      ) : null}
      <div className="mt-8 space-y-3">
        {!ready ? (
          <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
        ) : inbox.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-5 py-6 text-sm text-muted-foreground">
            Empty. Walk a station, take a tool, or continue as a guest — notes
            will land here.
          </p>
        ) : (
          inbox.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-card px-5 py-4"
            >
              <p className="text-xs text-muted-foreground">{formatDay(item.at)}</p>
              <h2 className="mt-1 font-display text-xl tracking-tight">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              {item.href ? (
                <Link
                  href={item.href}
                  className="mt-3 inline-flex h-10 items-center text-sm text-primary"
                >
                  Open
                </Link>
              ) : null}
            </article>
          ))
        )}
      </div>
    </main>
  );
}
