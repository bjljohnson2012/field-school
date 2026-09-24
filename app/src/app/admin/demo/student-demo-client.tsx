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
    <main className="mx-auto max-w-3xl px-6 py-8">
      <p className="eyebrow">Student demo</p>
      <h1 className="h-page mt-2">Walk the campus as Jordan</h1>
      <p className="mt-4 text-muted-foreground">
        Four beats. Impersonate the demo student, open the course, send
        feedback, then come back to staff Inbox. Login never shows this
        walk — share the token link when someone else should try it.
      </p>

      <div className="card mt-6 px-5 py-5">
        <p className="eyebrow">Shareable walk</p>
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
              className="btn-primary"
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
              className="btn border border-input bg-card text-foreground hover:bg-muted"
            >
              Open Grok Bot
            </Link>
          </div>
        </Step>
        <Step n="03" title="Submit feedback">
          On the course page, scroll to “Send feedback to staff.” Write a note
          about a station. That creates an unread Inbox item.
          <div className="mt-4">
            <Link
              href="/c/grok-bot#feedback"
              className="btn border border-input bg-card text-foreground hover:bg-muted"
            >
              Jump to the feedback form
            </Link>
          </div>
        </Step>
        <Step n="04" title="See it as admin">
          Stop impersonating and open Inbox. Unread count is on the
          Admin nav.
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn border border-input bg-card text-foreground hover:bg-muted"
              onClick={() => {
                if (impersonating) stopImpersonating();
                else enterAs(ADMIN_ID);
                router.push("/admin/notifications");
              }}
            >
              Back to staff Inbox
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
    <li className="card px-5 py-5">
      <p className="eyebrow">{n}</p>
      <h2 className="h-section mt-1">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </li>
  );
}
