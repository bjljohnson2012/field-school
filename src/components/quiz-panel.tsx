import { useState } from "react";
import type { QuizQuestion } from "@/lib/course/types";
import { passingScore } from "@/lib/course/content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuizPanel({
  questions,
  ratio,
  priorScore,
  priorPassed,
  onSubmit,
}: {
  questions: QuizQuestion[];
  ratio: number;
  priorScore: number | null;
  priorPassed: boolean;
  onSubmit: (answers: Record<string, number>) => Promise<unknown> | unknown;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(
    priorScore != null
      ? { score: priorScore, passed: priorPassed }
      : null,
  );
  const [busy, setBusy] = useState(false);
  const need = passingScore(questions.length, ratio);
  const allAnswered = questions.every((q) => answers[q.id] != null);

  async function submit() {
    if (!allAnswered || busy) return;
    setBusy(true);
    try {
      await onSubmit(answers);
      let score = 0;
      for (const q of questions) {
        if (answers[q.id] === q.answer) score += 1;
      }
      setResult({ score, passed: score >= need });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6 md-card">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Station quiz</h2>
          <p className="mt-1 text-sm text-muted">
            Pass at {need}/{questions.length}. You can retake.
          </p>
        </div>
        {result ? (
          <span
            className={cn(
              "rounded-sm px-2 py-1 text-xs font-medium tabular-nums",
              result.passed
                ? "bg-pass/15 text-pass"
                : "bg-warn/15 text-warn",
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
              <span className="mr-2 text-muted">{i + 1}.</span>
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
                      "md-interactive flex min-h-11 cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm",
                      selected
                        ? "border-accent bg-raised"
                        : "border-border",
                      reveal && isCorrect && "border-pass/50",
                      reveal && selected && !isCorrect && "border-warn/50",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="mt-1"
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: ci }))
                      }
                    />
                    <span>{choice}</span>
                  </label>
                );
              })}
            </div>
            {result ? (
              <p className="mt-2 text-xs text-muted">{q.why}</p>
            ) : null}
          </li>
        ))}
      </ol>
      <Button
        className="mt-6 w-full sm:w-auto"
        disabled={!allAnswered || busy}
        onClick={() => void submit()}
      >
        {busy ? "Scoring…" : "Submit quiz"}
      </Button>
    </section>
  );
}
