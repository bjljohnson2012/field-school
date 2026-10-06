import Link from "next/link";
import type { AdultGateId, AdultSetup } from "@/lib/profile/model";

const TRACK_FOR_GATE: Record<AdultGateId, string> = {
  "G-personality": "personality",
  "G-skills": "skills",
  "G-other": "profile",
};

/** Opens the wizard at the first track whose gate is not met yet. */
export function AssessmentsLink({ setup }: { setup: AdultSetup }) {
  const next = setup.gates.find((gate) => !gate.done);
  const href = next ? `/profile/assessments?track=${TRACK_FOR_GATE[next.id]}` : "/profile/assessments";
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4" data-assessments-link>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">Assessments</h2>
        <p className="text-xs text-muted-foreground">Personality, Skills, and Profile in one place. Stop any time and pick up on any device.</p>
      </div>
      <Link href={href} className="btn-primary">
        {next ? "Continue assessments" : "Open assessments"}
      </Link>
    </section>
  );
}
