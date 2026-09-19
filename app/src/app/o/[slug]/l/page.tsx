"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Lesson = { id: string; title: string; status: string; kind: string };

export default function PublishedCatalogPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [canTeach, setCanTeach] = useState(false);

  useEffect(() => {
    void fetch("/api/composer/catalog", { headers: { "x-fs-org": slug } })
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) {
          setError(json.error || "unavailable");
          return;
        }
        setCanTeach(Boolean(json.canTeach));
        setLessons((json.lessons as Lesson[]).filter((lesson) => lesson.status === "published"));
      });
  }, [slug]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{slug}</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Published lessons</h1>
      <p className="mt-4 text-muted-foreground">
        Drafts stay hidden. This catalog stays inside this org.
      </p>
      {error ? <p className="mt-6 text-sm">{error}</p> : null}
      <ul className="mt-8 grid gap-3">
        {lessons.map((lesson) => (
          <li key={lesson.id} className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{lesson.kind}</p>
            <p className="mt-1 font-display text-xl">{lesson.title}</p>
            <p className="mt-3 text-sm">
              <Link href={`/o/${slug}/l/${lesson.id}`} className="underline underline-offset-4">
                Open
              </Link>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm">
        <Link href={`/o/${slug}`} className="underline underline-offset-4">
          Back to org
        </Link>
        {canTeach ? (
          <>
            {" · "}
            <Link href={`/o/${slug}/teach`} className="underline underline-offset-4">
              Teach
            </Link>
          </>
        ) : null}
      </p>
    </main>
  );
}
