import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getSiteSettings, saveSiteSettings } from "@/lib/course/certifications";

export const Route = createFileRoute("/office/settings")({
  component: SettingsPage,
});

const SIGNATURE_FONT =
  '"Segoe Script", "Bradley Hand", "Snell Roundhand", cursive';

function SettingsPage() {
  const { user, isPending } = useCurrentUserState();
  const [founderName, setFounderName] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "denied">("loading");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPending || !user) return;
    getSiteSettings()
      .then((s) => {
        setFounderName(s.founderName);
        setSignatureText(s.signatureText);
        setSignatureImage(s.signatureImage);
        setState("ready");
      })
      .catch(() => setState("denied"));
  }, [user, isPending]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await saveSiteSettings({ data: { founderName, signatureText, signatureImage } });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function onPickImage(file: File | undefined) {
    if (!file) return;
    if (file.size > 400_000) {
      setError("Signature image is too large — use one under 400 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureImage(typeof reader.result === "string" ? reader.result : "");
      setSaved(false);
    };
    reader.readAsDataURL(file);
  }

  if (isPending || state === "loading") {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">Loading settings…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Admin</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Profile settings</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Your founder name and signature appear on the certificates students earn.
          You can add a signature image now or later — until then, a signature is
          drawn from your name.
        </p>
        <div className="mt-6">
          <Link
            to="/office"
            className="md-interactive inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            Back to catalog
          </Link>
        </div>

        {state === "denied" ? (
          <p className="mt-8 text-sm text-muted">This page is for the dean account.</p>
        ) : (
          <div className="mt-8 space-y-5">
            <label className="block text-xs uppercase tracking-[0.16em] text-muted">
              Founder name
              <input
                className="md-field mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
                value={founderName}
                placeholder="Ben Johnson"
                onChange={(e) => {
                  setFounderName(e.target.value);
                  setSaved(false);
                }}
              />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-muted">
              Typed signature (used when no image is set)
              <input
                className="md-field mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
                value={signatureText}
                placeholder="Ben Johnson"
                onChange={(e) => {
                  setSignatureText(e.target.value);
                  setSaved(false);
                }}
              />
            </label>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Signature image (optional — add later)
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickImage(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="md-interactive inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm"
                >
                  Upload image
                </button>
                {signatureImage ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureImage("");
                      setSaved(false);
                    }}
                    className="md-interactive inline-flex h-10 items-center rounded-lg px-3 text-sm text-warn"
                  >
                    Remove image
                  </button>
                ) : null}
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">Preview</p>
              <div className="mt-2 flex h-16 items-end border-b border-border pb-1">
                {signatureImage ? (
                  <img
                    src={signatureImage}
                    alt="Signature preview"
                    className="max-h-14 max-w-[16rem] object-contain"
                  />
                ) : (
                  <span className="text-3xl leading-none" style={{ fontFamily: SIGNATURE_FONT }}>
                    {signatureText || founderName || "Your signature"}
                  </span>
                )}
              </div>
            </div>

            {error ? <p className="text-sm text-warn">{error}</p> : null}
            <Button disabled={busy} onClick={() => void save()}>
              {saved && !busy ? "Saved" : "Save settings"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
