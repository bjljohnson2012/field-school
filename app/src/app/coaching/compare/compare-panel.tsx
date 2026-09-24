"use client";

import { useState } from "react";

export type ComparePerson = { id: string; name: string; stance: string };

type AeResult = {
  narrative: { summary: string; contrasts: string[]; whoToInvestIn: string; collectiveTheme: string };
  recommendations: Array<{ id: string; title: string; body: string; routeTo: string; category: string; subjectName: string }>;
};

type DirectorTypes = { enneagramType: string | null; discProfile: string | null; mbtiType: string | null };

type DirectorResult = {
  narrative: {
    summary: string;
    alignedAreas: string[];
    frictionPoints: string[];
    adjustments: Record<string, string[]>;
  };
  leader: { name: string; types: DirectorTypes; typesVisible: boolean };
  target: { name: string; types: DirectorTypes; typesVisible: boolean };
};

function typeLine(types: DirectorTypes, visible: boolean) {
  if (!visible) return "";
  return [types.enneagramType, types.discProfile, types.mbtiType].filter(Boolean).join(" · ");
}

export function ComparePanel({
  aes,
  directors,
  actorMembershipId,
}: {
  aes: ComparePerson[];
  directors: ComparePerson[];
  actorMembershipId: string;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [leaderId, setLeaderId] = useState(actorMembershipId);
  const [targetId, setTargetId] = useState("");
  const [aeResult, setAeResult] = useState<AeResult | null>(null);
  const [directorResult, setDirectorResult] = useState<DirectorResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 4) return current;
      return [...current, id];
    });
  }

  async function compareAes() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/coaching/compare/aes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipIds: picked }),
      });
      const data = (await res.json().catch(() => ({}))) as AeResult & { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not compare AEs");
        return;
      }
      setAeResult(data);
    } finally {
      setBusy(false);
    }
  }

  async function compareDirectors() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/coaching/compare/directors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderMembershipId: leaderId, targetMembershipId: targetId }),
      });
      const data = (await res.json().catch(() => ({}))) as DirectorResult & { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not compare directors");
        return;
      }
      setDirectorResult(data);
    } finally {
      setBusy(false);
    }
  }

  const leaderTypes = directorResult ? typeLine(directorResult.leader.types, directorResult.leader.typesVisible) : "";
  const targetTypes = directorResult ? typeLine(directorResult.target.types, directorResult.target.typesVisible) : "";

  return (
    <div className="mt-6 space-y-6">
      <section className="card p-6">
        <h2 className="h-section">Compare AEs</h2>
        {aes.length === 0 ? <p className="mt-3">No AEs in this org.</p> : null}
        <ul className="mt-4 space-y-2">
          {aes.map((person) => (
            <li key={person.id}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={picked.includes(person.id)} onChange={() => toggle(person.id)} />
                <span>{person.name}</span>
              </label>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-primary mt-4" disabled={busy || picked.length < 2} onClick={() => void compareAes()}>
          Compare AEs
        </button>
        {aeResult ? (
          <div className="mt-4 space-y-3">
            <p>{aeResult.narrative.summary}</p>
            <ul className="list-disc pl-5">
              {aeResult.narrative.contrasts.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {aeResult.narrative.whoToInvestIn ? <p>{aeResult.narrative.whoToInvestIn}</p> : null}
            {aeResult.narrative.collectiveTheme ? <p>{aeResult.narrative.collectiveTheme}</p> : null}
            {aeResult.recommendations.length ? (
              <ul className="space-y-2">
                {aeResult.recommendations.map((row) => (
                  <li key={row.id}>
                    <p className="font-semibold">{row.title}</p>
                    <p className="text-sm text-muted-foreground">{row.body}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="card p-6">
        <h2 className="h-section">Compare directors</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select className="input" value={leaderId} onChange={(event) => setLeaderId(event.target.value)}>
            <option value={actorMembershipId}>Me</option>
            {directors
              .filter((person) => person.id !== actorMembershipId)
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
          </select>
          <select className="input" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
            <option value="">Choose a director</option>
            {directors
              .filter((person) => person.id !== leaderId)
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
          </select>
        </div>
        <button type="button" className="btn-primary mt-4" disabled={busy || !targetId} onClick={() => void compareDirectors()}>
          Compare directors
        </button>
        {directorResult ? (
          <div className="mt-4 space-y-3">
            <p>
              {directorResult.leader.name}
              {leaderTypes ? ` · ${leaderTypes}` : ""}
            </p>
            <p>
              {directorResult.target.name}
              {targetTypes ? ` · ${targetTypes}` : ""}
            </p>
            <p>{directorResult.narrative.summary}</p>
            <ul className="list-disc pl-5">
              {directorResult.narrative.frictionPoints.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </section>
    </div>
  );
}
