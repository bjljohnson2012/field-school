"use client";

import { useState } from "react";
import type { DrillSkill, DrillStats } from "@/app/api/coaching/drills/math";

type Feedback = {
  score: number;
  pointsAwarded: number;
  summary: string;
  didWell: string[];
  toImprove: string[];
  improvedExample: string;
  expectedBehaviors: string[];
  trapBehaviors: string[];
  stats: DrillStats;
};

const ERRORS: Record<string, string> = {
  writes_disabled: "Drills are closed.",
  subject_only: "You can only record your own drill.",
  invalid_ticket: "This drill expired. Start it again.",
  ai_unavailable: "The coach could not write this drill.",
  sign_in_required: "Sign in to run a drill.",
  unknown_skill: "That skill is not on your desk.",
  invalid_body: "Write a response first.",
};

function message(code: string) {
  return ERRORS[code] ?? "Could not run that drill.";
}

export function DrillRunner({
  skills,
  stats,
}: {
  skills: DrillSkill[];
  stats: DrillStats;
}) {
  const [live, setLive] = useState(stats);
  const [active, setActive] = useState<DrillSkill | null>(null);
  const [stage, setStage] = useState<"picker" | "loading" | "drilling" | "submitting" | "feedback">("picker");
  const [scenario, setScenario] = useState("");
  const [ticket, setTicket] = useState("");
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(skill: DrillSkill) {
    setActive(skill);
    setStage("loading");
    setScenario("");
    setTicket("");
    setResponse("");
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch(`/api/coaching/drills?skill=${encodeURIComponent(skill.category)}`);
      const data = (await res.json().catch(() => ({}))) as { error?: string; scenario?: string; ticket?: string };
      if (res.status === 401) {
        window.location.href = "/login?next=/improve";
        return;
      }
      if (!res.ok || !data.scenario || !data.ticket) {
        setError(message(data.error || "ai_unavailable"));
        setStage("picker");
        return;
      }
      setScenario(data.scenario);
      setTicket(data.ticket);
      setStage("drilling");
    } catch {
      setError(message("ai_unavailable"));
      setStage("picker");
    }
  }

  async function submit() {
    if (!active || !ticket || !response.trim()) return;
    setStage("submitting");
    setError(null);
    try {
      const res = await fetch("/api/coaching/drills", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          skillCategory: active.category,
          ticket,
          userResponse: response,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<Feedback> & { error?: string };
      if (res.status === 401) {
        window.location.href = "/login?next=/improve";
        return;
      }
      if (!res.ok || !data.stats) {
        setError(message(data.error || "ai_unavailable"));
        setStage("drilling");
        return;
      }
      setFeedback(data as Feedback);
      setLive(data.stats);
      setStage("feedback");
    } catch {
      setError(message("ai_unavailable"));
      setStage("drilling");
    }
  }

  function reset() {
    setActive(null);
    setScenario("");
    setTicket("");
    setResponse("");
    setFeedback(null);
    setError(null);
    setStage("picker");
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Level</p>
            <p className="font-display text-3xl font-bold text-brand-indigo">{live.level}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Total points</p>
            <p className="font-display text-3xl font-bold text-brand-indigo">{live.totalPoints.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Streak</p>
            <p className="font-display text-3xl font-bold text-brand-orange">
              {live.currentStreak}
              <span className="ml-1 text-sm font-normal text-gray-500">
                day{live.currentStreak === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 max-w-sm">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Level {live.level} progress</span>
            <span className="font-mono">
              {live.progress.current} / {live.progress.needed}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-brand-orange"
              style={{ width: `${live.progress.pct}%` }}
            />
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {active && stage !== "picker" ? (
        <section className="card p-5">
          <h2 className="h-section">{active.label}</h2>
          {stage === "loading" ? <p className="mt-3 text-sm text-gray-600">Writing a scenario…</p> : null}
          {scenario ? <p className="mt-3 text-sm leading-relaxed text-gray-800">{scenario}</p> : null}
          {stage === "drilling" || stage === "submitting" ? (
            <label className="mt-4 block">
              <span className="label">Your response</span>
              <textarea
                className="input min-h-32"
                value={response}
                onChange={(event) => setResponse(event.target.value)}
                maxLength={4000}
                placeholder="What do you say next?"
              />
              <button
                type="button"
                className="btn-primary mt-4"
                disabled={stage === "submitting" || !response.trim()}
                onClick={() => void submit()}
              >
                {stage === "submitting" ? "Grading…" : "Submit drill"}
              </button>
            </label>
          ) : null}
          {feedback ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-semibold text-gray-900">
                {feedback.score}/100 · +{feedback.pointsAwarded} points
              </p>
              <p>{feedback.summary}</p>
              {feedback.didWell.length ? (
                <div>
                  <p className="font-semibold">Did well</p>
                  <ul className="mt-1 list-disc pl-5">
                    {feedback.didWell.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {feedback.toImprove.length ? (
                <div>
                  <p className="font-semibold">To improve</p>
                  <ul className="mt-1 list-disc pl-5">
                    {feedback.toImprove.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {feedback.improvedExample ? <p>{feedback.improvedExample}</p> : null}
              <button type="button" className="btn-primary" onClick={reset}>
                Run another drill
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="card overflow-hidden">
        <header className="border-b border-gray-200 px-5 py-3">
          <h2 className="h-section">Skills</h2>
        </header>
        <ul>
          {skills.map((skill) => (
            <li key={skill.category} className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 last:border-b-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{skill.label}</p>
                <p className="text-xs text-gray-500">
                  {skill.score == null ? "No score yet" : `Score ${Math.round(skill.score)}`}
                </p>
              </div>
              <button type="button" className="btn-primary" onClick={() => void start(skill)}>
                Run a drill
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
