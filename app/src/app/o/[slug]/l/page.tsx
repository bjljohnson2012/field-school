"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DeskPage, EmptyState, KpiStrip } from "@/components/desk/desk";
import { Dialog } from "@/components/saas/dialog";
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
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Published" | "Unpublished">("all");
  const [edits, setEdits] = useState<Record<string, { title: string; body: string; status: string; open: boolean }>>({});
  const [media, setMedia] = useState<Map<string, number>>(new Map());
  const [forSlug, setForSlug] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/composer/catalog", { headers: { "x-fs-org": slug } })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setForSlug(slug);
        setReady(true);
        setError(null);
        if (!json.ok) {
          const code = typeof json.error === "string" ? json.error : "";
          setLessons([]);
          setError(code === "sign_in_required" ? "Sign in to see this org." : "This catalog is not available.");
          return;
        }
        setCanTeach(Boolean(json.canTeach));
        setLessons(json.lessons as Lesson[]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, revision]);

  const listed = forSlug === slug ? lessons : [];
  const lessonIds = listed
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
  for (const lesson of listed) {
    const key = entityKey({ kind: "lesson", id: lesson.id });
    const list = edges.filter((edge) => edge.to.key === key);
    usedBy.set(lesson.id, list);
    usedCount.set(lesson.id, list.length);
  }
  const publishedIds = listed.filter((lesson) => lesson.status === "published").map((lesson) => lesson.id);
  const kpis = libraryKpis({ lessonIds: publishedIds, usedBy: usedCount, sources: media });

  const shown = listed.filter((lesson) => {
    const label = publishLabel(lesson.status);
    if (statusFilter !== "all" && label !== statusFilter) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return readableTitle(lesson.title, "").toLowerCase().includes(needle);
  });
  return (
    <DeskPage eyebrow={slug} title="Lessons"
      width="6xl"
      lede="Published and unpublished lessons are both listed. An unpublished lesson stays off the child catalog."
      actions={
        canTeach ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            New lesson
          </button>
        ) : null
      }
    >
      {error ? <p className="mb-6 text-sm">{error}</p> : null}
      {canTeach && addOpen ? (
        <Dialog title="Add a lesson" onClose={() => setAddOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const body = draft.trim();
            if (body.length < 12 || adding) return;
            setAdding(true);
            void fetch("/api/composer/lessons", {
              method: "POST",
              headers: { "content-type": "application/json", "x-fs-org": slug },
              body: JSON.stringify({ kind: "text", title: "", body }),
            })
              .then(async (res) => {
                if (!res.ok) return;
                setDraft("");
                setAddOpen(false);
                setRevision((value) => value + 1);
              })
              .finally(() => setAdding(false));
          }}
        >
          <p className="text-sm text-muted-foreground">Paste the lesson. It stays unpublished until you publish it.</p>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
          />
          <button type="submit" disabled={adding} className="mt-3 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm text-primary-foreground">
            Add lesson
          </button>
        </form>
        </Dialog>
      ) : null}
      {listed.length ? <KpiStrip label="This catalog at a glance" items={kpis} /> : null}
      {ready && forSlug === slug && !error && !listed.length ? <EmptyState>No lessons in this org yet.</EmptyState> : null}
      {listed.length ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="min-w-48 flex-1">
            <span className="sr-only">Find a lesson</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a lesson"
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter lessons">
            {(
              [
                ["all", "All"],
                ["Published", "Published"],
                ["Unpublished", "Unpublished"],
              ] as const
            ).map(([id, name]) => (
              <button
                key={id}
                type="button"
                aria-pressed={statusFilter === id}
                onClick={() => setStatusFilter(id)}
                className={
                  statusFilter === id
                    ? "h-8 rounded-full bg-primary px-3 text-xs text-primary-foreground"
                    : "h-8 rounded-full border border-border bg-card px-3 text-xs"
                }
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {listed.length && !shown.length ? <p className="text-sm text-muted-foreground">Nothing matches.</p> : null}
      {shown.length ? (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_8rem_minmax(0,1fr)_8rem] gap-3 border-b border-border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:grid">
          <span>Lesson</span>
          <span>Status</span>
          <span>Sources</span>
          <span>Used by</span>
        </div>
      <ul>
        {shown.map((lesson) => {
          const lessonEdges = usedBy.get(lesson.id) ?? [];
          const files = media.get(lesson.id) ?? 0;
          const label = publishLabel(lesson.status);
          return (
            <li key={lesson.id} className="border-b border-border px-4 py-4 last:border-b-0">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_8rem_minmax(0,1fr)_8rem] sm:items-center sm:gap-3">
              <p className="truncate text-sm font-medium">{readableTitle(lesson.title, "")}</p>
              <p>
                <span className={label === "Published" ? "inline-flex h-6 items-center rounded-full bg-pass/15 px-2 text-xs text-pass" : "inline-flex h-6 items-center rounded-full bg-secondary px-2 text-xs text-muted-foreground"}>
                  {label}
                </span>
              </p>
              <p className="text-sm text-muted-foreground" data-lesson-adjacency={lesson.id}>
                {files} {files === 1 ? "source" : "sources"} · used by {lessonEdges.length}{" "}
                {lessonEdges.length === 1 ? "brain" : "brains"} you can see
              </p>
              <p className="hidden text-sm tabular-nums text-muted-foreground sm:block sm:text-right">{lessonEdges.length}</p>
              </div>
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
                    {" · "}
                    <button
                      type="button"
                      className="underline underline-offset-4"
                      onClick={() => {
                        const existing = edits[lesson.id];
                        if (existing?.open) {
                          setEdits((current) => ({
                            ...current,
                            [lesson.id]: { ...existing, open: false },
                          }));
                          return;
                        }
                        const opened = {
                          title: existing?.title || readableTitle(lesson.title, ""),
                          body: existing?.body || "",
                          status: existing?.status || lesson.status,
                          open: true,
                        };
                        setEdits((current) => ({ ...current, [lesson.id]: opened }));
                        if (opened.body) return;
                        void fetch(`/api/composer/lessons?id=${lesson.id}`, { headers: { "x-fs-org": slug } })
                          .then((res) => res.json())
                          .then((json: { lesson?: { body?: string } }) => {
                            const body = typeof json.lesson?.body === "string" ? json.lesson.body : "";
                            setEdits((current) => ({
                              ...current,
                              [lesson.id]: { ...(current[lesson.id] ?? opened), body, open: true },
                            }));
                          });
                      }}
                    >
                      Edit
                    </button>
                  </>
                ) : null}
              </p>
              {canTeach && edits[lesson.id]?.open ? (
                <Dialog
                  title="Edit lesson"
                  onClose={() =>
                    setEdits((current) => {
                      const row = current[lesson.id];
                      if (!row) return current;
                      return { ...current, [lesson.id]: { ...row, open: false } };
                    })
                  }
                >
                <form
                  className="grid gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const edit = edits[lesson.id];
                    if (!edit) return;
                    void fetch("/api/composer/lessons", {
                      method: "PATCH",
                      headers: { "content-type": "application/json", "x-fs-org": slug },
                      body: JSON.stringify({
                        id: lesson.id,
                        title: edit.title,
                        body: edit.body,
                        status: edit.status === "published" ? "published" : "draft",
                      }),
                    }).then((res) => {
                      if (res.ok) setRevision((value) => value + 1);
                    });
                  }}
                >
                  <input
                    value={edits[lesson.id]?.title ?? ""}
                    onChange={(event) => {
                      const title = event.target.value;
                      setEdits((current) => {
                        const row = current[lesson.id];
                        if (!row) return current;
                        return { ...current, [lesson.id]: { ...row, title } };
                      });
                    }}
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <textarea
                    value={edits[lesson.id]?.body ?? ""}
                    onChange={(event) => {
                      const body = event.target.value;
                      setEdits((current) => {
                        const row = current[lesson.id];
                        if (!row) return current;
                        return { ...current, [lesson.id]: { ...row, body } };
                      });
                    }}
                    rows={5}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={edits[lesson.id]?.status === "published"}
                      onChange={(event) => {
                        const status = event.target.checked ? "published" : "draft";
                        setEdits((current) => {
                          const row = current[lesson.id];
                          if (!row) return current;
                          return { ...current, [lesson.id]: { ...row, status } };
                        });
                      }}
                    />
                    Published
                  </label>
                  <button type="submit" className="h-10 justify-self-start rounded-xl bg-primary px-4 text-sm text-primary-foreground">
                    Save lesson
                  </button>
                </form>
                </Dialog>
              ) : null}
            </li>
          );
        })}
      </ul>
      </div>
      ) : null}
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
