"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NEEDS_MORE } from "@/lib/library/teach-from-knowledge";

type Lesson = {
  id: string;
  title: string;
  status: string;
  kind: string;
};

type Catalog = {
  ok?: boolean;
  error?: string;
  canTeach?: boolean;
  lessons?: Lesson[];
};

const KINDS = [
  { value: "text", label: "Text" },
  { value: "upload", label: "Upload" },
  { value: "book", label: "Book" },
  { value: "link", label: "Link" },
];

export default function TeachPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Catalog | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("text");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [waiting, setWaiting] = useState<Lesson[]>([]);

  function headers() {
    return { "Content-Type": "application/json", "x-fs-org": slug };
  }

  async function load() {
    const res = await fetch("/api/composer/catalog", { headers: { "x-fs-org": slug } });
    const json = (await res.json()) as Catalog;
    if (!res.ok) {
      setData({ error: json.error || "forbidden" });
      return;
    }
    setData(json);
    const openRes = await fetch("/api/library/candidates", { headers: { "x-fs-org": slug } });
    if (openRes.ok) {
      const openJson = (await openRes.json()) as { lessons?: Lesson[] };
      setWaiting(Array.isArray(openJson.lessons) ? openJson.lessons : []);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/org/active", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fs-org": slug },
      body: JSON.stringify({ slug }),
    })
      .then(async () => {
        if (cancelled) return;
        const res = await fetch("/api/composer/catalog", { headers: { "x-fs-org": slug } });
        const json = (await res.json()) as Catalog;
        if (cancelled) return;
        if (!res.ok) {
          setData({ error: json.error || "forbidden" });
          return;
        }
        setData(json);
        const openRes = await fetch("/api/library/candidates", { headers: { "x-fs-org": slug } });
        if (!openRes.ok || cancelled) return;
        const openJson = (await openRes.json()) as { lessons?: Lesson[] };
        setWaiting(Array.isArray(openJson.lessons) ? openJson.lessons : []);
      })
      .catch(() => {
        if (!cancelled) setData({ error: "forbidden" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function generate(lessonId: string) {
    const res = await fetch("/api/library/generate", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ lesson_id: lessonId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNote(json.error || "Could not generate the lesson.");
      return;
    }
    setNote(typeof json.message === "string" ? json.message : "Could not generate the lesson.");
    if (json.status === "ready") await load();
  }

  async function create() {
    const res = await fetch("/api/composer/lessons", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        title,
        kind,
        body,
        url,
        book_title: bookTitle,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNote(json.error || "Could not save.");
      return;
    }
    setTitle("");
    setBody("");
    setUrl("");
    setBookTitle("");
    setNote("Draft saved. Hidden from children until you publish.");
    await load();
  }

  if (data?.error === "child_cannot_teach" || data?.error === "teacher_only" || data?.canTeach === false) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Teachers only</h1>
        <p className="mt-3 text-muted-foreground">
          Drafts stay off the child catalog. Open a published lesson instead.
        </p>
        <p className="mt-6 text-sm">
          <Link href={`/o/${slug}/l`} className="underline underline-offset-4">
            Published lessons
          </Link>
        </p>
      </main>
    );
  }

  if (data?.error === "sign_in_required") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Sign in</h1>
        <p className="mt-3 text-muted-foreground">Composer is for signed-in teachers.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border bg-card/50 p-4 lg:sticky lg:top-14 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Course builder</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Teach</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Drafts stay hidden from children until you publish.
        </p>
        <h2 className="mt-6 text-sm font-semibold">Lessons</h2>
        <ul className="mt-2 space-y-1">
          {data && (data.lessons ?? []).length === 0 ? (
            <li className="px-2 py-2 text-sm text-muted-foreground">No drafts yet.</li>
          ) : null}
          {(data?.lessons ?? []).map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/o/${slug}/teach/${lesson.id}`}
                className="block rounded-lg px-2 py-2 text-sm hover:bg-secondary"
              >
                <span className="block truncate font-medium">{lesson.title}</span>
                <span className="text-xs text-muted-foreground">
                  {lesson.kind} · {lesson.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm">
          <Link href={`/o/${slug}`} className="underline underline-offset-4">
            Back to org
          </Link>
        </p>
      </aside>
      <div className="min-w-0">
      <p className="text-sm text-muted-foreground">
        Text, upload, book, or link. Units come from the text you supply.
      </p>

      <section className="mt-6 rounded-2xl border border-border bg-card px-5 py-5">
        <h2 className="font-display text-2xl">New lesson</h2>
        <div className="mt-4 grid gap-3">
          <input
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {KINDS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {kind === "link" ? (
            <input
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          ) : null}
          {kind === "book" ? (
            <input
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="Book title"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
            />
          ) : null}
          <textarea
            className="min-h-36 rounded-xl border border-border bg-background px-3 py-3 text-sm"
            placeholder="Supplied text. Blank lines split units. We do not scrape the link."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button className="h-11" onClick={() => void create()}>
            Save draft
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Not generated yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Knowledge in this org that does not have a lesson yet. Generate Lesson writes Objective, Teach,
          Do, and Recap only when the stored knowledge can teach it.
        </p>
        {waiting.length ? (
          <ul className="mt-4 grid gap-3">
            {waiting.map((lesson) => (
              <li key={lesson.id} className="rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_16px_36px_-24px_rgba(26,25,22,0.55)]">
                <p className="font-display text-xl">{lesson.title}</p>
                <Button className="mt-3" type="button" variant="outline" onClick={() => void generate(lesson.id)}>
                  Generate Lesson
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Nothing is waiting.</p>
        )}
      </section>

      {note ? (
        <p className={note === NEEDS_MORE ? "mt-6 text-sm" : "mt-6 text-sm text-pass"}>{note}</p>
      ) : null}
      </div>
    </main>
  );
}
