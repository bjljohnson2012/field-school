import { and, eq } from "drizzle-orm";
import { summarizeMonthlyReview } from "@/lib/ai/prompts/loop";
import { assertCanAccessMember, type Actor, type CoachingWorld } from "@/lib/coaching/access";
import { SkillScoreError, applySkillScore, loadSubjectIdentity } from "@/lib/coaching/scores";
import { getDb } from "@/lib/db/client";
import { questions, recommendations, reviewAnswers, reviews, skillStates, skills } from "@/lib/db/schema";
import {
  adjustedScore,
  followUpRecommendationRow,
  onlyReviewCoach,
  resolveReviewSkillSlug,
} from "@/app/coaching/reviews/policy";

export class ReviewFlowError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "ReviewFlowError";
    this.code = code;
    this.status = status;
  }
}

export async function submitMonthlyReview(input: {
  world: CoachingWorld;
  actor: Actor;
  reviewId: string;
  answers?: Array<{ questionId: string; value: unknown }>;
}) {
  const db = getDb();
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, input.reviewId), eq(reviews.orgId, input.actor.orgId)))
    .limit(1);
  if (!review) throw new ReviewFlowError("not_found", 404);
  if (!onlyReviewCoach(review, input.actor.membershipId)) throw new ReviewFlowError("forbidden", 403);
  if (!assertCanAccessMember(input.world, input.actor, review.subjectMembershipId)) {
    throw new ReviewFlowError("forbidden", 403);
  }
  if (review.status === "submitted") throw new ReviewFlowError("review_closed", 409);

  const questionRows = await db.select().from(questions);
  const allowedQuestions = questionRows.filter(
    (row) => row.active && (row.orgId === input.actor.orgId || row.orgId == null),
  );
  const allowedIds = new Set(allowedQuestions.map((row) => row.id));
  for (const answer of input.answers ?? []) {
    if (!allowedIds.has(answer.questionId)) continue;
    const value = answer.value === undefined ? "" : answer.value;
    await db
      .insert(reviewAnswers)
      .values({
        orgId: review.orgId,
        reviewId: review.id,
        questionId: answer.questionId,
        value,
      })
      .onConflictDoUpdate({
        target: [reviewAnswers.reviewId, reviewAnswers.questionId],
        set: { value },
      });
  }

  const saved = await db.select().from(reviewAnswers).where(eq(reviewAnswers.reviewId, review.id));
  const byQuestion = new Map(allowedQuestions.map((row) => [row.id, row]));
  const scoreRows = await db
    .select({ slug: skills.slug, score: skillStates.score })
    .from(skillStates)
    .innerJoin(skills, eq(skills.id, skillStates.skillId))
    .where(and(eq(skillStates.orgId, review.orgId), eq(skillStates.membershipId, review.subjectMembershipId)));
  const knownSlugs = scoreRows.map((row) => row.slug);
  const priorBySlug = new Map(scoreRows.map((row) => [row.slug, Number(row.score)]));
  const subjectIdentity = await loadSubjectIdentity(review.subjectMembershipId);
  const coach = await loadSubjectIdentity(input.actor.membershipId);
  if (!subjectIdentity || !coach) throw new ReviewFlowError("not_found", 404);

  const summary = await summarizeMonthlyReview({
    aeName: subjectIdentity.name,
    monthOf: review.monthOf.toISOString(),
    director: { name: coach.name },
    answers: saved.map((row) => {
      const question = byQuestion.get(row.questionId);
      return {
        questionText: question?.text ?? "Review question",
        questionType: question?.questionType ?? "LONG_FORM",
        value: row.value,
        skillCategory: question?.category,
      };
    }),
    priorScores: scoreRows.map((row) => ({ category: row.slug, score: Number(row.score) })),
  });

  const scoresApplied: Array<{ skillSlug: string; score: number }> = [];
  for (const delta of summary.scoreDeltas ?? []) {
    const slug = resolveReviewSkillSlug(delta.category, knownSlugs);
    const score = slug ? adjustedScore(priorBySlug.get(slug) ?? 0, delta.delta) : null;
    if (!slug || score == null) continue;
    try {
      await applySkillScore({
        actor: coach,
        subject: subjectIdentity,
        skillSlug: slug,
        score,
        source: "monthly_review",
        notes: delta.rationale,
      });
      scoresApplied.push({ skillSlug: slug, score });
    } catch (error) {
      if (!(error instanceof SkillScoreError)) throw error;
    }
  }

  const written = [];
  for (const rec of summary.followUpRecommendations ?? []) {
    const row = followUpRecommendationRow({
      title: rec.title,
      description: rec.description,
      category: rec.category,
      routeTo: rec.routeTo ?? rec.route_to,
    });
    if (!row) continue;
    const [created] = await db
      .insert(recommendations)
      .values({
        orgId: review.orgId,
        subjectMembershipId: review.subjectMembershipId,
        source: row.source,
        category: row.category,
        routeTo: row.routeTo,
        channel: row.channel,
        title: row.title,
        body: row.body,
        status: row.status,
        sourceUnitIds: [],
      })
      .returning({ id: recommendations.id, title: recommendations.title, routeTo: recommendations.routeTo });
    if (created) written.push(created);
  }

  await db.update(reviews).set({ status: "submitted" }).where(eq(reviews.id, review.id));
  return { summary: summary.summary, scoresApplied, recommendations: written };
}
