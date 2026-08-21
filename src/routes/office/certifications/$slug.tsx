import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  deleteCertification,
  getCertificationAdmin,
  setCertificationPublished,
  upsertCertification,
} from "@/lib/course/certifications";

export const Route = createFileRoute("/office/certifications/$slug")({
  component: EditCertification,
});

type Cert = Awaited<ReturnType<typeof getCertificationAdmin>>;

function EditCertification() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [cert, setCert] = useState<Cert | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [published, setPublishedState] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending || !user) return;
    getCertificationAdmin({ data: { slug } })
      .then((c) => {
        setCert(c);
        if (c) {
          setTitle(c.title);
          setDescription(c.description);
          setSelected(c.courseSlugs);
          setPublishedState(c.published);
        }
      })
      .catch(() => setCert(null));
  }, [slug, user, isPending]);

  if (isPending || cert === undefined) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">Loading…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (!cert) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="font-display text-3xl">Not found</h1>
          <Link to="/office/certifications" className="mt-4 inline-flex h-11 items-center text-sm">
            Back to certifications
          </Link>
        </main>
      </div>
    );
  }

  const certSlug = cert.slug;
  const orderedSelected = cert.allCourses
    .map((c) => c.slug)
    .filter((s) => selected.includes(s));

  function toggle(courseSlug: string) {
    setSaved(false);
    setSelected((prev) =>
      prev.includes(courseSlug)
        ? prev.filter((s) => s !== courseSlug)
        : [...prev, courseSlug],
    );
  }

  async function save() {
    setBusy("save");
    setError(null);
    try {
      await upsertCertification({
        data: { slug: certSlug, title, description, published, courseSlugs: orderedSelected },
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function togglePublish() {
    setBusy("pub");
    setError(null);
    try {
      const next = !published;
      await setCertificationPublished({ data: { slug: certSlug, published: next } });
      setPublishedState(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (typeof window !== "undefined" && !window.confirm(`Delete “${title}”?`)) return;
    setBusy("del");
    try {
      await deleteCertification({ data: { slug: certSlug } });
      await navigate({ to: "/office/certifications" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setBusy(null);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          {published ? "Published" : "Draft"} · {orderedSelected.length} courses
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{title || "Certification"}</h1>

        <div className="mt-8 space-y-4">
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Title
            <input
              className="md-field mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaved(false);
              }}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            Description
            <textarea
              className="md-field mt-2 min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSaved(false);
              }}
            />
          </label>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Courses in this certification
          </p>
          <p className="mt-1 text-xs text-muted">
            Students earn the certificate once they certify in all selected courses.
          </p>
          <div className="mt-3 grid gap-2">
            {cert.allCourses.length === 0 ? (
              <p className="text-sm text-muted">No courses yet — create some first.</p>
            ) : (
              cert.allCourses.map((c) => (
                <label
                  key={c.slug}
                  className="md-interactive flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(c.slug)}
                    onChange={() => toggle(c.slug)}
                  />
                  <span className="flex-1">{c.title}</span>
                  <span className="text-xs text-muted">
                    {c.published ? "Published" : "Draft"}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-warn">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={busy !== null} onClick={() => void save()}>
            {saved && !busy ? "Saved" : "Save certification"}
          </Button>
          <Button variant="secondary" disabled={busy !== null} onClick={() => void togglePublish()}>
            {published ? "Unpublish" : "Publish"}
          </Button>
          <Link
            to="/track/$slug/certificate"
            params={{ slug: cert.slug }}
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Preview certificate
          </Link>
          <Link
            to="/track/$slug"
            params={{ slug: cert.slug }}
            className="md-interactive inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted"
          >
            View track page
          </Link>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void remove()}
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-warn/40 px-4 text-sm text-warn disabled:opacity-50"
          >
            {busy === "del" ? "Deleting…" : "Delete"}
          </button>
        </div>
      </main>
    </div>
  );
}
