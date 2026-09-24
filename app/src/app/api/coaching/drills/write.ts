import { gradeDrillResponse } from "@/lib/ai/prompts/drills";
import { scoreToPoints } from "./math";

export class DrillWriteError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.name = "DrillWriteError";
    this.code = code;
  }
}

export type DrillSubject = {
  orgId: string;
  membershipId: string;
  stance: string;
};

export type DrillAttemptRow = {
  orgId: string;
  membershipId: string;
  skillCategory: string;
  prompt: string;
  userResponse: string;
  aiScore: number;
  pointsAwarded: number;
  status: "completed";
};

export type DrillEventWrite = {
  kind: "drill";
  objectType: "drill";
  objectId: string;
  score: number;
  raw: Record<string, unknown>;
};

type Grade = {
  score: number;
  summary: string;
  didWell: string[];
  toImprove: string[];
  improvedExample: string;
};

export async function recordDrillAttempt(
  input: {
    subject: DrillSubject;
    skillCategory: string;
    scenario: string;
    expectedBehaviors: string[];
    trapBehaviors: string[];
    rubric: string;
    userResponse: string;
    requestedMembershipId?: string | null;
  },
  deps: {
    grade?: typeof gradeDrillResponse;
    insertAttempt: (row: DrillAttemptRow) => Promise<{ id: string }>;
    recordEvent: (
      subject: DrillSubject,
      event: DrillEventWrite,
      actor: { membershipId: string; stance: string },
    ) => Promise<unknown>;
  },
) {
  const requested = input.requestedMembershipId?.trim() ?? "";
  if (requested && requested !== input.subject.membershipId) {
    throw new DrillWriteError("subject_only");
  }
  const userResponse = input.userResponse.trim();
  if (!userResponse || userResponse.length > 4000) throw new DrillWriteError("invalid_body");
  if (!input.scenario.trim() || !input.skillCategory.trim()) throw new DrillWriteError("invalid_body");

  const gradeFn = deps.grade ?? gradeDrillResponse;
  const graded = await gradeFn({
    scenario: input.scenario,
    expectedBehaviors: input.expectedBehaviors,
    trapBehaviors: input.trapBehaviors,
    rubric: input.rubric,
    userResponse,
  });
  const score = Math.max(0, Math.min(100, Math.round(Number(graded.score) || 0)));
  const summary = graded.summary ?? "";
  const didWell = Array.isArray(graded.didWell) ? graded.didWell : [];
  const toImprove = Array.isArray(graded.toImprove) ? graded.toImprove : [];
  const improvedExample = graded.improvedExample ?? "";
  const pointsAwarded = scoreToPoints(score);
  const saved = await deps.insertAttempt({
    orgId: input.subject.orgId,
    membershipId: input.subject.membershipId,
    skillCategory: input.skillCategory,
    prompt: input.scenario,
    userResponse,
    aiScore: score,
    pointsAwarded,
    status: "completed",
  });
  const grade: Grade = { score, summary, didWell, toImprove, improvedExample };
  await deps.recordEvent(
    input.subject,
    {
      kind: "drill",
      objectType: "drill",
      objectId: saved.id,
      score,
      raw: {
        skillCategory: input.skillCategory,
        pointsAwarded,
        summary,
        didWell,
        toImprove,
        improvedExample,
      },
    },
    { membershipId: input.subject.membershipId, stance: input.subject.stance },
  );
  return { id: saved.id, grade, pointsAwarded };
}
