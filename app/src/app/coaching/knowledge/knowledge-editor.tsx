"use client";

import { useState } from "react";
import { REPO_KINDS, STORED_VISIBILITY } from "../../api/coaching/knowledge/visibility";

export type KnowledgeRepo = {
  id: string;
  repoKind: string;
  name: string;
  visibility: string;
};

export type KnowledgeUnit = {
  id: string;
  repositoryId: string;
  title: string;
  body: string;
  tags: string[];
  status: string;
  visibility: string;
};

async function send(path: string, body?: unknown, method = "POST") {
  const response = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    repo?: KnowledgeRepo;
    unit?: KnowledgeUnit;
    article?: { title?: string; body?: string; tags?: string[] };
  };
  if (!response.ok || data.ok === false) throw new Error(data.error || "request_failed");
  return data;
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function KnowledgeEditor({
  initialRepos,
  initialUnits,
}: {
  initialRepos: KnowledgeRepo[];
  initialUnits: KnowledgeUnit[];
}) {
  const [repos, setRepos] = useState(initialRepos);
  const [units, setUnits] = useState(initialUnits);
  const [repoKind, setRepoKind] = useState<(typeof REPO_KINDS)[number]>("PRODUCT");
  const [repoName, setRepoName] = useState("");
  const [repositoryId, setRepositoryId] = useState(initialRepos[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("both");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [message, setMessage] = useState("");

  const selected = repos.find((repo) => repo.id === repositoryId) ?? null;

  function applyArticle(article: { title?: string; body?: string; tags?: string[] }) {
    if (article.title) setTitle(article.title);
    if (article.body) setBody(article.body);
    if (article.tags) setTags(article.tags.join(", "));
  }

  async function addRepo() {
    setMessage("");
    try {
      const data = await send("/api/coaching/knowledge", {
        type: "repo",
        repoKind,
        name: repoName,
        visibility: repoKind === "PERSONALITY" || repoKind === "LEADERSHIP" ? "coach" : visibility,
      });
      if (data.repo) {
        setRepos((rows) => [data.repo as KnowledgeRepo, ...rows]);
        setRepositoryId(data.repo.id);
        setRepoName("");
      }
      setMessage("Repository saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function saveArticle() {
    setMessage("");
    try {
      const data = await send("/api/coaching/knowledge", {
        type: "article",
        repositoryId,
        title,
        body,
        tags: splitTags(tags),
        visibility,
        status: "pending",
      });
      if (data.unit) setUnits((rows) => [data.unit as KnowledgeUnit, ...rows]);
      setMessage("Article saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function setStatus(id: string, status: "approved" | "rejected") {
    setMessage("");
    try {
      const data = await send(`/api/coaching/knowledge/units/${id}`, { status }, "PATCH");
      if (data.unit) {
        setUnits((rows) => rows.map((row) => (row.id === id ? (data.unit as KnowledgeUnit) : row)));
      }
      setMessage(status === "approved" ? "Approved" : "Rejected");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function draftFromUrl() {
    setMessage("");
    try {
      const data = await send("/api/coaching/knowledge/from-url", {
        url,
        repositoryKind: selected?.repoKind ?? repoKind,
        repositoryName: selected?.name ?? repoName,
      });
      if (data.article) applyArticle(data.article);
      setMessage("Draft ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function extract() {
    setMessage("");
    try {
      const data = await send("/api/coaching/knowledge/extract", {
        rawText,
        repositoryKind: selected?.repoKind ?? repoKind,
        repositoryName: selected?.name ?? repoName,
      });
      if (data.article) applyArticle(data.article);
      setMessage("Extract ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function cleanup() {
    setMessage("");
    try {
      const data = await send("/api/coaching/knowledge/cleanup", {
        title,
        body,
        tags: splitTags(tags),
        instructions,
        repositoryName: selected?.name ?? repoName,
      });
      if (data.article) applyArticle(data.article);
      setMessage("Cleanup ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
      <section className="card p-4">
        <h2 className="text-sm font-semibold">Repositories</h2>
        {repos.length ? (
          <ul className="mt-3 space-y-2">
            {repos.map((repo) => (
              <li key={repo.id}>
                <button
                  type="button"
                  className={repositoryId === repo.id ? "btn-primary" : "text-sm font-semibold"}
                  onClick={() => setRepositoryId(repo.id)}
                >
                  {repo.name}
                </button>
                <p className="text-xs text-muted-foreground">
                  {repo.repoKind} · {repo.visibility}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm">No repositories yet.</p>
        )}
        <label className="mt-4 block text-sm font-semibold">
          Kind
          <select className="input mt-1" value={repoKind} onChange={(event) => setRepoKind(event.target.value as (typeof REPO_KINDS)[number])}>
            {REPO_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Name
          <input className="input mt-1" value={repoName} onChange={(event) => setRepoName(event.target.value)} />
        </label>
        <button type="button" className="btn-primary mt-3" onClick={() => void addRepo()}>
          Add repository
        </button>
      </section>
      <section className="card p-4">
        <h2 className="text-sm font-semibold">Article editor</h2>
        <label className="mt-3 block text-sm font-semibold">
          Title
          <input className="input mt-1" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Body
          <textarea className="input mt-1 min-h-32" value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Tags
          <input className="input mt-1" value={tags} onChange={(event) => setTags(event.target.value)} />
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
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => void saveArticle()}>
            Save article
          </button>
        </div>
        <label className="mt-4 block text-sm font-semibold">
          URL
          <input className="input mt-1" value={url} onChange={(event) => setUrl(event.target.value)} />
        </label>
        <button type="button" className="btn-primary mt-2" onClick={() => void draftFromUrl()}>
          Draft from URL
        </button>
        <label className="mt-4 block text-sm font-semibold">
          Raw text
          <textarea className="input mt-1 min-h-20" value={rawText} onChange={(event) => setRawText(event.target.value)} />
        </label>
        <button type="button" className="btn-primary mt-2" onClick={() => void extract()}>
          Extract
        </button>
        <label className="mt-4 block text-sm font-semibold">
          Cleanup instructions
          <input className="input mt-1" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
        </label>
        <button type="button" className="btn-primary mt-2" onClick={() => void cleanup()}>
          Clean up
        </button>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
        <ul className="mt-6 space-y-3">
          {units.filter((unit) => !repositoryId || unit.repositoryId === repositoryId).map((unit) => (
            <li key={unit.id} className="card p-3">
              <p className="font-semibold">{unit.title}</p>
              <p className="text-xs text-muted-foreground">
                {unit.status} · {unit.visibility}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-primary" onClick={() => void setStatus(unit.id, "approved")}>
                  Approve
                </button>
                <button type="button" className="btn-primary" onClick={() => void setStatus(unit.id, "rejected")}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
