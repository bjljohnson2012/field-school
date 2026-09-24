"use client";

import Link from "next/link";
import {
  markAllNoticesRead,
  markNoticeRead,
} from "@/lib/portal";
import { usePortal } from "@/hooks/use-portal";
import { formatDay } from "@/lib/utils";

export default function InboxPage() {
  const { notices, unreadNotices, users, isStaff, feedback, ready } = usePortal();

  if (!ready || !isStaff) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <p className="eyebrow">Staff inbox</p>
      <h1 className="h-page mt-2">Inbox</h1>
      <p className="mt-3 text-muted-foreground">
        Feedback and messages from the campus. This is the staff Inbox.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {unreadNotices} unread · {feedback.length} notes on file
        </p>
        {unreadNotices > 0 ? (
          <button
            type="button"
            className="btn border border-input bg-card text-foreground hover:bg-muted"
            onClick={() => markAllNoticesRead()}
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {notices.length === 0 ? (
          <p className="card px-5 py-6 text-sm text-muted-foreground">
            Quiet. Run the student demo and submit feedback to see a notice
            land here.
          </p>
        ) : (
          notices.map((notice) => {
            const from = users.find((u) => u.id === notice.fromUserId);
            return (
              <article
                key={notice.id}
                className={`card px-5 py-4 ${
                  notice.read ? "" : "border-primary/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="eyebrow">
                    {notice.kind}
                    {!notice.read ? " · new" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDay(notice.at)}
                  </p>
                </div>
                <h2 className="h-section mt-1">
                  {notice.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {notice.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {from ? (
                    <Link
                      href={`/admin/users/${from.id}`}
                      className="text-sm text-primary underline underline-offset-2"
                    >
                      {from.name}
                    </Link>
                  ) : null}
                    <Link href="/c/grok-bot" className="text-sm text-primary underline underline-offset-2">
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
