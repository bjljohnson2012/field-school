/**
 * PM3 wizard finish. Personality placements become suggested outcomes.
 * Skills and Profile placements become evidence only.
 * Home links the first suggested outcome to an enrollment or catalog slug.
 */

export const PLACEMENT_REF = "assessment_placements" as const;
export const DEFAULT_CATALOG_SLUG = "grok-bot";

const CATALOG_RE = /^[a-z0-9-]{1,80}$/;

export type FinishPlacement = {
  id: string;
  runId: string;
  track: string;
  label: string;
  locked: boolean;
  unsettled: boolean;
  catalogSlug?: string;
};

export type OutcomeWrite = {
  role: "outcome";
  kind: "goal";
  suggested: true;
  refTable: typeof PLACEMENT_REF;
  refId: string;
  runId: string;
  title: string;
  catalogSlug: string;
};

export type EvidenceWrite = {
  role: "evidence";
  kind: "evidence";
  refTable: typeof PLACEMENT_REF;
  refId: string;
  runId: string;
  label: string;
};

export type BrainMemory = { outcomes: OutcomeWrite[]; evidence: EvidenceWrite[] };

export function emptyBrain(): BrainMemory {
  return { outcomes: [], evidence: [] };
}

export function safeCatalogSlug(value: string | null | undefined): string {
  const text = (value ?? "").trim().toLowerCase();
  return CATALOG_RE.test(text) ? text : "";
}

function qualifying(placement: FinishPlacement) {
  return Boolean(placement.id && placement.runId && (placement.locked || placement.unsettled));
}

export function graphWritesForFinish(placements: readonly FinishPlacement[]): BrainMemory {
  const outcomes: OutcomeWrite[] = [];
  const evidence: EvidenceWrite[] = [];
  for (const placement of placements) {
    if (!qualifying(placement)) continue;
    if (placement.track === "personality") {
      outcomes.push({
        role: "outcome",
        kind: "goal",
        suggested: true,
        refTable: PLACEMENT_REF,
        refId: placement.id,
        runId: placement.runId,
        title: placement.label.trim() || "Suggested outcome",
        catalogSlug: safeCatalogSlug(placement.catalogSlug) || DEFAULT_CATALOG_SLUG,
      });
      continue;
    }
    if (placement.track === "skills" || placement.track === "profile") {
      evidence.push({
        role: "evidence",
        kind: "evidence",
        refTable: PLACEMENT_REF,
        refId: placement.id,
        runId: placement.runId,
        label: placement.label.trim() || "Evidence",
      });
    }
  }
  return { outcomes, evidence };
}

function sameRef(left: { refTable: string; refId: string; role: string }, right: { refTable: string; refId: string; role: string }) {
  return left.refTable === right.refTable && left.refId === right.refId && left.role === right.role;
}

/** A second finish for the same placement does not add another node. */
export function commitFinish(memory: BrainMemory, placements: readonly FinishPlacement[]): BrainMemory {
  const next = graphWritesForFinish(placements);
  const outcomes = [...memory.outcomes];
  const evidence = [...memory.evidence];
  for (const row of next.outcomes) {
    if (!outcomes.some((item) => sameRef(item, row))) outcomes.push(row);
  }
  for (const row of next.evidence) {
    if (!evidence.some((item) => sameRef(item, row))) evidence.push(row);
  }
  return { outcomes, evidence };
}

export type HomeCourse = { from: "outcomes"; title: string; href: string; courseSlug: string };

export function homeCourseCta(input: {
  outcomes: readonly { title: string; catalogSlug: string }[];
  enrollmentSlug: string | null;
}): HomeCourse | null {
  const outcome = input.outcomes.find((row) => row.title.trim() && safeCatalogSlug(row.catalogSlug));
  if (!outcome) return null;
  const courseSlug = safeCatalogSlug(input.enrollmentSlug) || safeCatalogSlug(outcome.catalogSlug) || DEFAULT_CATALOG_SLUG;
  return {
    from: "outcomes",
    title: outcome.title.trim(),
    href: `/c/${courseSlug}`,
    courseSlug,
  };
}

/** A rejected inferred edge stays off every PM3 surface. */
export function visibleBrainEdge(edge: { status: string }) {
  return edge.status !== "rejected";
}
