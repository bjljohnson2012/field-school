"use client";

import { useState } from "react";

const ERRORS: Record<string, string> = {
  photo_too_large: "That image is over 5 MB.",
  photo_type_unsupported: "Use a JPEG, PNG, or WebP image.",
  photo_unreadable: "That file could not be read as an image.",
  photo_dimensions: "That image is larger than 8192 pixels on a side.",
  photo_url_invalid: "Use an https:// link to an image.",
  photo_url_blocked: "That link points somewhere Field School will not fetch from.",
  photo_fetch_failed: "Could not download an image from that link.",
  photo_missing: "Choose a file or paste a link.",
};

/** Upload or paste a link. Either way the image is copied to campus storage and shown from there. */
export function PhotoPanel({ photoSrc, onChange }: { photoSrc: string; onChange: (src: string) => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function send(init: RequestInit) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/profile/photo", init);
      const data = (await res.json()) as { photoSrc?: string; error?: string };
      if (!res.ok || data.photoSrc === undefined) {
        setStatus(ERRORS[data.error ?? ""] ?? "Could not save that photo.");
        return;
      }
      onChange(data.photoSrc);
      setUrl("");
      setStatus(data.photoSrc ? "Photo saved." : "Photo removed.");
    } catch {
      setStatus("Could not reach the portal.");
    } finally {
      setBusy(false);
    }
  }

  function upload(file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    void send({ method: "POST", body: form });
  }

  return (
    <section className="rounded-xl border border-border bg-card px-5 py-5" data-photo-panel>
      <h2 className="text-sm font-semibold">Photo (optional)</h2>
      <div className="mt-3 flex flex-wrap items-start gap-4">
        {photoSrc ? (
          <img src={photoSrc} alt="Your profile photo" className="size-20 shrink-0 rounded-full border border-border object-cover" />
        ) : (
          <div className="size-20 shrink-0 rounded-full border border-dashed border-border" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label className="label" htmlFor="photo-file">
              Upload a photo
            </label>
            <input
              id="photo-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              className="text-sm"
              onChange={(event) => upload(event.target.files?.[0])}
            />
          </div>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
            }}
          >
            <div className="min-w-0 flex-1">
              <label className="label" htmlFor="photo-url">
                Or paste a link to a photo
              </label>
              <input
                id="photo-url"
                className="input"
                type="url"
                placeholder="https://"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={busy || !url.trim()}>
              Use this link
            </button>
          </form>
          <p className="text-xs text-muted-foreground">
            We keep a copy on Field School and strip location and camera details. The link is only noted as the source.
          </p>
          <div className="flex items-center gap-3">
            {photoSrc ? (
              <button type="button" className="text-sm underline underline-offset-4" disabled={busy} onClick={() => void send({ method: "DELETE" })}>
                Remove photo
              </button>
            ) : null}
            {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
