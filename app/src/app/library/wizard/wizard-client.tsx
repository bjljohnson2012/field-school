"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, Square, X } from "lucide-react";
import { canTeach } from "@/lib/composer/rules";
import { COLLECTIONS, traitsFromDrop } from "@/lib/evolution/collections";
import { titleFromDrop } from "@/lib/library/teach-from-knowledge";
import { Button } from "@/components/ui/button";
import { DropWell } from "@/components/workspace/drop-well";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Gate = "loading" | "guest" | "child" | "hirer" | "no-org" | "error" | "ready";
type DropKind = "text" | "idea" | "file" | "audio";

type DropItem = {
  id: string;
  kind: DropKind;
  label: string;
  text?: string;
  file?: File;
};

type StoredItem = { lessonId: string; title: string };
type OpenLesson = { id: string; title: string };

const CARD =
  "rounded-3xl border border-border bg-card shadow-[0_16px_36px_-24px_rgba(26,25,22,0.55)]";

export function WizardClient() {
  const router = useRouter();
  const titleId = useId();
  const [gate, setGate] = useState<Gate>("loading");
  const [error, setError] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState("");
  const [orgName, setOrgName] = useState("");
  const [draft, setDraft] = useState("");
  const [pile, setPile] = useState<DropItem[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredItem[]>([]);
  const [open, setOpen] = useState<OpenLesson[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const meRes = await fetch("/api/me");
        const me = await meRes.json();
        if (cancel) return;
        if (!me?.authenticated) {
          setGate("guest");
          return;
        }
        if (me.member?.kind === "child") {
          setGate("child");
          return;
        }
        if (!me.activeOrg?.slug) {
          setGate("no-org");
          return;
        }
        const stance = typeof me.activeOrg.stance === "string" ? me.activeOrg.stance : "";
        if (!canTeach({ kind: me.member?.kind ?? "adult", stance })) {
          setOrgName(me.activeOrg.name ?? me.activeOrg.slug);
          setGate("hirer");
          return;
        }
        setOrgSlug(me.activeOrg.slug);
        setOrgName(me.activeOrg.name || me.activeOrg.slug);
        setGate("ready");
      } catch {
        if (!cancel) {
          setError("Could not load this org.");
          setGate("error");
        }
      }
    }
    void load();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      stopRecording(false);
    };
  }, []);

  useEffect(() => {
    if (gate !== "ready" || !orgSlug) return;
    void loadOpen(orgSlug);
  }, [gate, orgSlug]);

  function stopRecording(keep: boolean) {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") {
      if (!keep) recorder.onstop = null;
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRecording(false);
  }

  function addDrop(item: DropItem) {
    setPile((current) => [...current, item].slice(0, 12));
    setNote(null);
  }

  function addWords(kind: "text" | "idea") {
    const text = draft.trim();
    if (text.length < 3) return;
    addDrop({ id: crypto.randomUUID(), kind, text, label: text.replace(/\s+/g, " ").slice(0, 90) });
    setDraft("");
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    for (const file of Array.from(list)) {
      addDrop({
        id: crypto.randomUUID(),
        kind: file.type.startsWith("audio/") ? "audio" : "file",
        file,
        label: file.name || "Document",
      });
    }
  }

  async function startMic() {
    if (recording) {
      stopRecording(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (!chunks.length) return;
        const type = recorder.mimeType || "audio/webm";
        const file = new File(chunks, "voice.webm", { type });
        addDrop({ id: crypto.randomUUID(), kind: "audio", file, label: "Voice" });
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setSeconds((value) => {
          if (value >= 59) {
            window.setTimeout(() => stopRecording(true), 0);
            return 60;
          }
          return value + 1;
        });
      }, 1000);
    } catch {
      setNote("The microphone did not open.");
    }
  }

  async function loadOpen(slug: string) {
    const res = await fetch("/api/library/candidates", { headers: { "x-fs-org": slug } });
    if (!res.ok) return;
    const json = (await res.json()) as { lessons?: OpenLesson[] };
    setOpen(Array.isArray(json.lessons) ? json.lessons : []);
  }

  async function submit() {
    if (!pile.length || busy || recording) return;
    setBusy(true);
    setNote(null);
    const notes = pile
      .filter((item) => item.text?.trim())
      .map((item) => ({ text: item.text, kind: item.kind, filename: item.label }));
    const files = pile.flatMap((item) => (item.file ? [item.file] : []));
    try {
      const headers: Record<string, string> = { "x-fs-org": orgSlug };
      let res: Response;
      if (files.length) {
        const form = new FormData();
        form.set("items", JSON.stringify(notes));
        for (const file of files) form.append("file", file);
        res = await fetch("/api/library/intake", { method: "POST", headers, body: form });
      } else {
        headers["Content-Type"] = "application/json";
        res = await fetch("/api/library/intake", {
          method: "POST",
          headers,
          body: JSON.stringify({ items: notes }),
        });
      }
      const json = await res.json();
      if (!res.ok) {
        setNote(json.error || "Could not add this knowledge.");
        return;
      }
      if (json.status === "needs_more") {
        setNote(typeof json.message === "string" ? json.message : "needs more information");
        return;
      }
      const items = Array.isArray(json.items) ? (json.items as StoredItem[]) : [];
      setStored(items);
      setPile([]);
      setNote("Added to this org's knowledge. A lesson is not written until you generate one.");
      await loadOpen(orgSlug);
    } catch {
      setNote("Could not add this knowledge.");
    } finally {
      setBusy(false);
    }
  }

  async function generateLesson(lessonId: string) {
    if (generatingId) return;
    setGeneratingId(lessonId);
    setNote(null);
    try {
      const res = await fetch("/api/library/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fs-org": orgSlug },
        body: JSON.stringify({ lesson_id: lessonId }),
      });
      const json = await res.json();
      setNote(typeof json.message === "string" ? json.message : json.error || "Could not generate the lesson.");
      if (json.status === "ready") await loadOpen(orgSlug);
    } catch {
      setNote("Could not generate the lesson.");
    } finally {
      setGeneratingId(null);
    }
  }

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const docTitle = pile.length
    ? titleFromDrop({
        text: pile.find((item) => item.text)?.text ?? "",
        filename: pile.find((item) => item.file)?.file?.name,
      })
    : "Untitled";
  const relations = pile.flatMap((item) =>
    traitsFromDrop({
      text: item.text,
      filename: item.file?.name,
      kind: item.kind,
      orgName,
    }),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(26,25,22,0.46)] p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={cn(CARD, "grid h-[min(44rem,calc(100vh-1.5rem))] w-full max-w-5xl overflow-hidden bg-background lg:grid-cols-[220px_1fr]")}>
        <aside className="overflow-y-auto border-b border-border bg-card px-4 py-5 lg:border-b-0 lg:border-r">
          <p className="text-sm font-medium">{orgName || "This org"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Course</p>
          <ul className="mt-3 space-y-1">
            {["Objective", "Teach", "Do", "Recap", "Quiz"].map((activity) => (
              <li key={activity}>
                <span className="flex items-center rounded-lg px-2 py-1.5 text-sm text-muted-foreground">
                  {activity}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">Collections</p>
          <ul className="mt-2 space-y-1">
            {COLLECTIONS.map((collection) => {
              const count = relations.filter((trait) => trait.collection === collection.slug).length;
              return (
                <li key={collection.slug} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm">
                  <span>{collection.label}</span>
                  <span className="text-xs text-muted-foreground">{count || ""}</span>
                </li>
              );
            })}
          </ul>
        </aside>
        <div className="flex min-h-0 flex-col">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {orgName || "Library"}
            </p>
            <h1 id={titleId} className="mt-2 font-display text-4xl leading-[1.02] tracking-[-0.035em]">
              Drop it in
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border"
            aria-label="Close"
            onClick={() => router.back()}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto px-6 pb-6">
          {gate === "loading" ? <p className="text-sm text-muted-foreground">Opening this org.</p> : null}
          {gate === "guest" ? (
            <p className="text-sm text-muted-foreground">
              Sign in as the person accountable for this org.{" "}
              <Link href="/login" className="underline underline-offset-4">
                Sign in
              </Link>
            </p>
          ) : null}
          {gate === "child" ? (
            <p className="text-sm text-muted-foreground">
              A child in this family does not use this. The person who owns the path does.
            </p>
          ) : null}
          {gate === "hirer" ? (
            <p className="text-sm text-muted-foreground">
              This is for the person accountable for people in {orgName || "this org"}.
            </p>
          ) : null}
          {gate === "no-org" ? <p className="text-sm text-muted-foreground">No org is selected.</p> : null}
          {gate === "error" ? <p className="text-sm text-muted-foreground">{error}</p> : null}

          {gate === "ready" ? (
            <>
              <p className="font-display text-4xl leading-[1.02] tracking-[-0.035em]">{docTitle}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The name comes from what you drop. Insert a block, then submit. That adds knowledge
                and relates it to the family, the profile, a milestone, and any media. Generate Lesson
                comes after.
              </p>

              <DropWell
                className="mt-6"
                label="Drop a file, or click to choose one"
                hint="PDF, text, or a minute of audio."
                accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,audio/*"
                multiple
                inputRef={fileRef}
                onFiles={addFiles}
              >
                {pile.length ? (
                  <ul className="grid gap-3">
                    {pile.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-border bg-card px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.kind}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{item.text || item.label}</p>
                        <button
                          type="button"
                          className="mt-3 text-sm underline underline-offset-4"
                          onClick={() => setPile((current) => current.filter((row) => row.id !== item.id))}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    This document is empty. Insert text, an idea, a file, or a minute of audio.
                  </p>
                )}
              </DropWell>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Insert</span>
                <Button className="h-11" type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  File
                </Button>
                <Button className="h-11" type="button" variant="outline" onClick={() => addWords("text")}>
                  Text
                </Button>
                <Button className="h-11" type="button" variant="outline" onClick={() => addWords("idea")}>
                  Idea
                </Button>
                <Button
                  className="h-11"
                  type="button"
                  variant={recording ? "default" : "outline"}
                  onClick={() => void startMic()}
                >
                  {recording ? <Square /> : <Mic />}
                  {recording ? `Stop ${clock}` : "Talk"}
                </Button>
              </div>
              <label className="mt-3 grid gap-2 text-sm">
                Block
                <Textarea
                  className="min-h-24 rounded-2xl"
                  value={draft}
                  placeholder="Write the block, then insert it as text or an idea."
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              {recording ? (
                <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                  Listening. It stops at one minute.
                </p>
              ) : null}

              <div className="mt-5">
                <Button
                  className="h-11 shadow-[0_12px_28px_-16px_rgba(31,94,255,0.9)]"
                  type="button"
                  disabled={!pile.length || busy || recording}
                  onClick={() => void submit()}
                >
                  Submit
                </Button>
              </div>

              <section className="mt-8">
                <h2 className="font-display text-2xl tracking-tight">Not generated yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Knowledge with no lesson. A generated lesson is Objective, Teach, Do, Recap, then a quiz
                  from what is already stored. If that is not enough, it says needs more information.
                </p>
                <ul className="mt-4 grid gap-3">
                  {[...stored.map((item) => ({ id: item.lessonId, title: item.title })), ...open]
                    .filter((item, index, all) => all.findIndex((row) => row.id === item.id) === index)
                    .map((item) => (
                      <li key={item.id} className="rounded-2xl border border-border bg-card px-4 py-4">
                        <p className="font-medium">{item.title}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <Button
                            className="h-11"
                            type="button"
                            variant="outline"
                            disabled={generatingId === item.id}
                            onClick={() => void generateLesson(item.id)}
                          >
                            Generate Lesson
                          </Button>
                          <Link href={`/o/${orgSlug}/teach/${item.id}`} className="text-sm underline underline-offset-4">
                            Open
                          </Link>
                        </div>
                      </li>
                    ))}
                </ul>
                {!stored.length && !open.length ? (
                  <p className="mt-3 text-sm text-muted-foreground">Nothing is waiting.</p>
                ) : null}
              </section>
            </>
          ) : null}

          {note ? (
            <p className="mt-4 text-sm" aria-live="polite">
              {note}
            </p>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}
