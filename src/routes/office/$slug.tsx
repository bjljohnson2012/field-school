import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ShareCourseButton } from "@/components/share-course-button";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { CourseContentEditor } from "@/components/course-content-editor";
import {
  deleteCourse,
  getOfficeCourse,
  saveCourse,
  setPublished,
} from "@/lib/course/catalog";
import { generateCourse } from "@/lib/course/generate";
import { BANNER_STYLES, type CourseRecord } from "@/lib/course/types";

export const Route = createFileRoute("/office/$slug")({ component: EditCourse });

function EditCourse() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
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
            Back to admin
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
      // Keep station numbers sequential and drop blank key-point lines that the
      // textarea editor can leave behind.
      const normalized: CourseRecord = {
        ...course,
        modules: course.modules.map((m, i) => ({
          ...m,
          station: String(i + 1).padStart(2, "0"),
          bullets: m.bullets.filter((b) => b.trim().length > 0),
        })),
      };
      await saveCourse({ data: normalized });
      setCourse(normalized);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!course) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete “${course.title}”? This cannot be undone.`)
    ) {
      return;
    }
    setBusy("del");
    setError(null);
    try {
      await deleteCourse({ data: { slug: course.slug } });
      await navigate({ to: "/office" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
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
              className="md-field mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={course.title}
              onChange={(e) => patch("title", e.target.value)}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Tagline
            <input
              className="md-field mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={course.tagline}
              onChange={(e) => patch("tagline", e.target.value)}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Kicker
            <input
              className="md-field mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={course.kicker}
              onChange={(e) => patch("kicker", e.target.value)}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Video URL (YouTube, Loom, or X)
            <input
              className="md-field mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={course.videoUrl}
              placeholder="https://youtube.com/… · loom.com/share/… · x.com/…/status/…"
              onChange={(e) => patch("videoUrl", e.target.value)}
            />
          </label>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Catalog card banner
            </p>
            <p className="mt-1 text-xs text-muted">
              Choose how this course looks in the catalog — the video thumbnail,
              a plain accent strip, or a compact card with no banner.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {BANNER_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => patch("bannerStyle", style)}
                  className={`md-interactive h-9 rounded-lg border px-3 text-sm capitalize ${
                    course.bannerStyle === style
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border text-fg"
                  }`}
                >
                  {style === "video"
                    ? "Video thumbnail"
                    : style === "gradient"
                      ? "Accent strip"
                      : "No banner"}
                </button>
              ))}
            </div>
            {course.bannerStyle === "gradient" ? (
              <label className="mt-3 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted">
                Accent color
                <input
                  type="color"
                  className="h-9 w-14 cursor-pointer rounded border border-border bg-surface"
                  value={/^#[0-9a-fA-F]{6}$/.test(course.bannerColor) ? course.bannerColor : "#4f46e5"}
                  onChange={(e) => patch("bannerColor", e.target.value)}
                />
                <button
                  type="button"
                  className="md-interactive rounded-lg border border-border px-2 py-1 text-xs normal-case"
                  onClick={() => patch("bannerColor", "")}
                >
                  Use theme accent
                </button>
              </label>
            ) : null}
          </div>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Source context
            <textarea
              className="md-field mt-2 min-h-40 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              value={course.contextNotes}
              onChange={(e) => patch("contextNotes", e.target.value)}
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-warn">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={busy !== null} onClick={() => void persist()}>
            {saved && !busy ? "Saved" : "Save course"}
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
          {course.published ? (
            <ShareCourseButton slug={course.slug} title={course.title} />
          ) : null}
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void remove()}
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-warn/40 px-4 text-sm text-warn disabled:opacity-50"
          >
            {busy === "del" ? "Deleting…" : "Delete course"}
          </button>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Course content
          </p>
          <p className="mt-1 mb-6 text-sm text-muted">
            Edit station text, key points, and quiz/exam questions. Changes save
            when you press “Save course”.
          </p>
          <CourseContentEditor
            course={course}
            onChange={(next) => {
              setCourse(next);
              setSaved(false);
            }}
          />
          <div className="mt-6">
            <Button disabled={busy !== null} onClick={() => void persist()}>
              {saved && !busy ? "Saved" : "Save course"}
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            to="/c/$courseSlug"
            params={{ courseSlug: course.slug }}
            className="md-interactive inline-flex h-11 items-center rounded-xl px-2 text-muted"
          >
            Preview as student
          </Link>
          <Link
            to="/office"
            className="md-interactive inline-flex h-11 items-center rounded-xl px-2 text-muted"
          >
            All courses
          </Link>
        </div>
      </main>
    </div>
  );
}
