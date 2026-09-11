"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShareLink } from "@/components/share-link";
import { usePortal } from "@/hooks/use-portal";
import { ADMIN_ID, STUDENT_ID } from "@/lib/campus";
import { enterAs, impersonate, stopImpersonating } from "@/lib/portal";

export function StudentDemoClient({
  demoPath,
}: {
  demoPath: string | null;
}) {
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
        feedback, then come back to staff notifications. Login never shows this
        walk — share the token link when someone else should try it.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card px-5 py-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Shareable walk
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Copies the full campus walk URL with a secret token. People who open
          /demo without it see a closed door. Set DEMO_LINK_TOKEN on the host
          if you want a token you chose; otherwise the campus derives one from
          AUTH_SECRET.
        </p>
        <div className="mt-4">
          {demoPath ? (
            <ShareLink path={demoPath} label="Copy demo link" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Set DEMO_LINK_TOKEN or AUTH_SECRET on the host to mint a
              shareable link.
            </p>
          )}
        </div>
      </div>

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
