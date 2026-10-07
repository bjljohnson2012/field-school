import { LOOP_LIMITS } from "./machine.ts";

export const EVIDENCE_STRENGTH = {
  parent_ready: 1,
  parent_getting_there: 0.5,
  parent_not_yet: 0.15,
  quiz_pass: 0.8,
  artifact: 0.6,
  upload: 0.3,
  brain_source: 0.3,
  profile_skill: 0.4,
  assessment_band: 0.3,
} as const;

export type EvidenceKind = keyof typeof EVIDENCE_STRENGTH;

export const GAP_KINDS = ["missing_knowledge", "missing_demonstration", "missing_link", "stale", "conflict"] as const;
export type GapKind = (typeof GAP_KINDS)[number];

export type SystemConfidence = "Low" | "Medium" | "High";

export type ScoreEvidence = {
  id: string;
  kind: EvidenceKind;
  match: number;
  ageDays: number;
  sourceId: string;
  materialOnHand: boolean;
  provesUse: boolean;
  disagreesWith?: string;
};

export type RequirementScore = {
  id: string;
  label: string;
  weight: number;
  depth: number;
  evidence: ScoreEvidence[];
  expectedLinkMissing?: boolean;
  coveredClusters?: number;
  ownerConfirmed?: boolean;
};

export function freshness(ageDays: number) {
  if (ageDays <= LOOP_LIMITS.freshnessDays) return 1;
  const over = ageDays - LOOP_LIMITS.freshnessDays;
  return Math.max(0.2, 1 - over / 365);
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Coverage is 0 to 100. One fresh Ready rating with a full match is 100. */
export function coverageOf(items: readonly ScoreEvidence[]) {
  const sum = items.reduce((acc, item) => {
    return acc + EVIDENCE_STRENGTH[item.kind] * clamp01(item.match) * freshness(item.ageDays);
  }, 0);
  return Math.min(100, Math.round(sum * 100));
}

export function evidenceKey(items: readonly { id: string }[]) {
  return items.map((item) => item.id).sort().join(",");
}

export function detectGap(requirement: RequirementScore, coverage: number): GapKind | null {
  const items = requirement.evidence;
  const conflict = items.some((item) => item.disagreesWith);
  if (conflict) return "conflict";
  const staleOnly = items.length > 0 && items.every((item) => item.ageDays > LOOP_LIMITS.freshnessDays);
  if (staleOnly) return "stale";
  if (requirement.expectedLinkMissing && (requirement.coveredClusters ?? 0) >= 2) return "missing_link";
  const material = items.some((item) => item.materialOnHand);
  const proof = items.some((item) => item.provesUse);
  if (coverage >= LOOP_LIMITS.metAt && material && proof) return null;
  if (coverage >= LOOP_LIMITS.metAt && proof) return null;
  if (coverage < LOOP_LIMITS.gapBelow && !material) return "missing_knowledge";
  if (material && !proof) return "missing_demonstration";
  if (coverage < LOOP_LIMITS.metAt) return "missing_demonstration";
  return null;
}

export function gapPriority(weight: number, coverage: number, depth: number) {
  const bonus = 1 + Math.max(0, depth) * 0.25;
  return Math.round(weight * (100 - coverage) * bonus);
}

export function rankGaps<T extends { priority: number }>(gaps: readonly T[]) {
  return [...gaps].sort((a, b) => b.priority - a.priority);
}

export function systemConfidence(items: readonly ScoreEvidence[], ownerConfirmed: boolean): SystemConfidence {
  const sources = new Set(items.map((item) => item.sourceId)).size;
  const recent = items.filter((item) => item.ageDays <= LOOP_LIMITS.freshnessDays).length;
  if (ownerConfirmed && sources >= 3 && recent >= 2) return "High";
  if (sources >= 2 && recent >= 1) return "Medium";
  return "Low";
}

export function gapSummary(kind: GapKind, label: string) {
  if (kind === "missing_knowledge") return `Nothing on hand yet for ${label}.`;
  if (kind === "missing_demonstration") return `${label} is on hand, with no proof of use yet.`;
  if (kind === "missing_link") return `${label} is not linked to the goal yet.`;
  if (kind === "stale") return `${label} only has old evidence.`;
  return `Two sources disagree about ${label}.`;
}

export type PriorFinding = { requirementId: string; status: string; evidenceKey: string };

/** A rejected finding stays out until the citation set changes. */
export function suppressRejected<T extends { requirementId: string; evidenceKey: string }>(
  previous: readonly PriorFinding[],
  next: readonly T[],
) {
  const blocked = new Set(
    previous.filter((row) => row.status === "rejected").map((row) => `${row.requirementId}:${row.evidenceKey}`),
  );
  return next.filter((row) => !blocked.has(`${row.requirementId}:${row.evidenceKey}`));
}

export function wordMatch(requirement: string, text: string) {
  const words = requirement.toLowerCase().split(/\W+/).filter((word) => word.length > 3);
  if (!words.length) return 0.4;
  const hay = text.toLowerCase();
  const hit = words.filter((word) => hay.includes(word)).length;
  return hit / words.length;
}

export type RequirementDraft = {
  label: string;
  kind: "knowledge" | "skill" | "demonstration";
  weight: number;
  doneCondition: { evidenceType: string; text: string };
};

const KINDS = new Set(["knowledge", "skill", "demonstration"]);

export function fallbackRequirements(statement: string): RequirementDraft[] {
  const clean = statement.replace(/\s+/g, " ").trim() || "this goal";
  return [
    {
      label: `Know ${clean}`,
      kind: "knowledge",
      weight: 3,
      doneCondition: { evidenceType: "upload", text: "A source that covers the idea" },
    },
    {
      label: `Practice ${clean}`,
      kind: "skill",
      weight: 2,
      doneCondition: { evidenceType: "answer", text: "A worked answer" },
    },
    {
      label: `Show ${clean}`,
      kind: "demonstration",
      weight: 3,
      doneCondition: { evidenceType: "rating", text: "A rating that this can be done" },
    },
  ];
}

export function clampRequirements(rows: readonly RequirementDraft[]) {
  const clean = rows
    .map((row) => ({
      label: row.label.replace(/\s+/g, " ").trim().slice(0, 180),
      kind: (KINDS.has(row.kind) ? row.kind : "knowledge") as RequirementDraft["kind"],
      weight: Math.min(5, Math.max(1, Math.round(row.weight) || 1)),
      doneCondition: {
        evidenceType: row.doneCondition?.evidenceType || "upload",
        text: (row.doneCondition?.text || "Evidence that this is done").slice(0, 240),
      },
    }))
    .filter((row) => row.label.length >= 2);
  const padded = clean.length >= LOOP_LIMITS.requirementsMin ? clean : [...clean, ...fallbackRequirements(clean[0]?.label || "this goal")];
  return padded.slice(0, LOOP_LIMITS.requirementsMax);
}

export function requestForGap(kind: GapKind, label: string, ownerKind: "person" | "child") {
  if (kind === "missing_knowledge") {
    return {
      channel: "upload" as const,
      question: `What do you have on ${label}?`,
      requestCopy: `Found a gap in ${label}. Upload notes or paste what you know.`,
    };
  }
  if (kind === "missing_demonstration") {
    return ownerKind === "child"
      ? {
          channel: "rating" as const,
          question: `How is ${label} going?`,
          requestCopy: `Rate ${label}, or open a lesson.`,
        }
      : {
          channel: "lesson" as const,
          question: `Where can you show ${label}?`,
          requestCopy: `Open a lesson for ${label}, or paste a worked example.`,
        };
  }
  if (kind === "missing_link") {
    return {
      channel: "answer" as const,
      question: `How does ${label} serve the goal?`,
      requestCopy: `Answer a short question that links ${label} to the goal.`,
    };
  }
  if (kind === "stale") {
    return {
      channel: "answer" as const,
      question: `Does ${label} still hold?`,
      requestCopy: `${label} looks old. A short re-check will refresh it.`,
    };
  }
  return {
    channel: "answer" as const,
    question: `Which source about ${label} should we keep?`,
    requestCopy: `Two sources disagree about ${label}. Pick which one holds.`,
  };
}
