import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  listCertificationsAdmin,
  upsertCertification,
} from "@/lib/course/certifications";

export const Route = createFileRoute("/office/certifications/")({
  component: CertificationsPage,
});

type Certs = Awaited<ReturnType<typeof listCertificationsAdmin>>;

function CertificationsPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [certs, setCerts] = useState<Certs | null | "denied">(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isPending || !user) return;
    listCertificationsAdmin()
      .then(setCerts)
      .catch(() => setCerts("denied"));
  }, [user, isPending]);

  async function createNew() {
    setBusy(true);
    try {
      const res = await upsertCertification({
        data: {
          title: "New certification",
          description: "",
          published: false,
          courseSlugs: [],
        },
      });
      await navigate({ to: "/office/certifications/$slug", params: { slug: res.slug } });
    } catch {
      setBusy(false);
    }
  }

  if (isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-4xl px-4 py-16 text-sm text-muted">Loading…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Admin</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Certifications</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          A certification is a compilation of courses. When a student certifies in
          every course in it, they can download a certificate with your signature.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => void createNew()}>
            {busy ? "Creating…" : "New certification"}
          </Button>
          <Link
            to="/office"
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Back to catalog
          </Link>
        </div>

        {certs === null ? (
          <p className="mt-8 text-sm text-muted">Loading…</p>
        ) : certs === "denied" ? (
          <p className="mt-8 text-sm text-muted">This page is for the dean account.</p>
        ) : certs.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No certifications yet.</p>
        ) : (
          <ol className="mt-8 grid gap-3">
            {certs.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/office/certifications/$slug"
                  params={{ slug: c.slug }}
                  className="md-interactive md-card flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-4"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      {c.published ? "Published" : "Draft"} · {c.courseCount} courses
                    </p>
                    <h2 className="mt-1 font-display text-xl">{c.title}</h2>
                  </div>
                  <ArrowRight className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
