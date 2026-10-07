"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EdgePanel } from "@/components/knowledge/edge-panel";
import { AssessmentResults } from "@/components/profile-m2/assessment-results";
import { AssessmentsLink } from "@/components/profile-m2/assessments-link";
import { EnrichmentPanel } from "@/components/profile-m2/enrichment-panel";
import { PhotoPanel } from "@/components/profile-m2/photo-panel";
import { freshnessLabel, PROFILE_COPY, type AdultSetup, type KidSetup } from "@/lib/profile/model";

type Profile = {
  displayName: string;
  photoSrc: string;
  currentProjects: string[];
  skillsAdapted: string[];
  setup: AdultSetup;
};

type Kid = { membershipId: string; displayName: string; login: "none"; setup: KidSetup };

const ERRORS: Record<string, string> = {
  display_name_required: "Enter a display name.",
  photo_url_invalid: "Use an https:// link for the photo, or leave it empty.",
  sign_in_required: "Sign in to see your profile.",
  child_has_no_adult_profile: "A child profile is edited by the parent.",
  database_unavailable: "Profiles are not reachable right now.",
};

function lines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [projects, setProjects] = useState("");
  const [skills, setSkills] = useState("");
  const now = new Date();

  function fill(next: Profile) {
    setProfile(next);
    setName(next.displayName);
    setProjects(next.currentProjects.join("\n"));
    setSkills(next.skillsAdapted.join("\n"));
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/profile")
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean; error?: string; profile?: Profile; kids?: Kid[] };
        if (cancelled) return;
        if (!res.ok || !data.profile) {
          setError(ERRORS[data.error || ""] || "Could not load your profile.");
          return;
        }
        fill(data.profile);
        setKids(data.kids ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the portal.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name,
          currentProjects: lines(projects),
          skillsAdapted: lines(skills),
        }),
      });
      const data = (await res.json()) as { error?: string; profile?: Profile };
      if (!res.ok || !data.profile) {
        setStatus(ERRORS[data.error || ""] || "Could not save that.");
        return;
      }
      fill(data.profile);
      setStatus("Saved.");
    } catch {
      setStatus("Could not reach the portal.");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="h-section">Profile</h1>
        <p className="mt-3 text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </main>
    );
  }

  const setup = profile.setup;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <section
        data-profile-state={setup.complete ? "complete" : "setup"}
        className="rounded-xl border border-border bg-card px-5 py-4"
      >
        <p className="text-sm font-semibold text-foreground" role="status">
          {setup.complete ? PROFILE_COPY.complete : PROFILE_COPY.incomplete}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {setup.done} of {setup.total} setup steps done
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-foreground"
            style={{ width: `${Math.round((setup.done / setup.total) * 100)}%` }}
          />
        </div>
      </section>

      <section className="flex items-center gap-4">
        {profile.photoSrc ? (
          <img
            src={profile.photoSrc}
            alt=""
            className="size-16 rounded-full border border-border object-cover"
          />
        ) : null}
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your profile</p>
          <h1 className="h-section truncate">{profile.displayName}</h1>
          <p className="text-xs text-muted-foreground">Only you see this page.</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card px-5 py-5">
        <h2 className="text-sm font-semibold">Setup checklist</h2>
        <ul className="mt-3 divide-y divide-border">
          {setup.gates.map((gate) => (
            <li key={gate.id} data-gate={gate.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm">
                  <span aria-hidden="true">{gate.done ? "✓ " : "○ "}</span>
                  {gate.label}
                </p>
                <p className="text-xs text-muted-foreground">{gate.feed}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span data-freshness className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                  {freshnessLabel(gate.lastAt, now)}
                </span>
                {gate.href ? (
                  <Link href={gate.href} className="underline underline-offset-4">
                    {gate.done ? "Retake" : "Start"}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {setup.complete ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Retaking an assessment updates its date. Your profile stays done.
          </p>
        ) : null}
      </section>

      <AssessmentsLink setup={setup} />

      <AssessmentResults />

      <PhotoPanel photoSrc={profile.photoSrc} onChange={(photoSrc) => setProfile({ ...profile, photoSrc })} />

      <section className="rounded-xl border border-border bg-card px-5 py-5">
        <h2 className="text-sm font-semibold">About you</h2>
        <form className="mt-4 space-y-4" onSubmit={save}>
          <div>
            <label className="label" htmlFor="profile-name">
              Display name
            </label>
            <input
              id="profile-name"
              className="input"
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-projects">
              Current projects
            </label>
            <textarea
              id="profile-projects"
              className="input min-h-24"
              placeholder="One per line"
              value={projects}
              onChange={(event) => setProjects(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="profile-skills">
              Skills adapted
            </label>
            <textarea
              id="profile-skills"
              className="input min-h-24"
              placeholder="One per line. You add these yourself."
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
            {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          </div>
        </form>
      </section>

      <EnrichmentPanel />

      {kids.length ? (
        <section className="rounded-xl border border-border bg-card px-5 py-5">
          <h2 className="text-sm font-semibold">Child profiles you edit</h2>
          <p className="mt-1 text-xs text-muted-foreground">Tracked children. No login. Only you edit these.</p>
          <ul className="mt-3 divide-y divide-border">
            {kids.map((kid) => (
              <li key={kid.membershipId} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm">{kid.displayName}</p>
                  <p className="text-xs text-muted-foreground">{kid.setup.headline}</p>
                </div>
                <Link href={`/profile/kids/${kid.membershipId}`} className="text-sm underline underline-offset-4">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <EdgePanel
        focus="self"
        title="Your milestones"
        hint="Each milestone opens to the row it came from. Only you see these."
        empty="Nothing yet. Take a Tools assessment or the Field Pattern to start."
        hideFrom
      />
    </main>
  );
}
