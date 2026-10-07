"use client";

import { useEffect, useState } from "react";
import { LINKEDIN_COPY, type ImportCandidate } from "@/lib/enrichment/linkedin";
import { ENRICHMENT_COPY } from "@/lib/enrichment/names";
import type { AcceptResult, EnrichmentView, NameCheck, ReviewItem } from "@/lib/enrichment/store";

type Kind = "skill" | "project";
type Existing = { id: string; name: string };

const KIND_LABEL: Record<string, string> = {
  headline: "Headline",
  experience: "Experience",
  education: "Education",
  certification: "Certification",
  skill: "Skill",
};

function sourceLabel(item: { source: string; importedAt: string | null }) {
  if (item.source === "linkedin" && item.importedAt) {
    return `${ENRICHMENT_COPY.imported} · ${new Date(item.importedAt).toLocaleDateString()}`;
  }
  return "Added by you";
}

function dates(item: { startedOn: string | null; endedOn: string | null }) {
  if (!item.startedOn && !item.endedOn) return "";
  return `${item.startedOn ?? "?"} – ${item.endedOn ?? "now"}`;
}

async function post<T>(url: string, body: unknown): Promise<{ status: number; data: T & { error?: string } }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, data: (await res.json()) as T & { error?: string } };
}

function AddItem({ kind, onSaved }: { kind: Kind; onSaved: (view: EnrichmentView) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [link, setLink] = useState("");
  const [check, setCheck] = useState<NameCheck | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setCheck(null);
      return;
    }
    const timer = setTimeout(() => {
      void post<{ check?: NameCheck }>("/api/profile/enrichment/check", { kind, name: trimmed })
        .then(({ data }) => setCheck(data.check ?? null))
        .catch(() => setCheck(null));
    }, 250);
    return () => clearTimeout(timer);
  }, [kind, name]);

  async function save(useId: string | null) {
    setBusy(true);
    setStatus(null);
    try {
      const body =
        kind === "skill"
          ? { name, useId, level: detail || null }
          : { name, useId, role: detail, link };
      const { status: code, data } = await post<{ view?: EnrichmentView; existing?: Existing }>(
        kind === "skill" ? "/api/profile/skills" : "/api/profile/projects",
        body,
      );
      if (code === 409 && data.existing) {
        setCheck({ kind: "existing", item: data.existing, onProfile: kind === "project" });
        setStatus(ENRICHMENT_COPY.existing);
        return;
      }
      if (!data.view) {
        setStatus("Could not save that.");
        return;
      }
      onSaved(data.view);
      setName("");
      setDetail("");
      setLink("");
      setCheck(null);
      setOpen(false);
    } catch {
      setStatus("Could not reach the portal.");
    } finally {
      setBusy(false);
    }
  }

  const label = kind === "skill" ? ENRICHMENT_COPY.addSkill : ENRICHMENT_COPY.addProject;
  if (!open) {
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  const existing = check?.kind === "existing" ? check : null;
  return (
    <form
      className="space-y-3 rounded-lg border border-border px-4 py-4"
      data-add={kind}
      onSubmit={(event) => {
        event.preventDefault();
        void save(null);
      }}
    >
      <p className="text-sm font-semibold">{label}</p>
      <div>
        <label className="label" htmlFor={`add-${kind}-name`}>
          {kind === "skill" ? "Skill" : "Project name"}
        </label>
        <input
          id={`add-${kind}-name`}
          className="input"
          value={name}
          maxLength={kind === "skill" ? 80 : 120}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
          required
        />
      </div>
      {existing ? (
        <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm" role="status" data-existing>
          <p className="font-semibold">{ENRICHMENT_COPY.existing}</p>
          <p className="text-xs text-muted-foreground">
            {existing.item.name}
            {existing.onProfile ? " · already on your profile" : ""}
          </p>
          {existing.onProfile && kind === "skill" ? null : (
            <button type="button" className="mt-2 text-sm underline underline-offset-4" disabled={busy} onClick={() => void save(existing.item.id)}>
              {ENRICHMENT_COPY.use}
            </button>
          )}
        </div>
      ) : check?.kind === "new" && check.suggestions.length ? (
        <div className="text-sm" data-suggestions>
          <p className="text-xs text-muted-foreground">{ENRICHMENT_COPY.didYouMean}</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {check.suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary"
                  disabled={busy}
                  onClick={() => void save(item.id)}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {kind === "skill" ? (
        <div>
          <label className="label" htmlFor="add-skill-level">
            How strong (optional)
          </label>
          <select id="add-skill-level" className="input" value={detail} onChange={(event) => setDetail(event.target.value)}>
            <option value="">Not set</option>
            <option value="learning">Learning</option>
            <option value="working">Working</option>
            <option value="strong">Strong</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      ) : (
        <>
          <div>
            <label className="label" htmlFor="add-project-role">
              Your role (optional)
            </label>
            <input id="add-project-role" className="input" maxLength={120} value={detail} onChange={(event) => setDetail(event.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="add-project-link">
              Link (optional)
            </label>
            <input id="add-project-link" className="input" type="url" placeholder="https://" value={link} onChange={(event) => setLink(event.target.value)} />
          </div>
        </>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={busy || !name.trim() || Boolean(existing)}>
          {check?.kind === "new" && check.suggestions.length ? ENRICHMENT_COPY.createAnyway : "Save"}
        </button>
        <button type="button" className="text-sm underline underline-offset-4" onClick={() => setOpen(false)}>
          Cancel
        </button>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </div>
    </form>
  );
}

function ImportReview({ onSaved }: { onSaved: (view: EnrichmentView) => void }) {
  const [profileUrl, setProfileUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [source, setSource] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function read() {
    setBusy(true);
    setStatus(null);
    try {
      const form = new FormData();
      form.set("profileUrl", profileUrl);
      if (file) form.set("file", file);
      const res = await fetch("/api/profile/import/review", { method: "POST", body: form });
      const data = (await res.json()) as {
        kind?: "pdf_required" | "review";
        items?: ReviewItem[];
        profileUrl?: string | null;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setStatus(
          data.error === "profile_url_invalid"
            ? "Use your LinkedIn profile link, like https://www.linkedin.com/in/your-name."
            : data.error === "pdf_unreadable"
              ? "That PDF could not be read."
              : "Could not read that.",
        );
        return;
      }
      if (data.kind === "pdf_required") {
        setStatus(data.message ?? LINKEDIN_COPY.pdfRequired);
        return;
      }
      const list = data.items ?? [];
      setItems(list);
      setSource(data.profileUrl ?? null);
      setChosen(new Set(list.filter((item) => !item.onProfile).map((item) => item.id)));
    } catch {
      setStatus("Could not reach the portal.");
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!items) return;
    setBusy(true);
    setStatus(null);
    try {
      const picked = items.filter((item) => chosen.has(item.id));
      const payload = picked.map((item) => {
        const candidate: ImportCandidate = {
          id: item.id,
          kind: item.kind,
          title: item.title,
          organization: item.organization,
          startedOn: item.startedOn,
          endedOn: item.endedOn,
        };
        return { candidate, useId: item.existing?.id ?? null };
      });
      const { data } = await post<Partial<AcceptResult>>("/api/profile/import/accept", { profileUrl: source, items: payload });
      if (!data.view) {
        setStatus("Could not save those.");
        return;
      }
      onSaved(data.view);
      setItems(null);
      setFile(null);
      const linked = data.linkedExisting?.length ? `, ${data.linkedExisting.length} linked to what was already in the system` : "";
      const skipped = data.alreadyOnProfile?.length ? `, ${data.alreadyOnProfile.length} already on your profile` : "";
      setStatus(`Saved ${data.added?.length ?? 0} new${linked}${skipped}.`);
    } catch {
      setStatus("Could not reach the portal.");
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3" data-import>
      <h3 className="text-sm font-semibold">Import from LinkedIn</h3>
      <p className="text-xs text-muted-foreground">{LINKEDIN_COPY.pdfRequired}</p>
      {items ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{LINKEDIN_COPY.reviewHint}</p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-3 py-2" data-review-item={item.kind}>
                <input
                  id={`review-${item.id}`}
                  type="checkbox"
                  className="mt-1"
                  checked={chosen.has(item.id)}
                  onChange={() => toggle(item.id)}
                />
                <label htmlFor={`review-${item.id}`} className="min-w-0 text-sm">
                  <span className="text-xs text-muted-foreground">{KIND_LABEL[item.kind]} · </span>
                  {item.title}
                  {item.organization ? <span className="text-muted-foreground"> · {item.organization}</span> : null}
                  {dates(item) ? <span className="text-xs text-muted-foreground"> · {dates(item)}</span> : null}
                  {item.existing ? (
                    <span className="block text-xs font-semibold" data-existing>
                      {ENRICHMENT_COPY.existing} · {item.onProfile ? "already on your profile" : `links to ${item.existing.name}`}
                    </span>
                  ) : item.onProfile ? (
                    <span className="block text-xs text-muted-foreground">Already on your profile</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary" disabled={busy || chosen.size === 0} onClick={() => void accept()}>
              Accept {chosen.size} selected
            </button>
            <button type="button" className="text-sm underline underline-offset-4" onClick={() => setItems(null)}>
              Discard
            </button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void read();
          }}
        >
          <div>
            <label className="label" htmlFor="import-profile-url">
              LinkedIn profile link
            </label>
            <input
              id="import-profile-url"
              className="input"
              type="url"
              placeholder="https://www.linkedin.com/in/your-name"
              value={profileUrl}
              onChange={(event) => setProfileUrl(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="import-pdf">
              LinkedIn PDF export
            </label>
            <input
              id="import-pdf"
              type="file"
              accept="application/pdf"
              className="text-sm"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={busy || (!profileUrl.trim() && !file)}>
            {busy ? "Reading…" : "Review what we found"}
          </button>
        </form>
      )}
      {status ? (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}

/** Projects, skills, and imported lines on the User's own profile, with where each one came from. */
export function EnrichmentPanel() {
  const [view, setView] = useState<EnrichmentView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/profile/enrichment")
      .then(async (res) => {
        const data = (await res.json()) as { view?: EnrichmentView };
        if (cancelled) return;
        if (!data.view) setError("Could not load projects and skills.");
        else setView(data.view);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the portal.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function remove(kind: "skill" | "project" | "entry", id: string) {
    const res = await fetch("/api/profile/enrichment", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
    });
    const data = (await res.json()) as { view?: EnrichmentView };
    if (data.view) setView(data.view);
  }

  if (error) return <p className="text-sm text-muted-foreground">{error}</p>;
  if (!view) return <p className="text-sm text-muted-foreground">Loading projects and skills…</p>;

  const removeButton = (kind: "skill" | "project" | "entry", id: string) => (
    <button type="button" className="text-xs underline underline-offset-4" onClick={() => void remove(kind, id)}>
      Remove
    </button>
  );

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card px-5 py-5" data-enrichment>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Projects</h2>
        {view.projects.length ? (
          <ul className="divide-y divide-border">
            {view.projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm">
                    {project.name}
                    {project.role ? <span className="text-muted-foreground"> · {project.role}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground" data-source={project.source}>
                    {sourceLabel(project)}
                  </p>
                </div>
                {removeButton("project", project.id)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No projects yet.</p>
        )}
        <AddItem kind="project" onSaved={setView} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Skills</h2>
        {view.skills.length ? (
          <ul className="divide-y divide-border">
            {view.skills.map((skill) => (
              <li key={skill.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm">
                    {skill.name}
                    {skill.level ? <span className="text-muted-foreground"> · {skill.level}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground" data-source={skill.source}>
                    {sourceLabel(skill)}
                  </p>
                </div>
                {removeButton("skill", skill.id)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No skills yet.</p>
        )}
        <AddItem kind="skill" onSaved={setView} />
      </div>

      {view.entries.length ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Experience and education</h2>
          <ul className="divide-y divide-border">
            {view.entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="text-xs text-muted-foreground">{KIND_LABEL[entry.kind]} · </span>
                    {entry.title}
                    {entry.organization ? <span className="text-muted-foreground"> · {entry.organization}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground" data-source={entry.source}>
                    {[dates(entry), sourceLabel(entry)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {removeButton("entry", entry.id)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ImportReview onSaved={setView} />
    </section>
  );
}
