"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropWell } from "@/components/workspace/drop-well";
import { NEEDS_MORE, decodeLessonBody, lessonProse, spineBlocks } from "@/lib/library/teach-from-knowledge";

type Unit = { id: string; title: string; body: string };
type Quiz = { id: string; sourceUnitId: string; prompt: string };
type Detail = {
  error?: string;
  canTeach?: boolean;
  lesson?: { id: string; title: string; status: string; body: string; kind: string };
  units?: Unit[];
  quiz?: Quiz[];
};

export default function TeachLessonPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState("Yes\nNo");
  const [unitId, setUnitId] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [fileNotes, setFileNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function headers() {
    return { "Content-Type": "application/json", "x-fs-org": slug };
  }

  async function load() {
    const res = await fetch(`/api/composer/lessons?id=${lessonId}`, {
      headers: { "x-fs-org": slug },
    });
    const json = (await res.json()) as Detail;
    setData(json);
    if (json.units?.[0] && !unitId) setUnitId(json.units[0].id);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/composer/lessons?id=${lessonId}`, {
      headers: { "x-fs-org": slug },
    })
      .then(async (res) => {
        const json = (await res.json()) as Detail;
        if (cancelled) return;
        setData(json);
        if (json.units?.[0]) setUnitId((current) => current || json.units?.[0]?.id || "");
      })
      .catch(() => {
        if (!cancelled) setData({ error: "forbidden" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, lessonId]);

  async function addUpload() {
    if (!file) {
      setNote("Choose a file.");
      return;
    }
    const form = new FormData();
    form.set("lesson_id", lessonId);
    form.set("kind", "upload");
    form.set("body", fileNotes);
    form.set("title", file.name);
    form.set("file", file);
    const res = await fetch("/api/composer/sources", {
      method: "POST",
      headers: { "x-fs-org": slug },
      body: form,
    });
    const json = await res.json();
    setNote(res.ok ? "Upload saved. Units came from the notes." : json.error);
    if (res.ok) {
      setFile(null);
      setFileNotes("");
      await load();
    }
  }

  async function addQuiz() {
    const res = await fetch("/api/composer/quiz", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        lesson_id: lessonId,
        source_unit_id: unitId,
        prompt,
        choices: choices.split("\n").map((line) => line.trim()).filter(Boolean),
        answer: 0,
      }),
    });
    const json = await res.json();
    setNote(res.ok ? "Quiz item saved." : json.error || "Quiz refused.");
    if (res.ok) {
      setPrompt("");
      await load();
    }
  }

  async function generate() {
    const res = await fetch("/api/library/generate", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ lesson_id: lessonId }),
    });
    const json = await res.json();
    setNote(
      res.ok
        ? typeof json.message === "string"
          ? json.message
          : "Could not generate the lesson."
        : json.error || "Could not generate the lesson.",
    );
    if (res.ok && json.status === "ready") await load();
  }

  async function publish() {
    const res = await fetch("/api/composer/publish", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ lesson_id: lessonId }),
    });
    const json = await res.json();
    setNote(res.ok ? "Published. Visible to children in this org." : json.error);
    if (res.ok) await load();
  }

  if (
    data?.error === "child_cannot_teach" ||
    data?.error === "teacher_only" ||
    data?.canTeach === false
  ) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Teachers only</h1>
        <p className="mt-3 text-muted-foreground">Drafts stay hidden from children.</p>
        <p className="mt-6 text-sm">
          <Link href={`/o/${slug}/l`} className="underline underline-offset-4">
            Published lessons
          </Link>
        </p>
      </main>
    );
  }

  if (!data?.lesson) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p>Lesson not in this org.</p>
      </main>
    );
  }

  const prose = lessonProse(data.lesson.body);
  const activities = spineBlocks(prose);
  const outline = [
    { title: "Objective", kind: "Document" },
    { title: "Teach", kind: "Document" },
    { title: "Do", kind: "Assignment" },
    { title: "Recap", kind: "Document" },
    { title: "Quiz", kind: "Quiz" },
  ];

  return (
    <main className="mx-auto grid max-w-6xl lg:grid-cols-[16rem_minmax(0,1fr)]">
      <nav aria-label="Course" className="border-b border-border px-4 py-6 lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Chapter</p>
        <p className="mt-2 text-sm font-medium">{data.lesson.title}</p>
        <ul className="mt-3 space-y-1">
          {outline.map((item, index) => (
            <li key={item.title}>
              <a href={`#activity-${item.title}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary font-mono text-[10px] text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{item.kind}</span>
                  <span className="block truncate text-sm">{item.title}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {data.lesson.kind} · {data.lesson.status}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{data.lesson.title}</h1>
      {activities.length ? (
        <div className="mt-6 grid gap-4">
          {activities.map((block) => (
            <article id={`activity-${block.title}`} key={block.title} className="scroll-mt-24 border-b border-border py-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {block.title === "Do" ? "Assignment" : "Document"}
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight">{block.title}</h2>
              <p className="mt-4 whitespace-pre-wrap text-base leading-7">{block.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{prose}</p>
      )}
      <div id="activity-Quiz">
      <LessonGate body={data.lesson.body} onGenerate={() => void generate()} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Units from supplied text</h2>
        <ul className="mt-4 grid gap-3">
          {(data.units ?? []).map((unit) => (
            <li key={unit.id} className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="font-medium">{unit.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{unit.body}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{unit.id}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-border bg-card px-5 py-5">
        <h2 className="font-display text-2xl">Upload</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          200MB file, 2GB org. Units still come from the notes, not the file.
        </p>
        <div className="mt-4">
          <DropWell
            label={file ? file.name : "Drop a file, or click to choose one"}
            hint="200MB file, 2GB org. The notes below still become the units."
            onFiles={(files) => setFile(files[0] ?? null)}
          />
        </div>
        <textarea
          className="mt-3 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"
          placeholder="Notes that become units"
          value={fileNotes}
          onChange={(e) => setFileNotes(e.target.value)}
        />
        <Button className="mt-3" onClick={() => void addUpload()}>
          Attach file
        </Button>
      </section>

      <section className="mt-10 rounded-xl border border-border bg-card px-5 py-5">
        <h2 className="font-display text-2xl">Quiz</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Each item needs a source_unit_id. Missing unit is refused.
        </p>
        <select
          className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
        >
          <option value="">Choose a unit</option>
          {(data.units ?? []).map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.title}
            </option>
          ))}
        </select>
        <input
          className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          placeholder="Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <textarea
          className="mt-3 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"
          placeholder="One choice per line"
          value={choices}
          onChange={(e) => setChoices(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void addQuiz()}>Add quiz item</Button>
          <Button variant="outline" onClick={() => void publish()}>
            Publish
          </Button>
        </div>
        <ul className="mt-4 text-sm text-muted-foreground">
          {(data.quiz ?? []).map((item) => (
            <li key={item.id}>{item.prompt}</li>
          ))}
        </ul>
      </section>

      {note ? (
        <p className={note === NEEDS_MORE ? "mt-6 text-sm" : "mt-6 text-sm text-pass"}>{note}</p>
      ) : null}
      <p className="mt-8 text-sm">
        <Link href={`/o/${slug}/teach`} className="underline underline-offset-4">
          Back to teach
        </Link>
        {data.lesson.status === "published" ? (
          <>
            {" · "}
            <Link href={`/o/${slug}/l/${data.lesson.id}`} className="underline underline-offset-4">
              Learner view
            </Link>
          </>
        ) : null}
      </p>
      </div>
      </div>
    </main>
  );
}

function LessonGate({ body, onGenerate }: { body: string; onGenerate: () => void }) {
  const plan = decodeLessonBody(body).plan;
  return (
    <section className="mt-8 rounded-xl border border-border bg-card px-5 py-5">
      <h2 className="font-display text-2xl">Generate Lesson</h2>
      {plan && !plan.ready ? <p className="mt-3 text-sm">{NEEDS_MORE}</p> : null}
      {plan?.ready ? <p className="mt-3 text-sm text-muted-foreground">{plan.how}</p> : null}
      <p className="mt-3 text-sm text-muted-foreground">
        Quizzes cite a source_unit_id already in this knowledge.
      </p>
      <Button className="mt-4" type="button" onClick={onGenerate}>
        Generate Lesson
      </Button>
    </section>
  );
}
