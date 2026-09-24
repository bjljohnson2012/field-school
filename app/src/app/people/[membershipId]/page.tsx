import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SkillCard, type SkillCardSkill } from "@/components/skill-card";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import {
  cardSkillsForOrg,
  personSurface,
  toPersonDto,
  type CardSkill,
} from "@/lib/campus-runtime/lessons";
import { assertCanAccessMember, type Actor } from "@/lib/coaching/access";
import { loadCoachingWorld, loadSubjectIdentity } from "@/lib/coaching/scores";
import { getDb } from "@/lib/db/client";
import {
  coachingNotes,
  coachingProfiles,
  recommendations,
  skillStates,
  skills,
} from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Person" };

function asHints(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function synthesisOf(status: string | null | undefined) {
  if (status === "generating" || status === "ready" || status === "failed") return status;
  return "idle" as const;
}

function showScore(skill: CardSkill, surface: "card" | "coach", subjectStance: string) {
  if (skill.audience !== "coach") return true;
  if (surface === "coach") return true;
  return subjectStance === "coach" || subjectStance === "leader" || subjectStance === "admin";
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const auth = await identityFromRequest();
  if (!auth.ok) redirect(`/login?next=/people/${membershipId}`);

  const subject = await loadSubjectIdentity(membershipId);
  const actor: Actor = {
    memberId: auth.identity.memberId,
    membershipId: auth.identity.membershipId,
    orgId: auth.identity.orgId,
    stance: auth.identity.stance,
  };
  const world = await loadCoachingWorld(actor);
  const allowed = subject ? assertCanAccessMember(world, actor, subject.membershipId) : null;
  if (!subject || !allowed) {
    return (
      <main>
        <h1 className="font-display text-3xl tracking-tight">Not allowed</h1>
      </main>
    );
  }

  const surface = personSurface(auth.identity.membershipId, subject.membershipId);
  const db = getDb();
  const stateRows = await db
    .select({
      slug: skills.slug,
      score: skillStates.score,
      raw: skillStates.raw,
    })
    .from(skillStates)
    .innerJoin(skills, eq(skills.id, skillStates.skillId))
    .where(
      and(eq(skillStates.orgId, subject.orgId), eq(skillStates.membershipId, subject.membershipId)),
    );

  const bySlug = new Map(stateRows.map((row) => [row.slug, row]));
  const scoreTiles: SkillCardSkill[] = cardSkillsForOrg(subject.orgSlug)
    .filter((skill) => showScore(skill, surface, subject.stance))
    .map((skill) => {
      const state = bySlug.get(skill.slug);
      const raw = (state?.raw ?? null) as { source?: unknown } | null;
      const source = raw && typeof raw.source === "string" ? raw.source : null;
      return {
        slug: skill.slug,
        name: skill.name,
        score: state?.score == null ? null : Number(state.score),
        scale: skill.scale,
        source: skill.scale === "0-100" ? source : null,
      };
    });

  const [profile] = await db
    .select()
    .from(coachingProfiles)
    .where(
      and(
        eq(coachingProfiles.orgId, subject.orgId),
        eq(coachingProfiles.membershipId, subject.membershipId),
      ),
    )
    .limit(1);
  const noteRows = await db
    .select()
    .from(coachingNotes)
    .where(
      and(
        eq(coachingNotes.orgId, subject.orgId),
        eq(coachingNotes.subjectMembershipId, subject.membershipId),
      ),
    );
  const recRows = await db
    .select()
    .from(recommendations)
    .where(
      and(
        eq(recommendations.orgId, subject.orgId),
        eq(recommendations.subjectMembershipId, subject.membershipId),
        eq(recommendations.routeTo, "learner"),
      ),
    );

  const visibleNotes = noteRows.filter((row) => row.visibleToLearner);
  const coachHints = asHints(profile?.coachingHints);
  const dto = toPersonDto(
    surface,
    {
      membershipId: subject.membershipId,
      displayName: subject.name,
      synthesis: synthesisOf(profile?.synthesisStatus),
      scores: scoreTiles.map((skill) => ({
        slug: skill.slug,
        name: skill.name,
        score: skill.score,
        scale: skill.scale,
      })),
      narratives: {
        personality: profile?.personalitySummary ?? null,
        salesStyle: profile?.salesStyleSummary ?? null,
        communication: profile?.communicationSummary ?? null,
      },
      types: {
        enneagram: profile?.enneagramType ?? null,
        disc: profile?.discProfile ?? null,
        mbti: profile?.mbtiType ?? null,
      },
      recommendations: recRows.map((row) => ({ id: row.id, title: row.title, body: row.body })),
      notes: visibleNotes.map((row) => ({
        id: row.id,
        body: row.body,
        at: row.createdAt.toISOString(),
      })),
    },
    {
      hints: coachHints,
      reasoning: profile?.reasoningSummary ?? null,
      hiddenNoteCount: noteRows.filter((row) => !row.visibleToLearner).length,
    },
  );
  const hints: string[] =
    surface === "coach" && "hints" in dto && Array.isArray(dto.hints)
      ? dto.hints.filter((item): item is string => typeof item === "string")
      : [];

  return (
    <main data-surface={surface}>
      <p className="eyebrow">{subject.stance}</p>
      <h1 className="font-display text-3xl tracking-tight">{dto.displayName}</h1>
      {surface === "coach" ? (
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Person">
          <span
            role="tab"
            aria-selected="true"
            className="rounded-brand bg-primary px-3 py-1.5 text-sm font-semibold text-white"
          >
            Card
          </span>
          <a
            href={`/people/${subject.membershipId}/notes`}
            className="rounded-brand px-3 py-1.5 text-sm font-semibold text-muted-foreground"
          >
            Notes
          </a>
          <a
            href={`/people/${subject.membershipId}/plan`}
            className="rounded-brand px-3 py-1.5 text-sm font-semibold text-muted-foreground"
          >
            Plan
          </a>
          <a
            href={`/people/${subject.membershipId}/prep`}
            className="rounded-brand px-3 py-1.5 text-sm font-semibold text-muted-foreground"
          >
            1:1 prep
          </a>
          <span className="rounded-brand px-3 py-1.5 text-sm font-semibold text-muted-foreground">Tasks</span>
          <a
            href={`/coaching/reviews?subject=${subject.membershipId}`}
            className="rounded-brand px-3 py-1.5 text-sm font-semibold text-muted-foreground"
          >
            Reviews
          </a>
          <a
            href={`/coaching/files?subject=${subject.membershipId}`}
            className="rounded-brand px-3 py-1.5 text-sm font-semibold text-muted-foreground"
          >Files</a>
        </div>
      ) : null}
      <div className="mt-6">
        <SkillCard skills={scoreTiles} />
      </div>
      {hints.length && subject.orgSlug !== "household" ? (
        <section className="mt-8">
          <h2 className="h-section">Hints</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
