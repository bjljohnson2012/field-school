"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Skill = { id: string; slug: string; name: string; prompt: string; score: number | null };

export default function SkillsPage() {
  const [org, setOrg] = useState("");
  const [editable, setEditable] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setNote(data.error);
          return;
        }
        setOrg(data.org);
        setEditable(Boolean(data.editable));
        setSkills(data.skills ?? []);
        const next: Record<string, number> = {};
        for (const skill of data.skills ?? []) {
          if (skill.score != null) next[skill.slug] = skill.score;
        }
        setScores(next);
      });
  }, []);

  async function saveNames() {
    const res = await fetch("/api/skills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills }),
    });
    setNote(res.ok ? "Skills updated." : "Could not edit.");
  }

  async function runDiagnostic() {
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores }),
    });
    setNote(res.ok ? "Diagnostic saved in this org only." : "Could not save diagnostic.");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {org} · skills
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Skill diagnostic</h1>
      <p className="mt-4 text-muted-foreground">
        Org-scoped. Household skills are parent-editable. Sales skills are the
        desk steps. This does not write the other org.
      </p>
      <ol className="mt-8 space-y-4">
        {skills.map((skill, i) => (
          <li key={skill.id} className="rounded-xl border border-border bg-card px-4 py-4">
            {editable ? (
              <input
                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm font-medium"
                value={skill.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setSkills((cur) => cur.map((s, j) => (j === i ? { ...s, name } : s)));
                }}
              />
            ) : (
              <p className="font-medium">{skill.name}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{skill.prompt}</p>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`h-10 w-10 rounded-lg border text-sm ${scores[skill.slug] === n ? "border-primary bg-secondary" : "border-border"}`}
                  onClick={() => setScores((cur) => ({ ...cur, [skill.slug]: n }))}
                >
                  {n}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        {editable ? <Button onClick={() => void saveNames()}>Save skill names</Button> : null}
        <Button onClick={() => void runDiagnostic()}>Save diagnostic</Button>
      </div>
      {note ? <p className="mt-4 text-sm">{note}</p> : null}
    </main>
  );
}
