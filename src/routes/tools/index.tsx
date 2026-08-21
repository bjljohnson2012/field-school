import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  listMyToolResults,
  type ToolResultRow,
} from "@/lib/course/tool-results";
import { ASSESSMENT_TOOLS } from "@/lib/course/tools";
import { COMPANY_NAME, UNI_NAME } from "@/lib/course/types";

export const Route = createFileRoute("/tools/")({
  component: ToolsPage,
  head: () => ({
    meta: [
      { title: `Tools · ${UNI_NAME}` },
      {
        name: "description",
        content:
          "Assessment tools on Field School University — intelligence, skill, personality, and checklists tracked on your portal.",
      },
    ],
  }),
});

function ToolsPage() {
  const { user, isPending } = useCurrentUserState();
  const [results, setResults] = useState<ToolResultRow[] | null>(null);

  useEffect(() => {
    if (isPending || !user) {
      setResults(null);
      return;
    }
    listMyToolResults()
      .then(setResults)
      .catch(() => setResults([]));
  }, [user, isPending]);

  const bySlug = new Map((results ?? []).map((r) => [r.toolSlug, r]));

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-14">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Tools
            </p>
            <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
              Assess. Track. Level up.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              {COMPANY_NAME} is building intelligence, skill, and personality
              tools that live next to your courses. Results stay on your{" "}
              {UNI_NAME} portal so progress is one place, not a pile of PDFs.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-4 sm:grid-cols-2">
            {ASSESSMENT_TOOLS.map((tool) => {
              const mine = bySlug.get(tool.slug);
              return (
                <Link
                  key={tool.slug}
                  to="/tools/$toolSlug"
                  params={{ toolSlug: tool.slug }}
                  className="group rounded-xl border border-border bg-surface px-5 py-5 transition-colors hover:bg-raised"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      {tool.kind}
                      {tool.status === "coming-soon" ? " · soon" : ""}
                    </p>
                    {mine ? (
                      <span className="font-mono text-xs text-pass">
                        {mine.status}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-display text-2xl tracking-tight">
                    {tool.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {tool.summary}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm">
                    {tool.status === "ready" ? "Open" : "View"}
                    <ArrowRight className="size-4" />
                  </p>
                </Link>
              );
            })}
          </div>

          {!user && !isPending ? (
            <p className="mt-10 max-w-xl text-sm text-muted">
              <Link to="/login" className="text-fg underline-offset-4 hover:underline">
                Sign in
              </Link>{" "}
              to keep tool results on your portal alongside course progress.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
