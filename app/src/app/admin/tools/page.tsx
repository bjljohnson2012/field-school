"use client";

import Link from "next/link";
import { usePortal } from "@/hooks/use-portal";
import { assessmentTools } from "@/lib/tools/registry";

export default function AdminToolsPage() {
  const { ready, isStaff } = usePortal();

  if (!ready || !isStaff) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <p className="eyebrow">Tool shelf</p>
      <h1 className="h-page mt-2">How to add a tool</h1>
      <p className="mt-4 text-muted-foreground">
        Assessments are registered, not hardcoded into the dashboard. A new
        intelligence test, skill test, or later checklist is three files and
        one save call.
      </p>

      <ol className="mt-10 space-y-6">
        <How
          n="01"
          title="Register it"
          body="Add a row to assessmentTools in src/lib/tools/registry.ts. Use a stable slug. Set status to live or coming. Coming tools already appear on /tools and the student dashboard — they just cannot be taken yet."
        />
        <How
          n="02"
          title="Write the questions"
          body="Create src/lib/tools/{slug}.ts with the prompts and a score function that returns summary, scores, and labels. Skill and intelligence are the templates. Checklists can be boolean items scored the same way."
        />
        <How
          n="03"
          title="Mount the form"
          body="In src/app/tools/[slug]/page.tsx, branch on the slug and render the form. People can take it without login. Save to profile calls saveToolResult after they sign in. Export and email live on ToolResultActions."
        />
        <How
          n="04"
          title="Leave room for later"
          body="tool-checklist and personality are already reserved. When those ship, flip status to live and add questions — the shelf, portal, and admin catalog pick them up."
        />
      </ol>

      <section className="mt-12">
        <h2 className="h-section">On the shelf now</h2>
        <ul className="mt-4 grid gap-3">
          {assessmentTools.map((tool) => (
            <li
              key={tool.slug}
              className="card flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-medium">{tool.title}</p>
                <p className="font-mono text-sm text-muted-foreground">
                  /tools/{tool.slug} · {tool.status} · {tool.category}
                </p>
              </div>
              <Link href={`/tools/${tool.slug}`} className="text-sm text-primary underline underline-offset-2">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function How({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <li>
      <p className="eyebrow">{n}</p>
      <h2 className="h-section mt-1">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </li>
  );
}
