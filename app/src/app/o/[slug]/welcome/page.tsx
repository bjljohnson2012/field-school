"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { lessonForOrg } from "@/lib/campus-runtime/lessons";

export default function WelcomeLessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const lesson = lessonForOrg(slug);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/org/active", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fs-org": slug },
      body: JSON.stringify({ slug }),
    });
  }, [slug]);

  if (!lesson) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p>No fixture lesson for this org.</p>
        <Link href={`/o/${slug}`}>Back</Link>
      </main>
    );
  }
  const current = lesson;

  async function watch() {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fs-org": slug },
      body: JSON.stringify({
        kind: "watch",
        course: current.course,
        station: current.slug,
        object_id: current.objectId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not write.");
      return;
    }
    setDone(true);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {lesson.course}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{lesson.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{lesson.body}</p>
      <Button className="mt-8" disabled={done} onClick={() => void watch()}>
        {done ? "Watch credited" : "Mark watched"}
      </Button>
      {error ? <p className="mt-4 text-sm">{error}</p> : null}
      <p className="mt-6 text-sm">
        <Link href={`/o/${slug}`} className="underline underline-offset-4">
          Back to org
        </Link>
      </p>
    </main>
  );
}
