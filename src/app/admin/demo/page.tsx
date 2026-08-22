"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ADMIN_ID, STUDENT_ID } from "@/lib/campus";
import { enterAs, impersonate, stopImpersonating } from "@/lib/portal";
import { usePortal } from "@/hooks/use-portal";

export default function StudentDemoPage() {
  const router = useRouter();
  const { user, impersonating, unreadNotices, ready, isStaff } = usePortal();
  const asJordan = user?.id === STUDENT_ID;

  if (!ready || !isStaff) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Student demo
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Walk the campus as Jordan
      </h1>
      <p className="mt-4 text-muted-foreground">
        Four beats. Impersonate the demo student, open the course, send
        feedback, then come back to staff notifications.
      </p>

      <ol className="mt-10 space-y-4">
        <Step n="01" title="Become the student">
          Jordan Hale already has station 01 open. This does not sign the dean
          out — it impersonates.
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
              onClick={() => {
                enterAs(ADMIN_ID);
                impersonate(STUDENT_ID);
              }}
            >
              {asJordan ? "You are Jordan" : "Impersonate Jordan"}
            </button>
          </div>
        </Step>
        <Step n="02" title="Open the course">
          Same ladder a real student sees: tape, stations, field work, exam.
          <div className="mt-4">
            <Link
              href="/c/grok-bot"
              className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
            >
              Open Grok Bot
            </Link>
          </div>
        </Step>
        <Step n="03" title="Submit feedback">
          On the course page, scroll to “Send feedback to staff.” Write a note
          about a station. That creates an unread admin notification.
          <div className="mt-4">
            <Link
              href="/c/grok-bot#feedback"
              className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
            >
              Jump to the feedback form
            </Link>
          </div>
        </Step>
        <Step n="04" title="See it as admin">
          Stop impersonating and open Notifications. Unread count is on the
          Admin nav.
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
              onClick={() => {
                if (impersonating) stopImpersonating();
                else enterAs(ADMIN_ID);
                router.push("/admin/notifications");
              }}
            >
              Back to staff notifications
              {unreadNotices > 0 ? ` (${unreadNotices})` : ""}
            </button>
          </div>
        </Step>
      </ol>
    </main>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-border bg-card px-5 py-5">
      <p className="font-mono text-xs text-muted-foreground">{n}</p>
      <h2 className="mt-1 font-display text-2xl tracking-tight">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </li>
  );
}
