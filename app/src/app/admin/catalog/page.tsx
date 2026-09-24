"use client";

import Link from "next/link";
import { usePortal } from "@/hooks/use-portal";
import { listPublishedCourses } from "@/lib/course/catalog";
import { sharePages } from "@/lib/share";

export default function AdminCatalogPage() {
  const { ready, isStaff } = usePortal();
  const courses = listPublishedCourses();

  if (!ready || !isStaff) return null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <p className="eyebrow">Published</p>
      <h1 className="h-page mt-2">Catalog</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Courses and share pages use normal paths. Send /c/grok-bot or
        /share/desk — not a hash card.
      </p>

      <section className="mt-10">
        <h2 className="h-section">Courses</h2>
        <ul className="mt-4 grid gap-3">
          {courses.map((c) => (
            <li
              key={c.slug}
              className="card flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="font-mono text-sm text-muted-foreground">
                  /c/{c.slug} · {c.stationCount} stations
                </p>
              </div>
              <Link href={`/c/${c.slug}`} className="text-sm text-primary underline underline-offset-2">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="h-section">Share pages</h2>
        <ul className="mt-4 grid gap-3">
          {sharePages.map((s) => (
            <li
              key={s.slug}
              className="card flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="font-mono text-sm text-muted-foreground">
                  /share/{s.slug}
                </p>
              </div>
              <Link href={`/share/${s.slug}`} className="text-sm text-primary underline underline-offset-2">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
