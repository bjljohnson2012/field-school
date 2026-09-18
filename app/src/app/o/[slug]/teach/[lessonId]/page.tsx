"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Unit = { id: string; title: string; body: string };
type Quiz = { id: string; sourceUnitId: string; prompt: string };
type Detail = {
  error?: string;
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
    void load();
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

  if (data?.error === "child_cannot_teach" || data?.error === "teacher_only") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Teachers only</h1>
        <p className="mt-3 text-muted-foreground">Drafts stay hidden from children.</p>
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {data.lesson.kind} · {data.lesson.status}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{data.lesson.title}</h1>
      <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{data.lesson.body}</p>

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
        <input
          className="mt-4 block text-sm"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
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

      {note ? <p className="mt-6 text-sm text-pass">{note}</p> : null}
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
    </main>
  );
}
