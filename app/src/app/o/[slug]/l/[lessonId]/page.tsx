"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Unit = { id: string; title: string; body: string };
type Detail = {
  error?: string;
  lesson?: { id: string; title: string; status: string; body: string };
  units?: Unit[];
  quiz?: { id: string; prompt: string; choices: string[] }[];
};

export default function PublishedLessonPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    void fetch(`/api/composer/lessons?id=${lessonId}`, {
      headers: { "x-fs-org": slug },
    })
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [slug, lessonId]);

  if (data?.error || !data?.lesson) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Not in this catalog</h1>
        <p className="mt-3 text-muted-foreground">
          Drafts stay hidden. Sales lessons do not appear in household.
        </p>
        <p className="mt-6 text-sm">
          <Link href={`/o/${slug}`} className="underline underline-offset-4">
            Back to org
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{slug}</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{data.lesson.title}</h1>
      <p className="mt-4 whitespace-pre-wrap text-lg text-muted-foreground">{data.lesson.body}</p>
      <section className="mt-10 grid gap-4">
        {(data.units ?? []).map((unit) => (
          <article key={unit.id} className="rounded-xl border border-border bg-card px-5 py-4">
            <h2 className="font-display text-2xl">{unit.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{unit.body}</p>
          </article>
        ))}
      </section>
      {(data.quiz ?? []).length ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Check yourself</h2>
          <ul className="mt-4 grid gap-3">
            {(data.quiz ?? []).map((item) => (
              <li key={item.id} className="rounded-xl border border-border px-5 py-4">
                <p>{item.prompt}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-8 text-sm">
        <Link href={`/o/${slug}`} className="underline underline-offset-4">
          Back to org
        </Link>
      </p>
    </main>
  );
}
