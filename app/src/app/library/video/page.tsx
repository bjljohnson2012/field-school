"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { LessonSpec } from "./lesson-spec";
import { ReviewRail } from "./review-rail";

type Me = {
  authenticated?: boolean;
  guest?: boolean;
  member?: { kind?: string };
  activeOrg?: { slug?: string; name?: string; stance?: string } | null;
};

const LEADER_STANCES = ["admin", "guardian", "trainer", "teacher"];

const ERRORS: Record<string, string> = {
  sign_in_required: "Sign in as the leader of this org.",
  pointer_required: "Point at a Cap take or an mp4.",
  pointer_unrecognized: "Use a Cap take id, a cap.fieldschool.ai link, or an mp4 name.",
  just_locked: "That Cap take is locked. It was not opened.",
  dest_locked: "That file is locked. It was not opened.",
  household_org: "This door is for a leader on a team org.",
  outcome_required: "Name what they should be able to do after.",
  too_many_chapters: "Keep chapter titles to forty lines.",
  child_cannot_draft: "A tracked child does not draft units.",
  leader_only: "A leader drafts units for this org.",
  forbidden_org: "That org is not yours.",
  invalid_json: "Could not read that draft.",
  database_unavailable: "The org list is not available yet.",
  no_membership: "No org membership on this account.",
};

function message(error: string) {
  return ERRORS[error] ?? "Could not draft units.";
}

export default function VideoInPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [source, setSource] = useState<"cap" | "mp4">("cap");
  const [pointer, setPointer] = useState("");
  const [title, setTitle] = useState("");
  const [outcome, setOutcome] = useState("");
  const [chapters, setChapters] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [spec, setSpec] = useState<LessonSpec | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/me")
      .then(async (res) => {
        const data = (await res.json()) as Me & { error?: string };
        if (!res.ok) {
          setLoadError(data.error || "sign_in_required");
          return;
        }
        setMe(data);
      })
      .catch(() => setLoadError("database_unavailable"));
  }, []);

  async function draft(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote(null);
    const res = await fetch("/library/video/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pointer,
        title,
        outcome,
        chapters,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; spec?: LessonSpec };
    setBusy(false);
    if (!res.ok || !data.spec) {
      setSpec(null);
      setNote(message(data.error || "invalid_json"));
      return;
    }
    setSpec(data.spec);
    setNote("Draft units are ready. They are not published.");
  }

  if (!me && !loadError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading this org.</p>
      </main>
    );
  }

  if (loadError || !me?.authenticated || me.guest) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Sign in</h1>
        <p className="mt-3 text-muted-foreground">Video in is for a signed-in leader.</p>
        <p className="mt-6 text-sm">
          <Link href="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  if (me.member?.kind === "child") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Leaders only</h1>
        <p className="mt-3 text-muted-foreground">
          A tracked child is not the buyer and does not draft units.
        </p>
      </main>
    );
  }

  const org = me.activeOrg?.slug ?? "";
  const stance = me.activeOrg?.stance ?? "";
  if (!org) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Choose an org</h1>
        <p className="mt-3 text-muted-foreground">Choose your team org, then open this door again.</p>
      </main>
    );
  }

  if (org === "household") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Team org</h1>
        <p className="mt-3 text-muted-foreground">This door is for a leader on a team org.</p>
      </main>
    );
  }

  if (!LEADER_STANCES.includes(stance)) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Leaders only</h1>
        <p className="mt-3 text-muted-foreground">A leader drafts units for this org.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Library · Team</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Video in</h1>
      <p className="mt-4 text-muted-foreground">
        When I am accountable for people&apos;s development and for the organization&apos;s success,
        and I cannot sit with them every hour, I invest in Field School so each person keeps moving
        on a path fit to who they are now, they get better, the organization gets better, and the
        learning actually takes.
      </p>
      <p className="mt-4 text-muted-foreground">
        Point at a Cap take or an mp4 for {me.activeOrg?.name || org}. Draft units stay on this
        spec so the next portion can run when you leave the room. Teammates are not the buyer.
      </p>

      <form className="mt-10 rounded-xl border border-border bg-card px-5 py-5" onSubmit={draft}>
        <h2 className="font-display text-2xl">Point</h2>
        <fieldset className="mt-4 grid gap-2">
          <legend className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Source</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="source"
              checked={source === "cap"}
              onChange={() => {
                setSource("cap");
                setPointer("");
              }}
            />
            Cap take
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="source"
              checked={source === "mp4"}
              onChange={() => {
                setSource("mp4");
                setPointer("");
              }}
            />
            mp4
          </label>
        </fieldset>

        {source === "cap" ? (
          <label className="mt-4 grid gap-2 text-sm">
            Cap take
            <input
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="Take id or https://cap.fieldschool.ai/s/..."
              value={pointer}
              onChange={(event) => setPointer(event.target.value)}
            />
          </label>
        ) : (
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm">
              mp4 file
              <input
                className="text-sm"
                type="file"
                accept=".mp4,video/mp4"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setPointer(file.name);
                }}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Or an mp4 link or file name
              <input
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                placeholder="discovery-call.mp4"
                value={pointer}
                onChange={(event) => setPointer(event.target.value)}
              />
            </label>
          </div>
        )}

        <label className="mt-4 grid gap-2 text-sm">
          Title
          <input
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
            placeholder="Optional"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="mt-4 grid gap-2 text-sm">
          What they should be able to do after
          <textarea
            className="min-h-24 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
          />
        </label>
        <label className="mt-4 grid gap-2 text-sm">
          Chapter titles, one per line
          <textarea
            className="min-h-24 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder={"00:00 Open\n01:12 The next step"}
            value={chapters}
            onChange={(event) => setChapters(event.target.value)}
          />
        </label>
        <button
          className="mt-5 h-11 rounded-xl bg-primary px-4 text-sm text-primary-foreground disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          {busy ? "Drafting" : "Draft units"}
        </button>
        {note ? <p className="mt-4 text-sm">{note}</p> : null}
      </form>

      {spec ? <ReviewRail spec={spec} onChange={setSpec} /> : null}
    </main>
  );
}
