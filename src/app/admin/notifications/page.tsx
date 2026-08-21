"use client";

import Link from "next/link";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import {
  markAllNoticesRead,
  markNoticeRead,
} from "@/lib/portal";
import { usePortal } from "@/hooks/use-portal";
import { formatDay } from "@/lib/utils";

export default function NotificationsPage() {
  const { notices, unreadNotices, users, isAdmin, feedback } = usePortal();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Staff inbox
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Notifications
      </h1>
      <p className="mt-3 text-muted-foreground">
        Feedback and messages from students. The badge on Admin is this list’s
        unread count.
      </p>
      {!isAdmin ? (
        <div className="mt-6 max-w-sm">
          <GoogleSignInButton next="/admin/notifications" />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {unreadNotices} unread · {feedback.length} notes on file
        </p>
        {unreadNotices > 0 ? (
          <button
            type="button"
            className="h-10 rounded-xl border border-border px-4 text-sm"
            onClick={() => markAllNoticesRead()}
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {notices.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-5 py-6 text-sm text-muted-foreground">
            Quiet. Run the student demo and submit feedback to see a notice
            land here.
          </p>
        ) : (
          notices.map((notice) => {
            const from = users.find((u) => u.id === notice.fromUserId);
            return (
              <article
                key={notice.id}
                className={`rounded-xl border bg-card px-5 py-4 ${
                  notice.read ? "border-border" : "border-primary/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {notice.kind}
                    {!notice.read ? " · new" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDay(notice.at)}
                  </p>
                </div>
                <h2 className="mt-1 font-display text-xl tracking-tight">
                  {notice.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {notice.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {from ? (
                    <Link
                      href={`/admin/users/${from.id}`}
                      className="text-sm text-primary"
                    >
                      {from.name}
                    </Link>
                  ) : null}
                  <Link href="/c/grok-bot" className="text-sm text-primary">
                    Course
                  </Link>
                  {!notice.read ? (
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => markNoticeRead(notice.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
