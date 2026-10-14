"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lessonsForSurface, readStoredLessons, type LibraryLesson } from "@/lib/library/m10";

export function PublishedLearnList() {
  const [lessons, setLessons] = useState<LibraryLesson[]>([]);

  useEffect(() => {
    setLessons(lessonsForSurface(readStoredLessons(), "member", "learn"));
  }, []);

  return (
    <section className="mt-8" aria-label="Published lessons" data-learn-catalog="published">
      <h2 className="font-display text-2xl tracking-tight">Published lessons</h2>
      {lessons.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No published lessons yet.</p>
      ) : (
        <ul className="mt-3">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link href={`/c/${lesson.courseSlug}/${lesson.slug}`}>{lesson.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
