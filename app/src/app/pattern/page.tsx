"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { key: string; prompt: string; correspondence: string };
type Profile = {
  bearing: {
    primary: string | null;
    secondary: string | null;
    dims: Record<string, number>;
  };
  narratives: Record<string, string>;
  locked: boolean;
  lastRunAt: string | null;
};

const SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

function PatternForm() {
  const { data: session, status } = useSession();
  const search = useSearchParams();
  const childMembershipId = search.get("child")?.trim() || "";
  const forChild = Boolean(childMembershipId);
  const signedIn = Boolean(session?.user?.email);
  const [subset, setSubset] = useState<"adult" | "child">(forChild ? "child" : "adult");
  const [items, setItems] = useState<Item[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chooser, setChooser] = useState<{ href?: string; title?: string; reason?: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paper, setPaper] = useState("");
  const [org, setOrg] = useState("");
  const [importCode, setImportCode] = useState("");
  const householdHeaders: Record<string, string> = forChild
    ? { "x-fs-org": "household" }
    : {};

  useEffect(() => {
    void fetch(`/api/pattern/instrument?subset=${subset}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setAnswers({});
      });
  }, [subset]);

  useEffect(() => {
    if (forChild) {
      setOrg("household");
      setSubset("child");
    }
    if (!signedIn) return;
    if (!forChild) {
      void fetch("/api/me").then((r) => r.json()).then((data) => setOrg(data.activeOrg?.slug || ""));
    }
    void refresh();
  }, [signedIn, childMembershipId]);

  async function refresh() {
    const profileUrl = childMembershipId
      ? `/api/pattern/profile?membership_id=${encodeURIComponent(childMembershipId)}`
      : "/api/pattern/profile";
    const profileRes = fetch(profileUrl, { headers: householdHeaders }).then((r) => r.json());
    if (forChild) {
      const p = await profileRes;
      if (p.ok) setProfile(p.profile);
      else setProfile(null);
      setChooser(null);
      return;
    }
    const [p, c] = await Promise.all([
      profileRes,
      fetch("/api/chooser?course=grok-bot").then((r) => r.json()),
    ]);
    if (p.ok) setProfile(p.profile);
    if (c.ok) setChooser(c.next ? { href: c.next.href, title: c.next.title, reason: c.reason } : { reason: c.reason });
  }

  async function submitRun() {
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/pattern/run", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...householdHeaders },
      body: JSON.stringify({
        subset,
        answers,
        ...(childMembershipId ? { membership_id: childMembershipId } : {}),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(data.error === "profile_locked" ? "This profile is locked by a parent." : data.error || "Could not save.");
      return;
    }
    setProfile(data.profile);
    setNote("Pattern run saved. Bearing was reset from this instrument.");
    void refresh();
  }

  async function submitPaper() {
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/pattern/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...householdHeaders },
      body: JSON.stringify({
        kind: "paper",
        text: paper,
        ...(childMembershipId ? { membership_id: childMembershipId } : {}),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(
        data.error === "profile_locked"
          ? "This profile is locked by a parent."
          : data.error === "profile_required"
            ? "Take Field Pattern first. STT only nudges an existing profile."
            : data.error || "Could not ingest.",
      );
      return;
    }
    setProfile(data.profile);
    setPaper("");
    setNote("Artifact ingested. Bearing nudged a small step. Skills updated if a rubric matched.");
    void refresh();
  }

  async function submitFile(kind: "verbal" | "video", file: File) {
    setBusy(true);
    setNote(null);
    const form = new FormData();
    form.set("kind", kind);
    form.set("file", file);
    if (childMembershipId) form.set("membership_id", childMembershipId);
    const res = await fetch("/api/pattern/ingest", { method: "POST", headers: householdHeaders, body: form });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(
        data.error === "stt_failed"
          ? "Grok STT could not transcribe that file."
          : data.error === "profile_required"
            ? "Take Field Pattern first. STT only nudges an existing profile."
            : data.error || "Upload failed.",
      );
      return;
    }
    setProfile(data.profile);
    setNote("Transcript stored. Bearing nudged a small step.");
    void refresh();
  }

  const allAnswered = items.length > 0 && items.every((item) => answers[item.key] != null);

  if (org === "sales" && !forChild) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">Field Pattern</h1>
        <p className="mt-4 text-muted-foreground">
          Pattern lives on the person. It does not appear on the sales board.
          Switch to household to take or view it.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Field Pattern · fp-50-v1
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Field Pattern</h1>
      <p className="mt-4 text-muted-foreground">
        Fifty Likert items, or the child subset from the pinned fp-50-v1
        table. A Pattern run resets Bearing. Papers, voice, and video
        transcribe with Grok STT and only nudge. The chooser reads this
        profile. It does not rewrite the pack.
      </p>
      {forChild ? (
        <p className="mt-3 text-sm">
          Recording the child subset for a household child. Kids have no own
          login.{" "}
          <Link href="/children" className="underline underline-offset-4">
            Back to children
          </Link>
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            "h-11 rounded-xl border px-4 text-sm",
            subset === "adult" ? "border-primary bg-secondary" : "border-border",
          )}
          onClick={() => setSubset("adult")}
        >
          50-item adult
        </button>
        <button
          type="button"
          className={cn(
            "h-11 rounded-xl border px-4 text-sm",
            subset === "child" ? "border-primary bg-secondary" : "border-border",
          )}
          onClick={() => setSubset("child")}
        >
          Child subset
        </button>
      </div>

      {status === "unauthenticated" ? (
        <p className="mt-6 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Sign in to store the profile in Postgres.{" "}
          <Link href="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      ) : null}

      {profile ? (
        <section className="mt-8 rounded-xl border border-border bg-card px-5 py-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Live profile {profile.locked ? "· locked" : ""}
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight">
            {profile.narratives.working_title || `${profile.bearing.primary} / ${profile.bearing.secondary}`}
          </p>
          <ul className="mt-4 grid gap-2 text-sm">
            {Object.entries(profile.bearing.dims || {}).map(([key, value]) => (
              <li key={key} className="flex justify-between">
                <span className="capitalize">{key}</span>
                <span className="tabular-nums">{Math.round(Number(value))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-3 text-sm text-muted-foreground">
            {Object.entries(profile.narratives)
              .filter(([key]) => key !== "working_title")
              .map(([key, text]) => (
              <p key={key}>
                <span className="font-medium text-foreground">{key.replaceAll("_", " ")}. </span>
                {text}
              </p>
            ))}
          </div>
          {chooser?.href ? (
            <p className="mt-5 text-sm">
              Chooser next:{" "}
              <Link href={chooser.href} className="underline underline-offset-4">
                {chooser.title}
              </Link>
              <span className="text-muted-foreground"> · pack unchanged</span>
            </p>
          ) : null}
        </section>
      ) : null}

      <ol className="mt-10 space-y-4">
        {items.map((item, i) => (
          <li key={item.key} className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-sm font-medium">
              <span className="mr-2 text-muted-foreground">{i + 1}.</span>
              {item.prompt}
            </p>
            <div className="mt-3 grid gap-1 sm:grid-cols-5">
              {SCALE.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-xs",
                    answers[item.key] === opt.value
                      ? "border-primary bg-secondary"
                      : "border-border hover:bg-secondary/50",
                  )}
                >
                  <input
                    type="radio"
                    name={item.key}
                    className="sr-only"
                    checked={answers[item.key] === opt.value}
                    onChange={() => setAnswers((cur) => ({ ...cur, [item.key]: opt.value }))}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <Button
        className="mt-6 h-11 w-full rounded-xl sm:w-auto"
        disabled={!signedIn || !allAnswered || busy}
        onClick={() => void submitRun()}
      >
        Save Pattern run (resets Bearing)
      </Button>

      <section className="mt-12 space-y-4 rounded-xl border border-border bg-card px-5 py-5">
        <h2 className="font-display text-2xl tracking-tight">Nudge from work</h2>
        <p className="text-sm text-muted-foreground">
          Paste writing, or upload voice/video. Grok STT transcribes. Bearing
          moves a small step. A new Pattern run still resets it.
        </p>
        <textarea
          className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={paper}
          onChange={(e) => setPaper(e.target.value)}
          placeholder="Paste a paper, journal, or field note."
        />
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!signedIn || !paper.trim() || busy}
            onClick={() => void submitPaper()}
          >
            Ingest paper
          </Button>
          <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-border px-4 text-sm">
            Voice / video
            <input
              type="file"
              accept="audio/*,video/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void submitFile(file.type.startsWith("video") ? "video" : "verbal", file);
              }}
            />
          </label>
        </div>
      </section>

      {forChild ? null : <section className="mt-12 space-y-3 rounded-xl border border-border bg-card px-5 py-5">
        <h2 className="font-display text-2xl tracking-tight">Import an official result</h2>
        <p className="text-sm text-muted-foreground">
          Paste a type-code or cluster list from an official report you already
          hold. This overrides correspondence estimates only. It does not
          change Bearing. We do not sell or name that other product here.
        </p>
        <textarea
          className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={importCode}
          onChange={(e) => setImportCode(e.target.value)}
          placeholder="Type-code or pasted summary"
        />
        <Button
          disabled={!signedIn || !importCode.trim() || busy}
          onClick={() => {
            void fetch("/api/pattern/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type_code: importCode.trim() }),
            }).then(async (res) => {
              const data = await res.json();
              if (!res.ok) setNote(data.error);
              else {
                setNote("Correspondence overridden by import. Bearing unchanged.");
                void refresh();
              }
            });
          }}
        >
          Override correspondence
        </Button>
      </section>}

      {note ? <p className="mt-6 text-sm text-pass">{note}</p> : null}
    </main>
  );
}

export default function PatternPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-sm text-muted-foreground">Loading Field Pattern…</p>
        </main>
      }
    >
      <PatternForm />
    </Suspense>
  );
}
