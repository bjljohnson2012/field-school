import { after } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { resolveSynthModel } from "@/lib/ai/client";
import { synthesizeDirectorProfile, synthesizeProfile } from "@/lib/ai/prompts/synthesis";
import { recordEvent } from "@/lib/campus-runtime/events";
import {
  recommendationsForInsert,
  skillSlugForCategory,
  type RecommendationDraft,
} from "@/lib/coaching/intercalate";
import { SkillScoreError, applySkillScore, loadSubjectIdentity } from "@/lib/coaching/scores";
import { getDb } from "@/lib/db/client";
import {
  answerSets,
  answers,
  coachingProfiles,
  organizations,
  products,
  questions,
  recommendations,
  skills,
} from "@/lib/db/schema";

const SYNTHESIS_BUDGET_MS = 55_000;

type Features = {
  aiModel?: string | null;
  values?: unknown;
  salesMethodology?: string | null;
  requiredSkills?: Array<{ category: string; weight: number }>;
};

function textOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function readRecommendations(synth: object): RecommendationDraft[] {
  const recs = (synth as { recommendations?: unknown }).recommendations;
  return Array.isArray(recs) ? (recs as RecommendationDraft[]) : [];
}

async function markFailed(orgId: string, membershipId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "synthesis_failed";
  const db = getDb();
  await db
    .update(coachingProfiles)
    .set({
      synthesisStatus: "failed",
      synthesisError: message.slice(0, 2000),
      updatedAt: new Date(),
    })
    .where(and(eq(coachingProfiles.orgId, orgId), eq(coachingProfiles.membershipId, membershipId)));
}

