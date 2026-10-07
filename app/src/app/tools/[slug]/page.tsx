"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { saveToProfile, ToolResultActions } from "@/components/tool-result-actions";
import { Button } from "@/components/ui/button";
import {
  intelligenceQuestions,
  scoreIntelligence,
} from "@/lib/tools/intelligence";
import { clearPendingTool, peekPendingTool } from "@/lib/tools/pending";
import { getTool } from "@/lib/tools/registry";
import { isSavedTool, type ToolResult, type ToolSubmission } from "@/lib/tools/results";
import { skillQuestions, scoreSkill } from "@/lib/tools/skill";
import type { AssessmentShare } from "@/lib/tools/share";
import { cn } from "@/lib/utils";

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const tool = getTool(slug);
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const prior = useSavedResult(tool?.slug ?? "", signedIn);
  if (!tool) return notFound();

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
      ) : tool.slug === "personality" ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Field Pattern lives on the profile, not in browser storage.{" "}
          <Link href="/pattern" className="underline underline-offset-4">
            Open fp-50-v1
          </Link>
        </p>
      ) : tool.slug === "skill" ? (
        <SkillForm signedIn={signedIn} priorSummary={prior?.summary} />
      ) : tool.slug === "intelligence" ? (
        <IntelForm signedIn={signedIn} priorSummary={prior?.summary} />
      ) : null}
      {prior ? (
        <p className="mt-6 text-sm text-pass">
          Last saved on your profile: {prior.summary}{" "}
          <Link href="/profile" className="underline underline-offset-4">
            Open your profile
          </Link>
        </p>
      ) : null}
    </main>
  );
}

type SavedSummary = Pick<ToolResult, "summary" | "completedAt">;

function readSaved(json: unknown, slug: string): SavedSummary | null {
  if (typeof json !== "object" || json === null) return null;
  const results: unknown = Object.getOwnPropertyDescriptor(json, "results")?.value;
  if (typeof results !== "object" || results === null) return null;
  const saved: unknown = Object.getOwnPropertyDescriptor(results, slug)?.value;
  if (typeof saved !== "object" || saved === null) return null;
  const summary: unknown = Object.getOwnPropertyDescriptor(saved, "summary")?.value;
  const completedAt: unknown = Object.getOwnPropertyDescriptor(saved, "completedAt")?.value;
  if (typeof summary !== "string" || typeof completedAt !== "string") return null;
  return { summary, completedAt };
}

function useSavedResult(slug: string, signedIn: boolean) {
  const [saved, setSaved] = useState<SavedSummary | null>(null);
  useEffect(() => {
    if (!signedIn || !isSavedTool(slug)) return;
    let cancelled = false;
    void fetch("/api/profile/gates")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: unknown) => {
        if (!cancelled) setSaved(readSaved(json, slug));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [signedIn, slug]);
  return saved;
}

function usePendingSave(slug: string, signedIn: boolean) {
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!signedIn) return;
    const pending = peekPendingTool(slug);
    if (!pending) return;
    void saveToProfile(pending).then((ok) => {
      if (ok) clearPendingTool(pending.attemptId);
      setNote(ok ? "Saved to your profile." : "Could not save to your profile. Try again.");
    });
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
  const [result, setResult] = useState<ToolSubmission | null>(null);
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
          setResult({ toolSlug: "skill", attemptId: crypto.randomUUID(), answers });
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
        <p className="text-sm text-pass">{pendingNote}</p>
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
  const [result, setResult] = useState<ToolSubmission | null>(null);
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
          setResult({ toolSlug: "intelligence", attemptId: crypto.randomUUID(), answers });
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
        <p className="text-sm text-pass">{pendingNote}</p>
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
