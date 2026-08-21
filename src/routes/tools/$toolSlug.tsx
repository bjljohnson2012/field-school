import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getMyToolResult,
  saveMyToolResult,
  type ToolResultRow,
} from "@/lib/course/tool-results";
import { getTool } from "@/lib/course/tools";
import { UNI_NAME } from "@/lib/course/types";

export const Route = createFileRoute("/tools/$toolSlug")({
  component: ToolDetailPage,
});

function ToolDetailPage() {
  const { toolSlug } = Route.useParams();
  const tool = getTool(toolSlug);
  const { user, isPending } = useCurrentUserState();
  const [result, setResult] = useState<ToolResultRow | null | undefined>(
    undefined,
  );
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tool || isPending || !user) {
      setResult(null);
      return;
    }
    getMyToolResult({ data: { toolSlug: tool.slug } })
      .then(setResult)
      .catch(() => setResult(null));
  }, [tool, user, isPending, toolSlug]);

  if (!tool) return <Navigate to="/tools" />;

  async function markInterest() {
    if (!user || !tool) return;
    setBusy(true);
    try {
      await saveMyToolResult({
        data: {
          toolSlug: tool.slug,
          status: "started",
          result: { interested: true, notedAt: new Date().toISOString() },
        },
      });
      setSaved(true);
      setResult({
        toolSlug: tool.slug,
        status: "started",
        result: { interested: true },
        updatedAt: new Date().toISOString(),
      });
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          {tool.kind}
          {tool.status === "coming-soon" ? " · coming soon" : ""}
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight">
          {tool.title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          {tool.summary}
        </p>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          This tool will save results to your {UNI_NAME} portal so you can track
          them next to courses and certificates. The interactive checklist is on
          the way; you can already reserve a slot on your account.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <button
              type="button"
              disabled={busy || saved || Boolean(result)}
              onClick={() => void markInterest()}
              className="inline-flex h-12 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-fg disabled:opacity-60"
            >
              {result || saved ? "On your portal" : busy ? "Saving…" : "Track on my portal"}
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-12 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-fg"
            >
              Sign in to track
            </Link>
          )}
          <Link
            to="/tools"
            className="inline-flex h-12 items-center rounded-md border border-border px-5 text-sm"
          >
            All tools
          </Link>
        </div>
      </main>
    </div>
  );
}
