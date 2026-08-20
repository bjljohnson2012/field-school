import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { createBlankCourse } from "@/lib/course/catalog";
import { generateCourse } from "@/lib/course/generate";

export const Route = createFileRoute("/office/new")({ component: NewCourse });

function NewCourse() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState<"gen" | "blank" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">
          Loading…
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function generate() {
    setError(null);
    setBusy("gen");
    try {
      const res = await generateCourse({
        data: { youtubeUrl, context, title },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await navigate({ to: "/office/$slug", params: { slug: res.course.slug } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate.");
    } finally {
      setBusy(null);
    }
  }

  async function blank() {
    setError(null);
    setBusy("blank");
    try {
      const course = await createBlankCourse({
        data: { title: title || "Untitled course", youtubeUrl, context },
      });
      await navigate({ to: "/office/$slug", params: { slug: course.slug } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create draft.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Admin
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Build a course from a tape
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          Paste the YouTube URL and the briefing — transcript, outline, your
          notes. The campus writes stations, timestamped clips, field work, and
          an exam. You review, then publish.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
        >
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Working title
            <input
              className="md-field mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Grok Bot vs OpenClaw"
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            YouTube URL
            <input
              className="md-field mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              required
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Context — transcript, outline, or notes
            <textarea
              className="md-field mt-2 min-h-56 w-full rounded-md border border-border bg-surface px-3 py-3 text-sm leading-relaxed text-fg"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Paste the parts that matter. Timestamps help. Say what students must be able to do when they pass."
            />
          </label>
          {error ? <p className="text-sm text-warn">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy !== null}>
              {busy === "gen" ? "Building stations…" : "Generate course"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy !== null}
              onClick={() => void blank()}
            >
              {busy === "blank" ? "Saving…" : "Save empty draft"}
            </Button>
            <Link
              to="/office"
              className="md-interactive inline-flex h-11 items-center rounded-xl px-2 text-sm text-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