export async function runIntakeSynthesis(answerSetId: string) {
  const db = getDb();
  const [set] = await db.select().from(answerSets).where(eq(answerSets.id, answerSetId)).limit(1);
  if (!set) return;
  const started = Date.now();
  let model: string | null = null;
  try {
    const subject = await loadSubjectIdentity(set.membershipId);
    if (!subject || subject.orgId !== set.orgId) throw new Error("missing_subject");
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, set.orgId))
      .limit(1);
    if (!org) throw new Error("missing_org");
    const features = (org.features ?? {}) as Features;
    const answerRows = await db.select().from(answers).where(eq(answers.answerSetId, set.id));
    const questionIds = answerRows.map((row) => row.questionId);
    const questionRows = questionIds.length
      ? await db.select().from(questions).where(inArray(questions.id, questionIds))
      : [];
    const questionById = new Map(questionRows.map((row) => [row.id, row]));
    const packed = answerRows.flatMap((row) => {
      const question = questionById.get(row.questionId);
      if (!question) return [];
      return [
        {
          category: question.category,
          tags: stringList(question.tags),
          questionText: question.text,
          questionType: question.questionType,
          value: row.value,
        },
      ];
    });
    const skillRows = await db.select().from(skills).where(eq(skills.orgId, set.orgId));
    const skillRubrics: Record<string, string> = {};
    for (const skill of skillRows) {
      const rubric = skill.rubric as { whatGoodLooksLike?: unknown } | null;
      const category = Object.entries({
        "coaching-discovery": "DISCOVERY",
        "objection-handling": "OBJECTION_HANDLING",
        closing: "CLOSING",
        communication: "COMMUNICATION",
        resilience: "RESILIENCE",
        "product-mastery": "PRODUCT_MASTERY",
        leadership: "LEADERSHIP",
        forecasting: "FORECASTING",
      }).find(([slug]) => slug === skill.slug)?.[1];
      if (category && typeof rubric?.whatGoodLooksLike === "string" && rubric.whatGoodLooksLike.trim()) {
        skillRubrics[category] = rubric.whatGoodLooksLike;
      }
    }
    const productRows = await db
      .select()
      .from(products)
      .where(and(eq(products.orgId, set.orgId), eq(products.active, true)));
    const opts = {
      skillRubrics: Object.keys(skillRubrics).length ? skillRubrics : undefined,
      aiModel: features.aiModel ?? null,
    };
    model = resolveSynthModel(features.aiModel);
    const synth =
      set.kind === "director_intake"
        ? await synthesizeDirectorProfile(
            {
              directorName: subject.name,
              companyContext: {
                name: org.name,
                salesMethodology: features.salesMethodology ?? undefined,
              },
              answers: packed,
            },
            opts,
          )
        : await synthesizeProfile(
            {
              aeName: subject.name,
              companyContext: {
                name: org.name,
                requiredSkills: Array.isArray(features.requiredSkills) ? features.requiredSkills : [],
                products: productRows.map((row) => ({
                  name: row.name,
                  summary: row.summary ?? undefined,
                })),
                values: stringList(features.values),
                salesMethodology: features.salesMethodology ?? undefined,
              },
              answers: packed,
            },
            opts,
          );

    const motivations = stringList(synth.motivations);
    const strengths = stringList(synth.strengths);
    const weaknesses = stringList(synth.weaknesses);
    const scores = Array.isArray(synth.skillScores) ? synth.skillScores : [];
    const personality = textOrEmpty(
      "personalitySummary" in synth ? synth.personalitySummary : "",
    );
    const salesStyle = textOrEmpty(
      "salesStyleSummary" in synth ? synth.salesStyleSummary : "",
    );
    const communication = textOrEmpty(
      "communicationSummary" in synth ? synth.communicationSummary : "",
    );
    const leadership = textOrEmpty(
      "leadershipSummary" in synth ? synth.leadershipSummary : "",
    );
    const forecasting = textOrEmpty(
      "forecastingSummary" in synth ? synth.forecastingSummary : "",
    );
    const hasNarrative = [personality, salesStyle, communication, leadership, forecasting].some(
      (value) => value.trim() !== "",
    );
    if (!hasNarrative && motivations.length + strengths.length + weaknesses.length === 0 && scores.length === 0) {
      throw new Error("empty_synthesis");
    }

    const recommendationRows = recommendationsForInsert(readRecommendations(synth));
    if (recommendationRows.length) {
      await db.insert(recommendations).values(
        recommendationRows.map((row) => ({
          orgId: set.orgId,
          subjectMembershipId: set.membershipId,
          source: row.source,
          category: row.category,
          routeTo: row.routeTo,
          channel: row.channel,
          title: row.title,
          body: row.body,
          status: row.status,
          sourceUnitIds: row.sourceUnitIds,
        })),
      );
    }

    for (const score of scores) {
      const slug = skillSlugForCategory(String(score.category ?? ""));
      const numeric = Number(score.score);
      if (!slug || !Number.isFinite(numeric)) continue;
      try {
        await applySkillScore({
          actor: subject,
          subject,
          skillSlug: slug,
          score: Math.max(0, Math.min(100, numeric)),
          source: "ai",
          notes: typeof score.notes === "string" ? score.notes : undefined,
        });
      } catch (error) {
        if (error instanceof SkillScoreError) continue;
        throw error;
      }
    }

    await recordEvent(
      subject,
      {
        kind: "diagnostic",
        objectType: "assessment",
        objectId: set.id,
        raw: { kind: set.kind },
      },
      { membershipId: subject.membershipId, stance: subject.stance },
    );

    await db
      .update(coachingProfiles)
      .set({
        personalitySummary: personality || null,
        ...(set.kind === "director_intake"
          ? {
              leadershipSummary: leadership || null,
              forecastingSummary: forecasting || null,
            }
          : {
              salesStyleSummary: salesStyle || null,
              communicationSummary: communication || null,
            }),
        motivations,
        strengths,
        weaknesses,
        enneagramType: textOrEmpty(synth.enneagramType) || null,
        discProfile: textOrEmpty(synth.discProfile) || null,
        mbtiType: textOrEmpty(synth.mbtiType) || null,
        synthesisStatus: "ready",
        synthesisError: null,
        lastSynthesizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(coachingProfiles.orgId, set.orgId), eq(coachingProfiles.membershipId, set.membershipId)));

    console.info(
      JSON.stringify({
        event: "coaching.synthesis",
        jobId: set.id,
        orgId: set.orgId,
        model,
        status: "ready",
        latencyMs: Date.now() - started,
      }),
    );
  } catch (error) {
    console.info(
      JSON.stringify({
        event: "coaching.synthesis",
        jobId: answerSetId,
        orgId: set.orgId,
        model,
        status: "failed",
        latencyMs: Date.now() - started,
      }),
    );
    try {
      await markFailed(set.orgId, set.membershipId, error);
    } catch {
      /* status row stays generating; the poll can restart it once it is stale */
    }
  }
}

export function enqueueIntakeSynthesis(answerSetId: string) {
  const work = () => runIntakeSynthesis(answerSetId);
  try {
    after(work);
  } catch {
    void Promise.race([work(), new Promise((resolve) => setTimeout(resolve, SYNTHESIS_BUDGET_MS))]);
  }
}
