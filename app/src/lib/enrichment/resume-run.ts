import { randomUUID } from "node:crypto";
import { completeJson, resolveModelFast } from "@/lib/ai/client";
import { getSql } from "@/lib/db/client";
import { applyGl2SqlIfConfigured } from "@/lib/gap-loop/gl2-sql";
import { logResearchCap, recordResearchSpend, researchSpendMicros } from "@/lib/gap-loop/store";
import type { ImportCandidate } from "./linkedin";
import { RESUME_MAX_OUTPUT_TOKENS, RESUME_SYSTEM, estimateResumeMicros, proposeResumeEntries } from "./resume";

async function orgIdFor(memberId: string, orgSlug: string) {
  const sql = getSql();
  const rows = orgSlug
    ? ((await sql`
        SELECT o.id AS org_id
        FROM memberships m
        JOIN organizations o ON o.id = m.org_id
        WHERE m.member_id = ${memberId} AND o.slug = ${orgSlug}
        LIMIT 1
      `) as { org_id: string }[])
    : ((await sql`
        SELECT o.id AS org_id
        FROM memberships m
        JOIN organizations o ON o.id = m.org_id
        WHERE m.member_id = ${memberId}
        LIMIT 1
      `) as { org_id: string }[]);
  return rows[0]?.org_id ?? "";
}

/**
 * Reads a non-LinkedIn resume into proposed entries. The person confirms them later.
 * Spend is reserved against the GL2 task and month caps before the model is called.
 */
export async function proposeResumeForMember(input: {
  memberId: string;
  orgSlug: string;
  adult: boolean;
  text: string;
}): Promise<{ ok: true; items: ImportCandidate[] } | { ok: false; error: string }> {
  if (!input.adult) return { ok: false, error: "adults_only" };
  const ready = await applyGl2SqlIfConfigured();
  if (!ready) return { ok: false, error: "spend_unscoped" };
  const orgId = await orgIdFor(input.memberId, input.orgSlug);
  if (!orgId) return { ok: false, error: "spend_unscoped" };
  const taskId = randomUUID();
  const spent = await researchSpendMicros(taskId);
  const estimate = estimateResumeMicros(input.text.trim());
  let proposed: Awaited<ReturnType<typeof proposeResumeEntries>>;
  try {
    proposed = await proposeResumeEntries({
      text: input.text,
      adult: true,
      taskMicros: spent.task,
      monthMicros: spent.month,
      complete: ({ system, user }) =>
        completeJson<unknown>({
          model: resolveModelFast(),
          system,
          user,
          temperature: 0,
          maxTokens: RESUME_MAX_OUTPUT_TOKENS,
          jobId: "resume-parse",
          orgId,
        }),
    });
  } catch {
    await recordResearchSpend(orgId, taskId, estimate, "resume_parse");
    logResearchCap({ taskId, stop: "resume_unreadable", usdMicros: estimate });
    return { ok: false, error: "resume_unreadable" };
  }
  if (!proposed.ok) {
    logResearchCap({ taskId, stop: proposed.error, usdMicros: estimate });
    return { ok: false, error: proposed.error };
  }
  if (proposed.called) {
    await recordResearchSpend(orgId, taskId, proposed.usdMicros, "resume_parse");
    logResearchCap({ taskId, stop: null, usdMicros: proposed.usdMicros });
  }
  return { ok: true, items: proposed.items };
}

export { RESUME_SYSTEM };
