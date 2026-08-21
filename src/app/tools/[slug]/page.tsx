"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/hooks/use-portal";
import { saveToolResult } from "@/lib/portal";
import { getTool } from "@/lib/tools/registry";
import { intelligenceQuestions, scoreIntelligence } from "@/lib/tools/intelligence";
import { skillQuestions, scoreSkill } from "@/lib/tools/skill";
import { cn } from "@/lib/utils";

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const tool = getTool(slug);
  const { tools } = usePortal();
  if (!tool) return notFound();

  const prior = tools[tool.slug];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {tool.kicker}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{tool.title}</h1>
      <p className="mt-4 text-muted-foreground">{tool.summary}</p>
      {tool.status === "coming" ? (
        <p className="mt-8 rounded-xl border border-border bg-card px-5 py-5 text-sm text-muted-foreground">
          {tool.comingNote}
        </p>
      ) : tool.slug === "skill" ? (
        <SkillForm priorSummary={prior?.summary} />
      ) : tool.slug === "intelligence" ? (
        <IntelForm priorSummary={prior?.summary} />
      ) : null}
      {prior ? (
        <p className="mt-6 text-sm text-pass">
          Last saved on your portal: {prior.summary}{" "}
          <Link href="/dashboard" className="underline underline-offset-4">
            Open dashboard
          </Link>
        </p>
      ) : null}
    </main>
  );
}

function SkillForm({ priorSummary }: { priorSummary?: string }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<string | null>(priorSummary ?? null);
  const all = skillQuestions.every((q) => answers[q.id] != null);

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const scored = scoreSkill(answers);
        saveToolResult({
          toolSlug: "skill",
          completedAt: new Date().toISOString(),
          summary: scored.summary,
          scores: { total: scored.total, ...Object.fromEntries(skillQuestions.map((q) => [q.id, answers[q.id]])) },
          labels: { band: scored.label },
        });
        setSaved(scored.summary);
      }}
    >
      {skillQuestions.map((q, i) => (
        <fieldset key={q.id} className="rounded-xl border border-border bg-card px-4 py-4">
          <legend className="px-1 text-sm font-medium">
            <span className="mr-2 text-muted-foreground">{i + 1}.</span>
            {q.prompt}
          </legend>
          <div className="mt-3 grid gap-2">
            {q.choices.map((c) => (
              <label
                key={c.label}
                className={cn(
                  "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
                  answers[q.id] === c.value
                    ? "border-primary bg-secondary"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                <input
                  type="radio"
                  name={q.id}
                  className="mt-1 accent-[var(--primary)]"
                  checked={answers[q.id] === c.value}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: c.value }))}
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Button className="h-11 rounded-xl px-5" disabled={!all} type="submit">
        Save to portal
      </Button>
      {saved ? <p className="text-sm text-pass">{saved}</p> : null}
    </form>
  );
}

function IntelForm({ priorSummary }: { priorSummary?: string }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<string | null>(priorSummary ?? null);
  const all = intelligenceQuestions.every((q) => answers[q.id] != null);
  const preview = useMemo(
    () => (all ? scoreIntelligence(answers) : null),
    [all, answers],
  );

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const scored = scoreIntelligence(answers);
        saveToolResult({
          toolSlug: "intelligence",
          completedAt: new Date().toISOString(),
          summary: scored.summary,
          scores: scored.axes,
          labels: scored.labels,
        });
        setSaved(scored.summary);
      }}
    >
      {intelligenceQuestions.map((q, i) => (
        <fieldset key={q.id} className="rounded-xl border border-border bg-card px-4 py-4">
          <legend className="px-1 text-sm font-medium">
            <span className="mr-2 text-muted-foreground">{i + 1}.</span>
            {q.prompt}
          </legend>
          <div className="mt-3 grid gap-2">
            {q.choices.map((c) => (
              <label
                key={c.label}
                className={cn(
                  "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
                  answers[q.id] === c.value
                    ? "border-primary bg-secondary"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                <input
                  type="radio"
                  name={q.id}
                  className="mt-1 accent-[var(--primary)]"
                  checked={answers[q.id] === c.value}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: c.value }))}
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Button className="h-11 rounded-xl px-5" disabled={!all} type="submit">
        Save to portal
      </Button>
      {saved ? <p className="text-sm text-pass">{saved}</p> : null}
      {preview ? (
        <p className="text-xs text-muted-foreground">
          Lead with {preview.lead.toLowerCase()} — you can still change answers
          and save again.
        </p>
      ) : null}
    </form>
  );
}
