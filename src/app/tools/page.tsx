import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TopicRequestForm } from "@/components/topic-request-form";
import { assessmentTools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Skill and intelligence assessments that stay on your Field School University portal. Tool and personality checklists come later.",
};

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Tools
      </p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl tracking-tight">
        Assessments you can keep on the portal
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Take a live assessment now. Results save next to your courses. The
        registry already has slots for a tool checklist and a personality
        checklist — those land later without a new shelf.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {assessmentTools.map((tool) => (
          <article
            key={tool.slug}
            className="flex flex-col rounded-xl border border-border bg-card px-5 py-5"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {tool.kicker} · {tool.minutes}
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">
              {tool.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {tool.summary}
            </p>
            {tool.status === "live" ? (
              <Link
                href={`/login?next=${encodeURIComponent(`/tools/${tool.slug}`)}`}
                className="mt-6 inline-flex h-11 items-center gap-2 text-sm"
              >
                Sign in to start
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <p className="mt-6 text-sm text-faint">{tool.comingNote}</p>
            )}
          </article>
        ))}
      </div>

      <section className="mt-16 max-w-2xl rounded-xl border border-border bg-card px-5 py-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Community
        </p>
        <h2 className="mt-2 font-display text-2xl tracking-tight">
          Request a topic
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Community members steer what Saturday covers next. Name the job, the
          tool, or the conversation you want walked.
        </p>
        <TopicRequestForm source="/tools" />
      </section>
    </main>
  );
}
