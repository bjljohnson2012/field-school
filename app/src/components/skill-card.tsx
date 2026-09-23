export type SkillCardSkill = {
  slug: string;
  name: string;
  score: number | null;
  scale: "0-100" | "1-4";
  source?: string | null;
};

const SOURCE_LABEL: Record<string, string> = {
  ai: "AI",
  coach_override: "Coach override",
  self: "Self",
  monthly_review: "Monthly review",
};

function scaleLabel(scale: SkillCardSkill["scale"]) {
  return scale === "0-100" ? "0–100" : "1–4";
}

export function SkillCard({ skills }: { skills: SkillCardSkill[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => {
        const max = skill.scale === "0-100" ? 100 : 4;
        const width =
          skill.score == null ? 0 : Math.max(0, Math.min(100, (skill.score / max) * 100));
        const source =
          skill.scale === "0-100" && skill.source
            ? SOURCE_LABEL[skill.source] ?? skill.source
            : null;
        return (
          <article key={skill.slug} className="card p-4" data-scale={skill.scale}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg tracking-tight">{skill.name}</h3>
              <p className="meta">{scaleLabel(skill.scale)}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {skill.score == null ? "—" : skill.score}
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted" aria-hidden="true">
              <div className="h-2 rounded-full bg-brand-orange" style={{ width: `${width}%` }} />
            </div>
            {source ? <p className="meta mt-2">{source}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
