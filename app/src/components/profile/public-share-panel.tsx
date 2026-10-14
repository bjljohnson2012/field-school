"use client";

import { useEffect, useState } from "react";

type Skill = { name: string; public: boolean };
type Project = { name: string; link: string; public: boolean };
type Fields = {
  headline: string;
  bio: string;
  linkedinUrl: string;
  skills: Skill[];
  projects: Project[];
  sharing: { enabled: boolean; path: string | null };
};

export function PublicSharePanel() {
  const [fields, setFields] = useState<Fields | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/profile/public-fields")
      .then(async (response) => {
        const data = (await response.json()) as { fields?: Fields };
        if (!cancelled && response.ok && data.fields) setFields(data.fields);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fields) return null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!fields) return;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/profile/public-fields", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: fields.headline,
          bio: fields.bio,
          linkedinUrl: fields.linkedinUrl,
          publicSkills: fields.skills.filter((skill) => skill.public).map((skill) => skill.name),
          publicProjects: fields.projects.filter((project) => project.public).map((project) => ({ name: project.name, link: project.link })),
        }),
      });
      const data = (await response.json()) as { fields?: Fields; error?: string };
      if (!response.ok || !data.fields) {
        setStatus("Could not save the public fields.");
        return;
      }
      setFields(data.fields);
      setStatus("Saved.");
    } catch {
      setStatus("Could not reach the portal.");
    } finally {
      setBusy(false);
    }
  }

  async function share(action: "enable" | "revoke") {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/profile/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { enabled?: boolean; path?: string | null };
      if (!response.ok) {
        setStatus("Could not update sharing.");
        return;
      }
      setFields((current) =>
        current
          ? { ...current, sharing: { enabled: Boolean(data.enabled), path: data.path ?? null } }
          : current,
      );
    } catch {
      setStatus("Could not reach the portal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card px-5 py-5" data-public-share="adult">
      <h2 className="text-sm font-semibold">Public profile</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Sharing is off until you turn it on. The link shows your display name, photo, headline, bio, public skills, public projects, and LinkedIn URL.
      </p>
      <form className="mt-4 space-y-3" onSubmit={(event) => void save(event)}>
        <label className="block text-sm">
          Headline
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            value={fields.headline}
            onChange={(event) => setFields({ ...fields, headline: event.target.value })}
          />
        </label>
        <label className="block text-sm">
          Bio
          <textarea
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            rows={3}
            value={fields.bio}
            onChange={(event) => setFields({ ...fields, bio: event.target.value })}
          />
        </label>
        <label className="block text-sm">
          LinkedIn URL
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            value={fields.linkedinUrl}
            onChange={(event) => setFields({ ...fields, linkedinUrl: event.target.value })}
          />
        </label>
        {fields.skills.length ? (
          <fieldset>
            <legend className="text-sm">Public skills</legend>
            <ul className="mt-2 space-y-1">
              {fields.skills.map((skill) => (
                <li key={skill.name}>
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={skill.public}
                      onChange={(event) =>
                        setFields({
                          ...fields,
                          skills: fields.skills.map((item) =>
                            item.name === skill.name ? { ...item, public: event.target.checked } : item,
                          ),
                        })
                      }
                    />
                    {skill.name}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}
        {fields.projects.length ? (
          <fieldset>
            <legend className="text-sm">Public projects</legend>
            <ul className="mt-2 space-y-1">
              {fields.projects.map((project) => (
                <li key={project.name}>
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={project.public}
                      onChange={(event) =>
                        setFields({
                          ...fields,
                          projects: fields.projects.map((item) =>
                            item.name === project.name ? { ...item, public: event.target.checked } : item,
                          ),
                        })
                      }
                    />
                    {project.name}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}
        <button type="submit" className="btn-primary" disabled={busy}>
          Save public fields
        </button>
      </form>
      <div className="mt-4">
        {fields.sharing.enabled && fields.sharing.path ? (
          <p className="text-sm">
            Public link: <a href={fields.sharing.path}>{fields.sharing.path}</a>
          </p>
        ) : (
          <p className="text-sm">Sharing is off.</p>
        )}
        <button
          type="button"
          className="mt-2 text-sm underline underline-offset-4"
          disabled={busy}
          onClick={() => void share(fields.sharing.enabled ? "revoke" : "enable")}
        >
          {fields.sharing.enabled ? "Turn off sharing" : "Turn on sharing"}
        </button>
      </div>
      {status ? <p className="mt-3 text-sm text-muted-foreground">{status}</p> : null}
    </section>
  );
}
