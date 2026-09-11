"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ToolResult } from "@/lib/portal";
import { saveToolResult } from "@/lib/portal";
import { downloadAssessmentPdf } from "@/lib/tools/pdf";
import { stashPendingTool } from "@/lib/tools/pending";
import type { AssessmentShare } from "@/lib/tools/share";

export function ToolResultActions({
  share,
  result,
  signedIn,
}: {
  share: AssessmentShare;
  result?: ToolResult;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card px-5 py-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Results
        </p>
        <p className="mt-2 text-sm leading-relaxed">{share.summary}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="h-11 rounded-xl px-5"
          onClick={() => downloadAssessmentPdf(share)}
        >
          Export PDF
        </Button>
        {result ? (
          signedIn ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5"
              onClick={() => {
                saveToolResult(result);
                setSaved(true);
              }}
            >
              Save to profile
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5"
              onClick={() => {
                stashPendingTool(result);
                router.push(
                  `/login?next=${encodeURIComponent(`/tools/${result.toolSlug}`)}`,
                );
              }}
            >
              Log in to save
            </Button>
          )
        ) : null}
      </div>
      {saved ? (
        <p className="text-sm text-pass">
          Saved on your profile.{" "}
          <Link href="/dashboard" className="underline underline-offset-4">
            Open dashboard
          </Link>
        </p>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setStatus(null);
          try {
            const res = await fetch("/api/tools/email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, website, share }),
            });
            const data: unknown = await res.json();
            const error =
              typeof data === "object" &&
              data !== null &&
              "error" in data &&
              typeof data.error === "string"
                ? data.error
                : "Could not send that.";
            const emailed =
              typeof data === "object" &&
              data !== null &&
              "emailed" in data &&
              data.emailed === true;
            if (!res.ok) {
              setStatus(error);
              return;
            }
            setStatus(
              emailed
                ? "Sent. You are also on the Saturday newsletter."
                : "You are on the Saturday newsletter. Export the PDF if the email did not arrive.",
            );
          } catch {
            setStatus("Could not reach the portal. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="hidden" aria-hidden="true">
          <label htmlFor={`tool-website-${share.toolSlug}`}>Company</label>
          <input
            id={`tool-website-${share.toolSlug}`}
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <Label htmlFor={`tool-email-${share.toolSlug}`}>
          Email these results
        </Label>
        <p className="text-xs text-muted-foreground">
          We send the results and add you to the Saturday newsletter.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id={`tool-email-${share.toolSlug}`}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@work.com"
            className="h-11 rounded-xl"
          />
          <Button
            className="h-11 shrink-0 rounded-xl px-5"
            type="submit"
            disabled={pending}
          >
            {pending ? "Sending…" : "Email me"}
          </Button>
        </div>
        {status ? (
          <p
            className={
              status.startsWith("Could") || status.startsWith("Enter")
                ? "text-sm text-destructive"
                : "text-sm text-pass"
            }
          >
            {status}
          </p>
        ) : null}
      </form>
    </section>
  );
}
