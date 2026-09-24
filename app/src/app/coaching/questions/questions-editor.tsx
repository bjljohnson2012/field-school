"use client";

import { useState } from "react";
import {
  QUESTION_CATEGORIES,
  QUESTION_TYPES,
  type QuestionDto,
  type QuestionOption,
  type QuestionType,
} from "../../api/coaching/questions/access";

type Analysis = { recommendation?: string; gaps?: string[] } | null;

async function send(path: string, method: string, body?: unknown) {
  const response = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    question?: QuestionDto;
    questions?: QuestionDto[];
    analysis?: Analysis;
  };
  if (!response.ok || data.ok === false) throw new Error(data.error || "request_failed");
  return data;
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function QuestionCard({
  question,
  onChange,
  onDelete,
}: {
  question: QuestionDto;
  onChange: (question: QuestionDto) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState(question.text);
  const [category, setCategory] = useState(question.category);
  const [questionType, setQuestionType] = useState(question.questionType);
  const [tags, setTags] = useState(question.tags.join(", "));
  const [active, setActive] = useState(question.active);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    try {
      const data = await send(`/api/coaching/questions/${question.id}`, "PATCH", {
        text,
        category,
        questionType,
        tags: splitTags(tags),
        active,
      });
      if (data.question) onChange(data.question);
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function remove() {
    setMessage("");
    try {
      await send(`/api/coaching/questions/${question.id}`, "DELETE");
      onDelete(question.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  return (
    <article className="card p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {question.scope === "platform" ? "Platform" : "This org"}
        {question.mutable ? "" : " · read only"}
      </p>
      <label className="label mt-3" htmlFor={`text-${question.id}`}>
        Question
      </label>
      <textarea
        id={`text-${question.id}`}
        className="input min-h-24"
        value={text}
        disabled={!question.mutable}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select
          className="input"
          value={category}
          disabled={!question.mutable}
          onChange={(event) => setCategory(event.target.value)}
        >
          {QUESTION_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={questionType}
          disabled={!question.mutable}
          onChange={(event) => setQuestionType(event.target.value)}
        >
          {QUESTION_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <label className="label mt-3" htmlFor={`tags-${question.id}`}>
        Tags
      </label>
      <input
        id={`tags-${question.id}`}
        className="input"
        value={tags}
        disabled={!question.mutable}
        onChange={(event) => setTags(event.target.value)}
      />
      <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={active} disabled={!question.mutable} onChange={(event) => setActive(event.target.checked)} />
        Active
      </label>
      {question.mutable ? (
        <div className="mt-4 flex gap-3">
          <button type="button" className="btn-primary" onClick={() => void save()}>
            Save
          </button>
          <button type="button" className="btn" onClick={() => void remove()}>
            Delete
          </button>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </article>
  );
}

export function QuestionsEditor({
  initial,
  platformAdmin,
}: {
  initial: QuestionDto[];
  platformAdmin: boolean;
}) {
  const [questions, setQuestions] = useState(initial);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>(QUESTION_CATEGORIES[0]);
  const [questionType, setQuestionType] = useState<QuestionType>("LONG_FORM");
  const [tags, setTags] = useState("");
  const [scope, setScope] = useState(platformAdmin ? "platform" : "org");
  const [optionLabel, setOptionLabel] = useState("");
  const [message, setMessage] = useState("");
  const [generateCount, setGenerateCount] = useState("4");
  const [bulkCount, setBulkCount] = useState("4");
  const [coverage, setCoverage] = useState("");
  const [styleHint, setStyleHint] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [enhanceId, setEnhanceId] = useState("");
  const [optionIndex, setOptionIndex] = useState("0");
  const [goal, setGoal] = useState("clearer");

  function replace(question: QuestionDto) {
    setQuestions((current) => current.map((item) => (item.id === question.id ? question : item)));
  }

  async function createQuestion() {
    setMessage("");
    const options: QuestionOption[] | null =
      questionType === "MULTIPLE_CHOICE" && optionLabel.trim()
        ? [{ value: optionLabel.trim(), label: optionLabel.trim(), tags: [] }]
        : null;
    try {
      const data = await send("/api/coaching/questions", "POST", {
        text,
        category,
        questionType,
        tags: splitTags(tags),
        scope,
        options,
      });
      if (data.question) setQuestions((current) => [data.question as QuestionDto, ...current]);
      setText("");
      setMessage("Question added");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function generate() {
    setMessage("");
    setAnalysis("");
    try {
      const data = await send("/api/coaching/questions/generate", "POST", {
        category,
        count: Number(generateCount),
        scope,
      });
      const created = data.questions ?? [];
      setQuestions((current) => [...created, ...current]);
      setMessage(created.length ? `Added ${created.length}` : "No questions returned");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function smartBulk() {
    setMessage("");
    setAnalysis("");
    try {
      const data = await send("/api/coaching/questions/smart-bulk", "POST", {
        category,
        count: Number(bulkCount),
        scope,
        coverageTargets: splitTags(coverage),
        styleHint,
      });
      const created = data.questions ?? [];
      setQuestions((current) => [...created, ...current]);
      setAnalysis(data.analysis?.recommendation || (data.analysis?.gaps ?? []).join(", "));
      setMessage(created.length ? `Added ${created.length}` : "No questions returned");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function enhance() {
    setMessage("");
    try {
      const data = await send("/api/coaching/questions/enhance", "POST", {
        questionId: enhanceId,
        optionIndex: Number(optionIndex),
        goal,
      });
      if (data.question) replace(data.question);
      setMessage("Option updated");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  const multipleChoice = questions.filter(
    (question) => question.mutable && question.questionType === "MULTIPLE_CHOICE" && question.options?.length,
  );

  return (
    <div className="mt-6 grid gap-6">
      <section className="card p-6">
        <h2 className="h-section">New question</h2>
        <label className="label mt-4" htmlFor="new-text">
          Text
        </label>
        <textarea id="new-text" className="input min-h-24" value={text} onChange={(event) => setText(event.target.value)} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
            {QUESTION_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={questionType}
            onChange={(event) => setQuestionType(event.target.value as QuestionType)}
          >
            {QUESTION_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <label className="label mt-3" htmlFor="new-tags">
          Tags
        </label>
        <input id="new-tags" className="input" value={tags} onChange={(event) => setTags(event.target.value)} />
        {questionType === "MULTIPLE_CHOICE" ? (
          <>
            <label className="label mt-3" htmlFor="new-option">
              First option
            </label>
            <input
              id="new-option"
              className="input"
              value={optionLabel}
              onChange={(event) => setOptionLabel(event.target.value)}
            />
          </>
        ) : null}
        {platformAdmin ? (
          <label className="label mt-3" htmlFor="new-scope">
            Scope
            <select id="new-scope" className="input mt-1.5" value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="platform">Platform</option>
              <option value="org">This org</option>
            </select>
          </label>
        ) : null}
        <button type="button" className="btn-primary mt-4" onClick={() => void createQuestion()}>
          Add question
        </button>
      </section>

      <section className="card p-6">
        <h2 className="h-section">Generate</h2>
        <label className="label mt-4" htmlFor="generate-count">
          How many
        </label>
        <input
          id="generate-count"
          className="input"
          value={generateCount}
          onChange={(event) => setGenerateCount(event.target.value)}
        />
        <button type="button" className="btn-primary mt-4" onClick={() => void generate()}>
          Generate questions
        </button>
      </section>

      <section className="card p-6">
        <h2 className="h-section">Smart bulk</h2>
        <label className="label mt-4" htmlFor="bulk-count">
          How many
        </label>
        <input id="bulk-count" className="input" value={bulkCount} onChange={(event) => setBulkCount(event.target.value)} />
        <label className="label mt-3" htmlFor="coverage">
          Coverage targets
        </label>
        <input id="coverage" className="input" value={coverage} onChange={(event) => setCoverage(event.target.value)} />
        <label className="label mt-3" htmlFor="style-hint">
          Style
        </label>
        <input id="style-hint" className="input" value={styleHint} onChange={(event) => setStyleHint(event.target.value)} />
        <button type="button" className="btn-primary mt-4" onClick={() => void smartBulk()}>
          Generate smart bulk
        </button>
        {analysis ? <p className="mt-3 text-sm text-muted-foreground">{analysis}</p> : null}
      </section>

      <section className="card p-6">
        <h2 className="h-section">Enhance an option</h2>
        <label className="label mt-4" htmlFor="enhance-question">
          Multiple choice
        </label>
        <select id="enhance-question" className="input" value={enhanceId} onChange={(event) => setEnhanceId(event.target.value)}>
          <option value="">Select a question</option>
          {multipleChoice.map((question) => (
            <option key={question.id} value={question.id}>
              {question.text.slice(0, 80)}
            </option>
          ))}
        </select>
        <label className="label mt-3" htmlFor="option-index">
          Option index
        </label>
        <input
          id="option-index"
          className="input"
          value={optionIndex}
          onChange={(event) => setOptionIndex(event.target.value)}
        />
        <label className="label mt-3" htmlFor="enhance-goal">
          Goal
        </label>
        <select id="enhance-goal" className="input" value={goal} onChange={(event) => setGoal(event.target.value)}>
          <option value="clearer">clearer</option>
          <option value="shorter">shorter</option>
          <option value="more diagnostic">more diagnostic</option>
          <option value="score-tag review">score-tag review</option>
        </select>
        <button type="button" className="btn-primary mt-4" onClick={() => void enhance()}>
          Enhance option
        </button>
      </section>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      {questions.length === 0 ? (
        <section className="card p-6">
          <p>No questions in this bank yet.</p>
        </section>
      ) : (
        questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onChange={replace}
            onDelete={(id) => setQuestions((current) => current.filter((item) => item.id !== id))}
          />
        ))
      )}
    </div>
  );
}
