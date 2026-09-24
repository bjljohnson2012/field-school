import { and, desc, eq } from "drizzle-orm";
import { assertCanAccessMember, assignableMembershipIds, type Actor, type CoachingWorld } from "@/lib/coaching/access";
import { getDb } from "@/lib/db/client";
import { members, memberships, questions, reviewAnswers, reviews } from "@/lib/db/schema";
import { onlyReviewCoach } from "@/app/coaching/reviews/policy";
import { ReviewFlowError } from "./submit";

const OPEN_STATUSES = new Set(["pending", "open"]);

function monthStart(value: unknown) {
  const date = typeof value === "string" && value.trim() ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

async function namesFor(orgId: string, ids: string[]) {
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return new Map<string, string>();
  const db = getDb();
  const rows = await db
    .select({ id: memberships.id, name: members.name })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(eq(memberships.orgId, orgId));
  return new Map(rows.filter((row) => unique.includes(row.id)).map((row) => [row.id, row.name]));
}

function reviewVisible(world: CoachingWorld, actor: Actor, row: { subjectMembershipId: string; coachMembershipId: string }) {
  if (row.coachMembershipId === actor.membershipId) return true;
  return Boolean(assertCanAccessMember(world, actor, row.subjectMembershipId));
}

export async function listPendingReviews(world: CoachingWorld, actor: Actor, subjectMembershipId?: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.orgId, actor.orgId))
    .orderBy(desc(reviews.monthOf));
  const visible = rows.filter((row) => {
    if (!OPEN_STATUSES.has(row.status)) return false;
    if (subjectMembershipId && row.subjectMembershipId !== subjectMembershipId) return false;
    return reviewVisible(world, actor, row);
  });
  const names = await namesFor(
    actor.orgId,
    visible.flatMap((row) => [row.subjectMembershipId, row.coachMembershipId]),
  );
  return visible.map((row) => ({
    id: row.id,
    subjectMembershipId: row.subjectMembershipId,
    subjectName: names.get(row.subjectMembershipId) || "Member",
    coachMembershipId: row.coachMembershipId,
    coachName: names.get(row.coachMembershipId) || "Coach",
    monthOf: row.monthOf.toISOString(),
    status: row.status,
    mine: onlyReviewCoach(row, actor.membershipId),
  }));
}

export async function reviewQuestions(orgId: string) {
  const db = getDb();
  const rows = await db.select().from(questions).orderBy(desc(questions.createdAt));
  return rows
    .filter((row) => {
      if (!row.active) return false;
      if (row.orgId !== orgId && row.orgId != null) return false;
      const tags = Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [];
      return row.category === "MONTHLY_REVIEW" || tags.includes("monthly_review");
    })
    .map((row) => ({
      id: row.id,
      text: row.text,
      questionType: row.questionType,
      category: row.category,
    }));
}

export async function loadReviewDetail(world: CoachingWorld, actor: Actor, reviewId: string) {
  const db = getDb();
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.orgId, actor.orgId)))
    .limit(1);
  if (!review || !reviewVisible(world, actor, review)) throw new ReviewFlowError("not_found", 404);
  const answers = await db.select().from(reviewAnswers).where(eq(reviewAnswers.reviewId, review.id));
  const bank = await reviewQuestions(actor.orgId);
  return {
    review: {
      id: review.id,
      status: review.status,
      monthOf: review.monthOf.toISOString(),
      subjectMembershipId: review.subjectMembershipId,
      coachMembershipId: review.coachMembershipId,
      mine: onlyReviewCoach(review, actor.membershipId),
    },
    questions: bank,
    answers: answers.map((row) => ({ questionId: row.questionId, value: row.value })),
  };
}

export async function subjectChoices(world: CoachingWorld, actor: Actor) {
  const ids = assignableMembershipIds(world, actor).filter((id) => id !== actor.membershipId);
  const names = await namesFor(actor.orgId, ids);
  return ids.map((id) => ({ id, name: names.get(id) || "Member" }));
}

export async function createPendingReview(world: CoachingWorld, actor: Actor, subjectMembershipId: string, monthOf: unknown) {
  if (!assertCanAccessMember(world, actor, subjectMembershipId)) throw new ReviewFlowError("forbidden", 403);
  const month = monthStart(monthOf);
  if (!month) throw new ReviewFlowError("invalid_body", 400);
  const db = getDb();
  const [created] = await db
    .insert(reviews)
    .values({
      orgId: actor.orgId,
      coachMembershipId: actor.membershipId,
      subjectMembershipId,
      monthOf: month,
      status: "pending",
    })
    .onConflictDoNothing({
      target: [reviews.orgId, reviews.coachMembershipId, reviews.subjectMembershipId, reviews.monthOf],
    })
    .returning();
  if (created) return created;
  const [existing] = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.orgId, actor.orgId),
        eq(reviews.coachMembershipId, actor.membershipId),
        eq(reviews.subjectMembershipId, subjectMembershipId),
        eq(reviews.monthOf, month),
      ),
    )
    .limit(1);
  if (!existing) throw new ReviewFlowError("review_unavailable", 500);
  return existing;
}

export async function openReview(world: CoachingWorld, actor: Actor, reviewId: string) {
  const db = getDb();
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.orgId, actor.orgId)))
    .limit(1);
  if (!review) throw new ReviewFlowError("not_found", 404);
  if (!onlyReviewCoach(review, actor.membershipId)) throw new ReviewFlowError("forbidden", 403);
  if (!assertCanAccessMember(world, actor, review.subjectMembershipId)) throw new ReviewFlowError("forbidden", 403);
  if (review.status === "submitted") throw new ReviewFlowError("review_closed", 409);
  if (review.status === "pending") {
    await db.update(reviews).set({ status: "open" }).where(eq(reviews.id, review.id));
  }
  return loadReviewDetail(world, actor, review.id);
}

export async function saveReviewAnswers(
  world: CoachingWorld,
  actor: Actor,
  reviewId: string,
  answers: Array<{ questionId: string; value: unknown }>,
) {
  const db = getDb();
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.orgId, actor.orgId)))
    .limit(1);
  if (!review) throw new ReviewFlowError("not_found", 404);
  if (!onlyReviewCoach(review, actor.membershipId)) throw new ReviewFlowError("forbidden", 403);
  if (!assertCanAccessMember(world, actor, review.subjectMembershipId)) throw new ReviewFlowError("forbidden", 403);
  if (review.status === "submitted") throw new ReviewFlowError("review_closed", 409);
  const bank = await reviewQuestions(actor.orgId);
  const allowed = new Set(bank.map((row) => row.id));
  for (const answer of answers) {
    if (!allowed.has(answer.questionId)) continue;
    const value = answer.value === undefined ? "" : answer.value;
    await db
      .insert(reviewAnswers)
      .values({ orgId: review.orgId, reviewId: review.id, questionId: answer.questionId, value })
      .onConflictDoUpdate({
        target: [reviewAnswers.reviewId, reviewAnswers.questionId],
        set: { value },
      });
  }
  if (review.status === "pending") {
    await db.update(reviews).set({ status: "open" }).where(eq(reviews.id, review.id));
  }
  return loadReviewDetail(world, actor, review.id);
}
