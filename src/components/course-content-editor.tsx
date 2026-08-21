import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { suggestQuestions } from "@/lib/course/generate";
import type { CourseRecord, Module, QuizQuestion } from "@/lib/course/types";

/** Short unique id for new stations / questions. */
function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function blankQuestion(): QuizQuestion {
  return { id: newId("q"), prompt: "", choices: ["", "", "", ""], answer: 0, why: "" };
}

function blankModule(index: number): Module {
  return {
    slug: newId("station"),
    station: String(index + 1).padStart(2, "0"),
    title: "New station",
    kicker: "",
    durationLabel: "10 min",
    summary: "",
    thesis: "",
    bullets: [],
    quotes: [],
    clips: [],
    assignment: { title: "Field work", brief: "", items: [], notesPlaceholder: "" },
    quiz: [],
  };
}

const inputClass =
  "md-field mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";
const areaClass =
  "md-field mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";
const labelClass = "block text-xs uppercase tracking-[0.16em] text-muted";

function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: QuizQuestion;
  index: number;
  onChange: (next: QuizQuestion) => void;
  onRemove: () => void;
}) {
  const patch = (p: Partial<QuizQuestion>) => onChange({ ...question, ...p });
  return (
    <div className="rounded-lg border border-border bg-bg/40 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">Question {index + 1}</p>
        <button
          type="button"
          onClick={onRemove}
          className="md-interactive inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-warn"
        >
          <Trash2 className="size-3.5" /> Remove
        </button>
      </div>
      <input
        className={inputClass}
        placeholder="Question prompt"
        value={question.prompt}
        onChange={(e) => patch({ prompt: e.target.value })}
      />
      <p className="mt-3 text-xs text-muted">
        Choices — select the radio for the correct answer.
      </p>
      <div className="mt-2 space-y-2">
        {question.choices.map((choice, ci) => (
          <div key={ci} className="flex items-center gap-2">
            <input
              type="radio"
              name={`${question.id}-answer`}
              checked={question.answer === ci}
              onChange={() => patch({ answer: ci })}
              aria-label={`Mark choice ${ci + 1} correct`}
            />
            <input
              className="md-field h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm"
              placeholder={`Choice ${ci + 1}`}
              value={choice}
              onChange={(e) => {
                const choices = [...question.choices];
                choices[ci] = e.target.value;
                patch({ choices });
              }}
            />
            {question.choices.length > 2 ? (
              <button
                type="button"
                onClick={() => {
                  const choices = question.choices.filter((_, i) => i !== ci);
                  const answer =
                    question.answer >= choices.length
                      ? choices.length - 1
                      : question.answer > ci
                        ? question.answer - 1
                        : question.answer;
                  patch({ choices, answer });
                }}
                className="md-interactive grid size-8 place-items-center rounded-md text-muted"
                aria-label="Remove choice"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {question.choices.length < 6 ? (
        <button
          type="button"
          onClick={() => patch({ choices: [...question.choices, ""] })}
          className="md-interactive mt-2 inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted"
        >
          <Plus className="size-3.5" /> Add choice
        </button>
      ) : null}
      <input
        className={inputClass}
        placeholder="Why this answer (shown after submit)"
        value={question.why}
        onChange={(e) => patch({ why: e.target.value })}
      />
    </div>
  );
}

export function CourseContentEditor({
  course,
  onChange,
}: {
  course: CourseRecord;
  onChange: (next: CourseRecord) => void;
}) {
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const setModules = (modules: Module[]) => onChange({ ...course, modules });
  const setExam = (examQuestions: QuizQuestion[]) =>
    onChange({ ...course, examQuestions });

  const patchModule = (idx: number, p: Partial<Module>) =>
    setModules(course.modules.map((m, i) => (i === idx ? { ...m, ...p } : m)));

  async function suggestForStation(mIdx: number) {
    const mod = course.modules[mIdx];
    setAiBusy(`m${mIdx}`);
    setAiError(null);
    try {
      const res = await suggestQuestions({
        data: {
          title: mod.title,
          context: [mod.summary, mod.thesis, ...mod.bullets]
            .filter((s) => s && s.trim())
            .join("\n"),
          count: 3,
          kind: "quiz",
        },
      });
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setModules(
        course.modules.map((m, i) =>
          i === mIdx ? { ...m, quiz: [...m.quiz, ...res.questions] } : m,
        ),
      );
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Could not suggest questions.");
    } finally {
      setAiBusy(null);
    }
  }

  async function suggestForExam() {
    setAiBusy("exam");
    setAiError(null);
    try {
      const res = await suggestQuestions({
        data: {
          title: course.title,
          context:
            course.contextNotes ||
            course.modules.map((m) => `${m.title}: ${m.summary}`).join("\n"),
          count: 5,
          kind: "exam",
        },
      });
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setExam([...course.examQuestions, ...res.questions]);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Could not suggest questions.");
    } finally {
      setAiBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {aiError ? (
        <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
          {aiError}
        </p>
      ) : null}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-tight">Stations</h2>
          <button
            type="button"
            onClick={() => setModules([...course.modules, blankModule(course.modules.length)])}
            className="md-interactive inline-flex h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm"
          >
            <Plus className="size-4" /> Add station
          </button>
        </div>

        <ol className="mt-4 space-y-4">
          {course.modules.map((mod, mIdx) => (
            <li
              key={mod.slug}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-muted">Station {mod.station}</p>
                <button
                  type="button"
                  onClick={() =>
                    setModules(course.modules.filter((_, i) => i !== mIdx))
                  }
                  className="md-interactive inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-warn"
                >
                  <Trash2 className="size-3.5" /> Remove station
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  Title
                  <input
                    className={inputClass}
                    value={mod.title}
                    onChange={(e) => patchModule(mIdx, { title: e.target.value })}
                  />
                </label>
                <label className={labelClass}>
                  Kicker
                  <input
                    className={inputClass}
                    value={mod.kicker}
                    onChange={(e) => patchModule(mIdx, { kicker: e.target.value })}
                  />
                </label>
                <label className={labelClass}>
                  Duration label
                  <input
                    className={inputClass}
                    value={mod.durationLabel}
                    onChange={(e) =>
                      patchModule(mIdx, { durationLabel: e.target.value })
                    }
                  />
                </label>
              </div>

              <label className={`${labelClass} mt-3`}>
                Summary
                <textarea
                  className={`${areaClass} min-h-20`}
                  value={mod.summary}
                  onChange={(e) => patchModule(mIdx, { summary: e.target.value })}
                />
              </label>
              <label className={`${labelClass} mt-3`}>
                Thesis
                <textarea
                  className={`${areaClass} min-h-16`}
                  value={mod.thesis}
                  onChange={(e) => patchModule(mIdx, { thesis: e.target.value })}
                />
              </label>
              <label className={`${labelClass} mt-3`}>
                Key points (one per line)
                <textarea
                  className={`${areaClass} min-h-24`}
                  value={mod.bullets.join("\n")}
                  onChange={(e) =>
                    patchModule(mIdx, { bullets: e.target.value.split("\n") })
                  }
                />
              </label>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Quiz questions</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={aiBusy !== null}
                      onClick={() => void suggestForStation(mIdx)}
                      className="md-interactive inline-flex h-8 items-center gap-1 rounded-md border border-accent/50 px-2 text-xs text-accent disabled:opacity-50"
                    >
                      <Sparkles className="size-3.5" />
                      {aiBusy === `m${mIdx}` ? "Drafting…" : "Suggest with AI"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patchModule(mIdx, { quiz: [...mod.quiz, blankQuestion()] })
                      }
                      className="md-interactive inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs"
                    >
                      <Plus className="size-3.5" /> Add question
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-3">
                  {mod.quiz.length === 0 ? (
                    <p className="text-xs text-muted">No quiz questions yet.</p>
                  ) : (
                    mod.quiz.map((q, qIdx) => (
                      <QuestionEditor
                        key={q.id}
                        question={q}
                        index={qIdx}
                        onChange={(next) =>
                          patchModule(mIdx, {
                            quiz: mod.quiz.map((x, i) => (i === qIdx ? next : x)),
                          })
                        }
                        onRemove={() =>
                          patchModule(mIdx, {
                            quiz: mod.quiz.filter((_, i) => i !== qIdx),
                          })
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl tracking-tight">Exam questions</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={aiBusy !== null}
              onClick={() => void suggestForExam()}
              className="md-interactive inline-flex h-10 items-center gap-1 rounded-xl border border-accent/50 px-3 text-sm text-accent disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {aiBusy === "exam" ? "Drafting…" : "Suggest with AI"}
            </button>
            <button
              type="button"
              onClick={() => setExam([...course.examQuestions, blankQuestion()])}
              className="md-interactive inline-flex h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm"
            >
              <Plus className="size-4" /> Add exam question
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {course.examQuestions.length === 0 ? (
            <p className="text-xs text-muted">No exam questions yet.</p>
          ) : (
            course.examQuestions.map((q, qIdx) => (
              <QuestionEditor
                key={q.id}
                question={q}
                index={qIdx}
                onChange={(next) =>
                  setExam(course.examQuestions.map((x, i) => (i === qIdx ? next : x)))
                }
                onRemove={() =>
                  setExam(course.examQuestions.filter((_, i) => i !== qIdx))
                }
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
