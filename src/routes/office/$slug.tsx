import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getOfficeCourse, saveCourse, setPublished } from "@/lib/course/catalog";
import { generateCourse } from "@/lib/course/generate";
import type { CourseRecord } from "@/lib/course/types";

export const Route = createFileRoute("/office/$slug")({ component: EditCourse });

function EditCourse() {
  const { slug } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [course, setCourse] = useState<CourseRecord | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isPending || !user) return;
    getOfficeCourse({ data: { slug } })
      .then(setCourse)
      .catch(() => setCourse(null));
  }, [slug, user, isPending]);

  if (isPending || course === undefined) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">
          Loading course…
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (!course) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="font-display text-3xl">Not found</h1>
          <Link to="/office" className="mt-4 inline-flex h-11 items-center text-sm">
            Back to office
          </Link>
        </main>
      </div>
    );
  }

  function patch<K extends keyof CourseRecord>(key: K, value: CourseRecord[K]) {
    setCourse((c) => (c ? { ...c, [key]: value } : c));
    setSaved(false);
  }

  async function persist() {
    if (!course) return;
    setBusy("save");
    setError(null);
    try {
      await saveCourse({ data: course });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function togglePublish() {
    if (!course) return;
    setBusy("pub");
    try {
      await setPublished({
        data: { slug: course.slug, published: !course.published },
      });
      setCourse({ ...course, published: !course.published });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(null);
    }
  }

  async function regen() {
    if (!course) return;
    setBusy("gen");
    setError(null);
    try {
      const res = await generateCourse({
        data: {
          youtubeUrl: course.videoUrl || course.videoId,
          context: course.contextNotes,
          title: course.title,
          slug: course.slug,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCourse(res.course);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          {course.published ? "Published" : "Draft"} · {course.modules.length}{" "}
          stations
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{course.title}</h1>

        <div className="mt-8 space-y-4">
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Title
            <input
              className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={course.title}
              onChange={(e) => patch("title", e.target.value)}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Tagline
            <input
              className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={course.tagline}
              onChange={(e) => patch("tagline", e.target.value)}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Kicker
            <input
              className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={course.kicker}
              onChange={(e) => patch("kicker", e.target.value)}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            YouTube URL
            <input
              className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={course.videoUrl}
              onChange={(e) => patch("videoUrl", e.target.value)}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Source context
            <textarea
              className="mt-2 min-h-40 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              value={course.contextNotes}
              onChange={(e) => patch("contextNotes", e.target.value)}
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-warn">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={busy !== null} onClick={() => void persist()}>
            {saved && !busy ? "Saved" : "Save metadata"}
          </Button>
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={() => void togglePublish()}
          >
            {course.published ? "Unpublish" : "Publish to catalog"}
          </Button>
          <Button
            variant="secondary"
            disabled={busy !== null || course.contextNotes.trim().length < 80}
            onClick={() => void regen()}
          >
            {busy === "gen" ? "Rebuilding…" : "Rebuild stations from context"}
          </Button>
        </div>

        <ol className="mt-10 space-y-3">
          {course.modules.map((m) => (
            <li
              key={m.slug}
              className="rounded-lg border border-border bg-surface px-4 py-3"
            >
              <p className="font-mono text-xs text-muted">
                Station {m.station} · {m.clips.length} clips · {m.quiz.length} quiz
              </p>
              <h2 className="mt-1 font-display text-xl">{m.title}</h2>
              <p className="mt-1 text-sm text-muted">{m.kicker || m.summary}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            to="/c/$courseSlug"
            params={{ courseSlug: course.slug }}
            className="h-11 text-muted hover:text-fg"
          >
            Preview as student
          </Link>
          <Link to="/office" className="h-11 text-muted hover:text-fg">
            All courses
          </Link>
        </div>
      </main>
    </div>
  );
}
