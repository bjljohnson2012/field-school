"use client";

import { useState } from "react";
import { STORED_VISIBILITY } from "../../api/coaching/knowledge/visibility";

const FILE_KINDS = [
  "AE_PREP_DOC",
  "COACHING_DOC",
  "PROFILE_ASSET",
  "PRODUCT_REFERENCE",
  "PERSONALITY_NOTE",
  "GENERAL",
  "OTHER",
] as const;

const FILE_INTENTS = ["ADD_TO_COACHING_LOG", "UPDATE_PROFILE", "REFERENCE_ONLY"] as const;

export type FileRow = {
  id: string;
  title: string;
  kind: string;
  visibility: string;
  subjectMembershipId: string;
  mapping: {
    intent: string;
    aiSuggestedKind: string | null;
    aiSuggestedIntent: string | null;
    aiRationale: string | null;
  } | null;
};

type Suggestion = {
  kind: string;
  intent: string;
  visibility: string;
  confidence: number;
  rationale: string;
  aeProfileId: string | null;
};

async function send(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    suggestion?: Suggestion;
    file?: FileRow;
  };
  if (!response.ok || data.ok === false) throw new Error(data.error || "request_failed");
  return data;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function FilesPanel({ initial, subject }: { initial: FileRow[]; subject: string }) {
  const [rows, setRows] = useState(initial);
  const [filename, setFilename] = useState("");
  const [mime, setMime] = useState("text/plain");
  const [text, setText] = useState("");
  const [contentBase64, setContentBase64] = useState("");
  const [kind, setKind] = useState<string>(FILE_KINDS[0]);
  const [intent, setIntent] = useState<string>(FILE_INTENTS[2]);
  const [visibility, setVisibility] = useState("coach");
  const [subjectMembershipId, setSubjectMembershipId] = useState(subject);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [message, setMessage] = useState("");

  async function onFile(file: File | null) {
    if (!file) return;
    setFilename(file.name);
    setMime(file.type || "application/octet-stream");
    const buffer = new Uint8Array(await file.arrayBuffer());
    setContentBase64(bytesToBase64(buffer));
    const preview = file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")
      ? await file.text()
      : "";
    setText(preview.slice(0, 4000));
    setSuggestion(null);
  }

  async function classify() {
    setMessage("");
    try {
      const data = await send("/api/coaching/files/classify", {
        filename,
        mimeType: mime,
        textPreview: text,
        candidateAes: [],
      });
      if (!data.suggestion) return;
      setSuggestion(data.suggestion);
      setKind(data.suggestion.kind);
      setIntent(data.suggestion.intent);
      if (data.suggestion.aeProfileId) setSubjectMembershipId(data.suggestion.aeProfileId);
      const mapped =
        data.suggestion.visibility === "AE_ONLY"
          ? "learner"
          : data.suggestion.visibility === "DIRECTOR_ONLY"
            ? "coach"
            : data.suggestion.visibility === "BOTH"
              ? "both"
              : data.suggestion.visibility;
      if (mapped === "learner" || mapped === "coach" || mapped === "both") setVisibility(mapped);
      setMessage("Suggestion ready. Confirm before storing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function store() {
    setMessage("");
    if (!suggestion) {
      setMessage("confirm_required");
      return;
    }
    try {
      const data = await send("/api/coaching/files", {
        filename,
        mime,
        text,
        contentBase64,
        kind,
        intent,
        visibility,
        subjectMembershipId,
        suggestion: {
          kind: suggestion.kind,
          intent: suggestion.intent,
          confidence: suggestion.confidence,
          rationale: suggestion.rationale,
        },
      });
      if (data.file) setRows((current) => [data.file as FileRow, ...current]);
      setMessage("File stored");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="card p-4">
        <h2 className="text-sm font-semibold">Upload</h2>
        <input className="input mt-3" type="file" onChange={(event) => void onFile(event.target.files?.[0] ?? null)} />
        <label className="mt-3 block text-sm font-semibold">
          Filename
          <input className="input mt-1" value={filename} onChange={(event) => setFilename(event.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Preview
          <textarea className="input mt-1 min-h-20" value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="button" className="btn-primary mt-3" onClick={() => void classify()}>
          Classify
        </button>
        {suggestion ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Suggested {suggestion.kind} · {suggestion.intent} · {suggestion.rationale}
          </p>
        ) : null}
        <label className="mt-3 block text-sm font-semibold">
          Kind
          <select className="input mt-1" value={kind} onChange={(event) => setKind(event.target.value)}>
            {FILE_KINDS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Subject
          <input
            className="input mt-1"
            value={subjectMembershipId}
            onChange={(event) => setSubjectMembershipId(event.target.value)}
          />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Intent
          <select className="input mt-1" value={intent} onChange={(event) => setIntent(event.target.value)}>
            {FILE_INTENTS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Visibility
          <select className="input mt-1" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            {STORED_VISIBILITY.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-primary mt-3" onClick={() => void store()}>
          Confirm and store
        </button>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </section>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="card p-4">
              <p className="font-semibold">{row.title}</p>
              <p className="text-xs text-muted-foreground">
                {row.kind} · {row.mapping?.intent} · {row.visibility}
                {row.subjectMembershipId ? ` · ${row.subjectMembershipId}` : ""}
              </p>
              {row.mapping?.aiRationale ? <p className="mt-2 text-sm">{row.mapping.aiRationale}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <section className="card p-6">
          <p>No files yet.</p>
        </section>
      )}
    </div>
  );
}
