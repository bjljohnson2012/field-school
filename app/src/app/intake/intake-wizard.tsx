"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WizardStep } from "@/components/wizard-step";

type ClientQuestion = {
  id: string;
  type: string;
  text: string;
  options: unknown;
};

type StartResponse = {
  ok?: boolean;
  error?: string;
  answerSetId?: string;
  resumeIndex?: number;
  questions?: ClientQuestion[];
  answers?: Record<string, unknown>;
};

export function IntakeWizard({ kind }: { kind: "intake" | "director_intake" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerSetId, setAnswerSetId] = useState("");
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [index, setIndex] = useState(0);
  const [resumeIndex, setResumeIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/coaching/intake/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind }),
        });
        const data = (await res.json()) as StartResponse;
        if (cancelled) return;
        if (!res.ok || !data.ok || !data.answerSetId) {
          setError(data.error || "Intake is unavailable.");
          return;
        }
        const list = Array.isArray(data.questions) ? data.questions : [];
        const saved = typeof data.resumeIndex === "number" ? data.resumeIndex : 0;
        setAnswerSetId(data.answerSetId);
        setQuestions(list);
        setAnswers(data.answers ?? {});
        setResumeIndex(saved);
        setIndex(list.length ? Math.min(saved, list.length - 1) : 0);
      } catch {
        if (!cancelled) setError("Intake is unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const question = questions[index] ?? null;
  const total = questions.length;
  const progress = total === 0 ? 0 : Math.round((Math.min(resumeIndex, total) / total) * 100);

  async function save(nextResume: number) {
    if (!question) return false;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coaching/intake/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answerSetId,
          questionId: question.id,
          value: answers[question.id] ?? {},
          resumeIndex: nextResume,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; resumeIndex?: number };
      if (!res.ok || !data.ok) {
        setError(data.error || "Save failed.");
        return false;
      }
      if (typeof data.resumeIndex === "number") setResumeIndex(data.resumeIndex);
      return true;
    } catch {
      setError("Save failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    const saved = await save(total);
    if (!saved) return;
    setBusy(true);
    try {
      const res = await fetch("/api/coaching/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerSetId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Submit failed.");
        return;
      }
      router.push("/card");
      router.refresh();
    } catch {
      setError("Submit failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <section className="card mt-6 p-6 text-sm text-gray-600">Loading intake…</section>;
  }
  if (!question) {
    return (
      <section className="card mt-6 p-6">
        <p className="text-sm text-gray-600">
          {error || "No intake questions are published yet."}
        </p>
      </section>
    );
  }

  const last = index >= total - 1;
  return (
    <section className="card mt-6 p-6">
      <p className="text-sm text-gray-500">Question {index + 1} of {total}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full bg-brand-orange" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-6">
        <WizardStep
          question={question}
          value={answers[question.id]}
          onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
        />
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {index > 0 ? (
          <button type="button" className="btn-primary" disabled={busy} onClick={() => setIndex((n) => n - 1)}>
            Back
          </button>
        ) : null}
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => void save(index)}
        >
          Save
        </button>
        {last ? (
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void submit()}>
            Submit
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() =>
              void save(index + 1).then((ok) => {
                if (ok) setIndex((n) => n + 1);
              })
            }
          >
            Next
          </button>
        )}
      </div>
    </section>
  );
}
