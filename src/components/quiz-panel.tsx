"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/course/types";
import { passingScore } from "@/lib/course/content";
import { ToolResultActions } from "@/components/tool-result-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuizPanel({
  title = "Station quiz",
  questions,
  ratio,
  priorScore,
  priorPassed,
  onSubmit,
  shareTitle,
}: {
  title?: string;
  questions: QuizQuestion[];
  ratio: number;
  priorScore: number | null;
  priorPassed: boolean;
  onSubmit: (answers: Record<string, number>) => void;
  shareTitle?: string;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(
    priorScore != null ? { score: priorScore, passed: priorPassed } : null,
  );
  const need = passingScore(questions.length, ratio);
  const allAnswered = questions.every((q) => answers[q.id] != null);

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pass at {need}/{questions.length}. You can retake.
          </p>
        </div>
        {result ? (
          <span
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium tabular-nums",
              result.passed ? "bg-pass/15 text-pass" : "bg-warn/15 text-warn",
            )}
          >
            {result.score}/{questions.length} {result.passed ? "passed" : "retry"}
          </span>
        ) : null}
      </div>
      <ol className="space-y-6">
        {questions.map((q, i) => (
          <li key={q.id}>
            <p className="mb-3 text-sm font-medium">
              <span className="mr-2 text-muted-foreground">{i + 1}.</span>
              {q.prompt}
            </p>
            <div className="grid gap-2">
              {q.choices.map((choice, ci) => {
                const selected = answers[q.id] === ci;
                const reveal = result != null;
                const isCorrect = ci === q.answer;
                return (
                  <label
                    key={choice}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
                      selected ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60",
                      reveal && isCorrect && "border-pass/50",
                      reveal && selected && !isCorrect && "border-warn/50",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="mt-1 accent-[var(--primary)]"
                      checked={selected}
                      onChange={() => {
                        setResult(null);
                        setAnswers((prev) => ({ ...prev, [q.id]: ci }));
                      }}
                    />
                    <span>{choice}</span>
                  </label>
                );
              })}
            </div>
            {result ? (
              <p className="mt-2 text-xs text-muted-foreground">{q.why}</p>
            ) : null}
          </li>
        ))}
      </ol>
      <Button
        className="mt-6 h-11 w-full rounded-xl sm:w-auto"
        disabled={!allAnswered}
        onClick={() => {
          onSubmit(answers);
          let score = 0;
          for (const q of questions) {
            if (answers[q.id] === q.answer) score += 1;
          }
          setResult({ score, passed: score >= need });
        }}
      >
        Submit
      </Button>
      {result && shareTitle ? (
        <div className="mt-6">
          <ToolResultActions
            signedIn={false}
            share={{
              toolSlug: "quiz",
              title: shareTitle,
              summary: `${result.score}/${questions.length} ${result.passed ? "passed" : "retry"}. Pass at ${need}/${questions.length}.`,
              completedAt: new Date().toISOString(),
              lines: [
                shareTitle,
                `Score ${result.score}/${questions.length}`,
                result.passed ? "Passed" : "Retry",
              ],
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
