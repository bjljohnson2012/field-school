"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ToolResultActions } from "@/components/tool-result-actions";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/hooks/use-portal";
import { saveToolResult, type ToolResult } from "@/lib/portal";
import {
  intelligenceQuestions,
  scoreIntelligence,
} from "@/lib/tools/intelligence";
import { takePendingTool } from "@/lib/tools/pending";
import { getTool } from "@/lib/tools/registry";
import { skillQuestions, scoreSkill } from "@/lib/tools/skill";
import type { AssessmentShare } from "@/lib/tools/share";
import { cn } from "@/lib/utils";

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const tool = getTool(slug);
  const { tools, session } = usePortal();
  if (!tool) return notFound();

  const prior = tools[tool.slug];
  const signedIn = session?.mode === "signed";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {tool.kicker}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{tool.title}</h1>
      <p className="mt-4 text-muted-foreground">{tool.summary}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Take it free. Save to your profile if you want to keep it. Export a PDF
        or email the results. Email also puts you on the Saturday newsletter.
      </p>
      {tool.status === "coming" ? (
        <p className="mt-8 rounded-xl border border-border bg-card px-5 py-5 text-sm text-muted-foreground">
          {tool.comingNote}
        </p>
      ) : tool.slug === "skill" ? (
        <SkillForm signedIn={signedIn} priorSummary={prior?.summary} />
      ) : tool.slug === "intelligence" ? (
        <IntelForm signedIn={signedIn} priorSummary={prior?.summary} />
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

function usePendingSave(slug: string, signedIn: boolean) {
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!signedIn) return;
    const pending = takePendingTool(slug);
    if (!pending) return;
    saveToolResult(pending);
    setNote(pending.summary);
  }, [signedIn, slug]);
  return note;
}

function SkillForm({
  signedIn,
  priorSummary,
}: {
  signedIn: boolean;
  priorSummary?: string;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [share, setShare] = useState<AssessmentShare | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const pendingNote = usePendingSave("skill", signedIn);
  const all = skillQuestions.every((q) => answers[q.id] != null);

  return (
    <div className="mt-8 space-y-6">
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
                  onChange={() => {
                    setAnswers((current) => ({ ...current, [q.id]: c.value }));
                    setShare(null);
                    setResult(null);
                  }}
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Button
        className="h-11 rounded-xl px-5"
        disabled={!all}
        type="button"
        onClick={() => {
          const scored = scoreSkill(answers);
          const completedAt = new Date().toISOString();
          const nextResult: ToolResult = {
            toolSlug: "skill",
            completedAt,
            summary: scored.summary,
            scores: {
              total: scored.total,
              ...Object.fromEntries(
                skillQuestions.map((q) => [q.id, answers[q.id] ?? 0]),
              ),
            },
            labels: { band: scored.label },
          };
          setResult(nextResult);
          setShare({
            toolSlug: "skill",
            title: "Skill assessment",
            summary: scored.summary,
            completedAt,
            lines: [
              `${scored.label} · ${scored.total}/${scored.max}`,
              scored.next,
            ],
          });
        }}
      >
        See results
      </Button>
      {pendingNote ? (
        <p className="text-sm text-pass">Saved to your profile: {pendingNote}</p>
      ) : null}
      {share && result ? (
        <ToolResultActions share={share} result={result} signedIn={signedIn} />
      ) : priorSummary && !share ? (
        <p className="text-sm text-muted-foreground">
          You can retake, or export after you see new results.
        </p>
      ) : null}
    </div>
  );
}

function IntelForm({
  signedIn,
  priorSummary,
}: {
  signedIn: boolean;
  priorSummary?: string;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [share, setShare] = useState<AssessmentShare | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const pendingNote = usePendingSave("intelligence", signedIn);
  const all = intelligenceQuestions.every((q) => answers[q.id] != null);
  const preview = useMemo(
    () => (all ? scoreIntelligence(answers) : null),
    [all, answers],
  );

  return (
    <div className="mt-8 space-y-6">
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
                  onChange={() => {
                    setAnswers((current) => ({ ...current, [q.id]: c.value }));
                    setShare(null);
                    setResult(null);
                  }}
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Button
        className="h-11 rounded-xl px-5"
        disabled={!all}
        type="button"
        onClick={() => {
          const scored = scoreIntelligence(answers);
          const completedAt = new Date().toISOString();
          const nextResult: ToolResult = {
            toolSlug: "intelligence",
            completedAt,
            summary: scored.summary,
            scores: scored.axes,
            labels: scored.labels,
          };
          setResult(nextResult);
          setShare({
            toolSlug: "intelligence",
            title: "Intelligence assessment",
            summary: scored.summary,
            completedAt,
            lines: [
              `Lead with ${scored.lead.toLowerCase()}`,
              `Notice ${scored.axes.notice}/8`,
              `Decide ${scored.axes.decide}/8`,
              `Learn ${scored.axes.learn}/8`,
            ],
          });
        }}
      >
        See results
      </Button>
      {pendingNote ? (
        <p className="text-sm text-pass">Saved to your profile: {pendingNote}</p>
      ) : null}
      {preview && !share ? (
        <p className="text-xs text-muted-foreground">
          Lead with {preview.lead.toLowerCase()}. Answer every question, then
          see results.
        </p>
      ) : null}
      {share && result ? (
        <ToolResultActions share={share} result={result} signedIn={signedIn} />
      ) : priorSummary && !share ? (
        <p className="text-sm text-muted-foreground">
          You can retake, or export after you see new results.
        </p>
      ) : null}
    </div>
  );
}
