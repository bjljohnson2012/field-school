"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  }

  useEffect(() => {
    void fetch("/api/org/active", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ slug }),
    }).then(() => load());
  }, [slug]);

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
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Composer</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Teach</h1>
      <p className="mt-4 text-muted-foreground">
        Text, upload, book, or link. Units come from the text you supply. Drafts stay hidden from
        children.
      </p>

      <section className="mt-10 rounded-xl border border-border bg-card px-5 py-5">
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
        <h2 className="font-display text-2xl">Lessons</h2>
        <ul className="mt-4 grid gap-3">
          {(data?.lessons ?? []).map((lesson) => (
            <li key={lesson.id} className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {lesson.kind} · {lesson.status}
              </p>
              <p className="mt-1 font-display text-xl">{lesson.title}</p>
              <p className="mt-3 text-sm">
                <Link
                  href={`/o/${slug}/teach/${lesson.id}`}
                  className="underline underline-offset-4"
                >
                  Open desk
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </section>

      {note ? <p className="mt-6 text-sm text-pass">{note}</p> : null}
      <p className="mt-8 text-sm">
        <Link href={`/o/${slug}`} className="underline underline-offset-4">
          Back to org
        </Link>
      </p>
    </main>
  );
}
