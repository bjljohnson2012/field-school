import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OPERATOR_ORG_SLUG = "field-school";
const PLATFORM_ADMIN = "platform_admin";

export function readCampusConst(source, name) {
  const match = source.match(new RegExp(`export const ${name} = "([^"]+)"`));
  if (!match) throw new Error(`${name} missing from campus.ts`);
  return match[1];
}

export function campusSource() {
  return readFileSync(join(here, "../src/lib/campus.ts"), "utf8");
}

export function deanEmail(source = campusSource()) {
  return readCampusConst(source, "DEAN_EMAIL");
}

export function deanName(source = campusSource()) {
  return readCampusConst(source, "DEAN_NAME");
}

export function operatorAdminPlan(email = deanEmail(), name = deanName()) {
  return {
    email,
    name,
    orgSlug: OPERATOR_ORG_SLUG,
    stance: "admin",
    capabilities: [PLATFORM_ADMIN],
  };
}

function invokedDirectly() {
  const arg = process.argv[1];
  if (!arg) return false;
  try {
    return realpathSync(arg) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

export async function applyOperatorAdmin(databaseUrl = process.env.DATABASE_URL?.trim() || "") {
  const plan = operatorAdminPlan();
  if (!databaseUrl) {
    console.log("seed-operator-admin: DATABASE_URL unset, no rows written");
    return plan;
  }
  const postgres = (await import("postgres")).default;
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await sql.begin(async (tx) => {
      const [member] = await tx`
        INSERT INTO members (email, name)
        VALUES (${plan.email}, ${plan.name})
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      const [org] = await tx`
        SELECT id FROM organizations WHERE slug = ${plan.orgSlug} LIMIT 1
      `;
      if (!org) throw new Error(`Missing org ${plan.orgSlug}`);
      const [membership] = await tx`
        INSERT INTO memberships (org_id, member_id, stance)
        VALUES (${org.id}, ${member.id}, ${plan.stance})
        ON CONFLICT (org_id, member_id) DO UPDATE SET stance = EXCLUDED.stance
        RETURNING id
      `;
      await tx`
        INSERT INTO membership_capabilities (membership_id, capability)
        VALUES (${membership.id}, ${PLATFORM_ADMIN})
        ON CONFLICT (membership_id, capability) DO NOTHING
      `;
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
  return plan;
}

if (invokedDirectly()) {
  applyOperatorAdmin().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
