import { getSql } from "../db/client.ts";
import { ADULT_GATES, type AdultGateId } from "./model.ts";

export { mergeGateMark, mergeGateSpan } from "./gate-mark.ts";

function knownGate(id: AdultGateId) {
  if (!ADULT_GATES.some((gate) => gate.id === id)) throw new Error("bad_gate");
}

/**
 * One UPDATE. The row lock applies this expression to the gates JSON already stored,
 * so a second gate id cannot erase the first.
 */
export async function writeGateMerge(
  memberId: string,
  id: AdultGateId,
  firstAt: string,
  lastAt: string,
  now: Date,
) {
  knownGate(id);
  const path = `{${id}}`;
  const sql = getSql();
  await sql`
    UPDATE user_profiles
    SET gates = CASE
      WHEN COALESCE(gates, '{}'::jsonb) ? ${id} THEN jsonb_set(
        COALESCE(gates, '{}'::jsonb),
        ${path}::text[],
        jsonb_build_object(
          'firstAt', CASE
            WHEN COALESCE(gates, '{}'::jsonb) -> ${id} ->> 'firstAt' IS NULL THEN ${firstAt}
            ELSE LEAST(COALESCE(gates, '{}'::jsonb) -> ${id} ->> 'firstAt', ${firstAt})
          END,
          'lastAt', CASE
            WHEN COALESCE(gates, '{}'::jsonb) -> ${id} ->> 'lastAt' IS NULL THEN ${lastAt}
            ELSE GREATEST(COALESCE(gates, '{}'::jsonb) -> ${id} ->> 'lastAt', ${lastAt})
          END
        ),
        true
      )
      ELSE COALESCE(gates, '{}'::jsonb) || jsonb_build_object(
        ${id},
        jsonb_build_object('firstAt', ${firstAt}, 'lastAt', ${lastAt})
      )
    END,
    updated_at = ${now}
    WHERE member_id = ${memberId}
  `;
}
