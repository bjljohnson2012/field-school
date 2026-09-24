"use client";

import { useState } from "react";

export type ReviewRow = {
  id: string;
  subjectMembershipId: string;
  subjectName: string;
  coachMembershipId: string;
  coachName: string;
  monthOf: string;
  status: string;
  mine: boolean;
};

export type ReviewQuestion = {
  id: string;
  text: string;
  questionType: string;
  category: string;
};

export type SubjectChoice = { id: string; name: string };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    reviews?: ReviewRow[];
    review?: { id: string; status: string };
    answers?: Array<{ questionId: string; value: unknown }>;
    summary?: string;
  };
  return { res, data };
}

export function ReviewsPanel({
  initialReviews,
  questions,
  subjects,
  actorMembershipId,
}: {
  initialReviews: ReviewRow[];
  questions: ReviewQuestion[];
  subjects: SubjectChoice[];
  actorMembershipId: string;
}) {
  const [rows, setRows] = useState(initialReviews);
  const [openId, setOpenId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [subjectMembershipId, setSubjectMembershipId] = useState(subjects[0]?.id ?? "");
  const [monthOf, setMonthOf] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    const res = await fetch("/api/coaching/reviews", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { reviews?: ReviewRow[] };
    if (Array.isArray(data.reviews)) setRows(data.reviews);
  }

  async function startPending() {
    setBusy(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/coaching/reviews", {
        subjectMembershipId,
        monthOf: monthOf || undefined,
      });
      if (!res.ok) {
        setError(data.error || "Could not open a review");
        return;
      }
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function openReview(id: string) {
    setBusy(true);
    setError("");
    setSummary("");
    try {
      const { res, data } = await postJson(`/api/coaching/reviews/${id}`, { action: "open" });
      if (!res.ok) {
        setError(data.error || "Could not open the review");
        return;
      }
      const next: Record<string, string> = {};
      for (const answer of data.answers ?? []) {
        next[answer.questionId] = typeof answer.value === "string" ? answer.value : JSON.stringify(answer.value ?? "");
      }
      setAnswers(next);
      setOpenId(id);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  function answerPayload() {
    return questions.map((question) => ({ questionId: question.id, value: answers[question.id] ?? "" }));
  }

  async function saveAnswers() {
    if (!openId) return;
    setBusy(true);
    setError("");
    try {
      const { res, data } = await postJson(`/api/coaching/reviews/${openId}`, { answers: answerPayload() });
      if (!res.ok) setError(data.error || "Could not save answers");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    if (!openId) return;
    setBusy(true);
    setError("");
    try {
      const { res, data } = await postJson(`/api/coaching/reviews/${openId}/submit`, { answers: answerPayload() });
      if (!res.ok) {
        setError(data.error || "Could not submit the review");
        return;
      }
      setSummary(data.summary || "Submitted.");
      setOpenId("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const selected = rows.find((row) => row.id === openId);

  return (
    <div className="mt-6 space-y-6">
      <section className="card p-6">
        <h2 className="h-section">Pending reviews</h2>
        {rows.length === 0 ? <p className="mt-3">No pending reviews.</p> : null}
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{row.subjectName}</p>
                <p className="text-sm text-muted-foreground">
                  {row.monthOf.slice(0, 7)} · {row.status}
                  {row.coachMembershipId === actorMembershipId ? "" : ` · ${row.coachName}`}
                </p>
              </div>
              {row.mine ? (
                <button type="button" className="btn-primary" disabled={busy} onClick={() => void openReview(row.id)}>
                  Open
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {selected ? (
        <section className="card p-6">
          <h2 className="h-section">Answer {selected.subjectName}</h2>
          {questions.length === 0 ? <p className="mt-3">No monthly review questions in this org yet.</p> : null}
          <div className="mt-4 space-y-4">
            {questions.map((question) => (
              <label key={question.id} className="block">
                <span className="text-sm font-semibold">{question.text}</span>
                <textarea
                  className="input mt-2 min-h-24 w-full"
                  value={answers[question.id] ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void saveAnswers()}>
              Save answers
            </button>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void submitReview()}>
              Submit
            </button>
          </div>
        </section>
      ) : null}

      {summary ? (
        <section className="card p-6">
          <h2 className="h-section">Submitted</h2>
          <p className="mt-3">{summary}</p>
        </section>
      ) : null}

      <section className="card p-6">
        <h2 className="h-section">Start a monthly review</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select className="input" value={subjectMembershipId} onChange={(event) => setSubjectMembershipId(event.target.value)}>
            {subjects.length === 0 ? <option value="">No subjects</option> : null}
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <input className="input" type="month" value={monthOf} onChange={(event) => setMonthOf(event.target.value)} />
        </div>
        <button type="button" className="btn-primary mt-4" disabled={busy || !subjectMembershipId} onClick={() => void startPending()}>
          Add pending review
        </button>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </section>
    </div>
  );
}
