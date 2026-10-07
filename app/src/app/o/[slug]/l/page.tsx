"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DeskPage, EmptyState, KpiStrip } from "@/components/desk/desk";
import { EdgeList } from "@/components/knowledge/edge-list";
import { libraryKpis } from "@/lib/desk/kpi";
import { entityKey, parseEdgeViews, type EdgeView } from "@/lib/knowledge/graph";
import { publishLabel, readableTitle } from "@/lib/library/knowledge-labels";

type Lesson = { id: string; title: string; status: string };

function mediaCounts(json: unknown): Map<string, number> {
  const counts = new Map<string, number>();
  if (typeof json !== "object" || json === null) return counts;
  const media: unknown = Object.getOwnPropertyDescriptor(json, "media")?.value;
  if (!Array.isArray(media)) return counts;
  const docs: unknown[] = media;
  for (const doc of docs) {
    if (typeof doc !== "object" || doc === null) continue;
    const lessonId: unknown = Object.getOwnPropertyDescriptor(doc, "lessonId")?.value;
    if (typeof lessonId === "string") counts.set(lessonId, (counts.get(lessonId) ?? 0) + 1);
  }
  return counts;
}

export default function PublishedCatalogPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [canTeach, setCanTeach] = useState(false);
  const [edges, setEdges] = useState<readonly EdgeView[]>([]);
  const [media, setMedia] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setLessons([]);
    setEdges([]);
    setMedia(new Map());
    setError(null);
    setReady(false);
    void fetch("/api/composer/catalog", { headers: { "x-fs-org": slug } })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setReady(true);
        if (!json.ok) {
          const code = typeof json.error === "string" ? json.error : "";
          setError(code === "sign_in_required" ? "Sign in to see this org." : "This catalog is not available.");
          return;
        }
        setCanTeach(Boolean(json.canTeach));
        setLessons(json.lessons as Lesson[]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const lessonIds = lessons
    .slice(0, 100)
    .map((lesson) => lesson.id)
    .join(",");
  useEffect(() => {
    if (!lessonIds) return;
    let cancelled = false;
    void fetch(`/api/knowledge/edges?focus=library&lessons=${lessonIds}`, { headers: { "x-fs-org": slug } })
      .then((res) => res.json())
      .then((json: unknown) => {
        if (cancelled) return;
        setEdges(parseEdgeViews(json) ?? []);
        setMedia(mediaCounts(json));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [lessonIds, slug]);

  const usedBy = new Map<string, EdgeView[]>();
  const usedCount = new Map<string, number>();
  for (const lesson of lessons) {
    const key = entityKey({ kind: "lesson", id: lesson.id });
    const list = edges.filter((edge) => edge.to.key === key);
    usedBy.set(lesson.id, list);
    usedCount.set(lesson.id, list.length);
  }
  const publishedIds = lessons.filter((lesson) => lesson.status === "published").map((lesson) => lesson.id);
  const kpis = libraryKpis({ lessonIds: publishedIds, usedBy: usedCount, sources: media });

  return (
    <DeskPage eyebrow={slug} title="Lessons" width="3xl" lede="Published and unpublished lessons are both listed. An unpublished lesson stays off the child catalog.">
      {error ? <p className="mb-6 text-sm">{error}</p> : null}
      {lessons.length ? <KpiStrip label="This catalog at a glance" items={kpis} /> : null}
      {ready && !error && !lessons.length ? <EmptyState>No lessons in this org yet.</EmptyState> : null}
      <ul className="grid gap-3">
        {lessons.map((lesson) => {
          const lessonEdges = usedBy.get(lesson.id) ?? [];
          const files = media.get(lesson.id) ?? 0;
          const label = publishLabel(lesson.status);
          return (
            <li key={lesson.id} className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-xl">{readableTitle(lesson.title, "")}</p>
              <p className="mt-1 text-xs text-muted-foreground" data-lesson-adjacency={lesson.id}>
                {files} {files === 1 ? "source" : "sources"} · used by {lessonEdges.length}{" "}
                {lessonEdges.length === 1 ? "brain" : "brains"} you can see
              </p>
              {lessonEdges.length ? (
                <div className="mt-3">
                  <EdgeList edges={lessonEdges} empty="" />
                </div>
              ) : null}
              <p className="mt-3 text-sm">
                <Link href={`/o/${slug}/l/${lesson.id}`} className="underline underline-offset-4">
                  Open
                </Link>
                {canTeach ? (
                  <>
                    {" · "}
                    <Link href={`/o/${slug}/teach/${lesson.id}`} className="underline underline-offset-4">
                      Manage
                    </Link>
                  </>
                ) : null}
              </p>
            </li>
          );
        })}
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
    </DeskPage>
  );
}
