import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export async function tenancyModules() {
  const base = pathToFileURL(join(here, "../src/lib/tenancy/"));
  const [testRows, backfill, script] = await Promise.all([
    import(new URL("test-rows.ts", base)),
    import(new URL("backfill.ts", base)),
    import(new URL("script.ts", base)),
  ]);
  return { testRows, backfill, script };
}

function ident(name) {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`bad_ident:${name}`);
  return `"${name}"`;
}

export async function openCampus(url) {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 1 });
  const orgs = await sql`SELECT id, slug, name, kind FROM organizations`;
  const members = await sql`SELECT id, email, name, kind, auth_user_id FROM members`;
  const credentials = await sql`SELECT member_id FROM member_credentials`.catch(() => []);
  const memberships = await sql`SELECT id, org_id, member_id, stance FROM memberships`;
  const wards = await sql`
    SELECT org_id, guardian_membership_id, child_membership_id FROM wards
  `.catch(() => []);
  const invites = await sql`
    SELECT org_id, email, status, invited_by_membership_id FROM invites
  `.catch(() => []);
  const credentialIds = new Set(credentials.map((row) => row.member_id));
  return {
    sql,
    orgs: orgs.map((row) => ({ id: row.id, slug: row.slug, name: row.name, kind: row.kind })),
    members: members.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      kind: row.kind,
      authUserId: row.auth_user_id,
      hasCredential: credentialIds.has(row.id),
    })),
    memberships: memberships.map((row) => ({
      id: row.id,
      orgId: row.org_id,
      memberId: row.member_id,
      stance: row.stance,
    })),
    wards: wards.map((row) => ({
      orgId: row.org_id,
      guardianMembershipId: row.guardian_membership_id,
      childMembershipId: row.child_membership_id,
    })),
    invites: invites.map((row) => ({
      orgId: row.org_id,
      email: row.email,
      status: row.status,
      invitedByMembershipId: row.invited_by_membership_id,
    })),
  };
}

export async function countTestRowTables(sql, plan, deleteOrder) {
  const rows = await sql`
    SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name IN ('members', 'memberships', 'organizations')
  `;
  const grouped = new Map();
  for (const row of rows) {
    const list = grouped.get(row.table_name) ?? [];
    list.push({ column: row.column_name, foreign: row.foreign_table });
    grouped.set(row.table_name, list);
  }
  const order = deleteOrder(
    [...grouped.keys()],
    rows.map((row) => ({ from: row.table_name, to: row.foreign_table })),
  );
  const counts = [];
  for (const table of order) {
    const clauses = [];
    const params = [];
    for (const edge of grouped.get(table) ?? []) {
      const ids =
        edge.foreign === "members"
          ? plan.deleteMemberIds
          : edge.foreign === "memberships"
            ? plan.deleteMembershipIds
            : plan.deleteOrgIds;
      if (!ids.length) continue;
      params.push(ids);
      clauses.push(`${ident(edge.column)} = ANY($${params.length}::uuid[])`);
    }
    if (!clauses.length) {
      counts.push({ table, count: 0 });
      continue;
    }
    const [row] = await sql.unsafe(
      `SELECT count(*)::int AS n FROM ${ident(table)} WHERE ${clauses.join(" OR ")}`,
      params,
    );
    counts.push({ table, count: Number(row?.n ?? 0) });
  }
  return counts;
}

const CORE_TABLES = new Set(["members", "memberships", "organizations"]);

export async function applyTestRowPlan(sql, plan, deleteOrder) {
  await sql.begin(async (tx) => {
    if (plan.deleteMemberIds.length) {
      await tx`
        UPDATE organizations
        SET created_by = NULL
        WHERE created_by = ANY(${plan.deleteMemberIds}::uuid[])
      `;
    }
    const edges = await tx`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name IN ('members', 'memberships', 'organizations')
    `;
    const grouped = new Map();
    for (const row of edges) {
      if (CORE_TABLES.has(row.table_name)) continue;
      const list = grouped.get(row.table_name) ?? [];
      list.push(row);
      grouped.set(row.table_name, list);
    }
    const order = deleteOrder(
      [...grouped.keys()],
      edges
        .filter((row) => !CORE_TABLES.has(row.table_name) && !CORE_TABLES.has(row.foreign_table))
        .map((row) => ({ from: row.table_name, to: row.foreign_table })),
    );
    for (const table of order) {
      const clauses = [];
      const params = [];
      for (const edge of grouped.get(table) ?? []) {
        const ids =
          edge.foreign_table === "members"
            ? plan.deleteMemberIds
            : edge.foreign_table === "memberships"
              ? plan.deleteMembershipIds
              : plan.deleteOrgIds;
        if (!ids.length) continue;
        params.push(ids);
        clauses.push(`${ident(edge.column_name)} = ANY($${params.length}::uuid[])`);
      }
      if (!clauses.length) continue;
      await tx.unsafe(`DELETE FROM ${ident(table)} WHERE ${clauses.join(" OR ")}`, params);
    }
    if (plan.deleteMembershipIds.length) {
      await tx`DELETE FROM memberships WHERE id = ANY(${plan.deleteMembershipIds}::uuid[])`;
    }
    if (plan.deleteOrgIds.length) {
      await tx`
        DELETE FROM organizations
        WHERE id = ANY(${plan.deleteOrgIds}::uuid[])
          AND slug NOT IN ('field-school', 'household', 'sales')
      `;
    }
    if (plan.deleteMemberIds.length) {
      await tx`DELETE FROM members WHERE id = ANY(${plan.deleteMemberIds}::uuid[])`;
    }
  });
}

export async function applyBackfillPlan(sql, plan) {
  await sql.begin(async (tx) => {
    for (const move of [...plan.families, ...plan.teams]) {
      await tx`
        INSERT INTO organizations (slug, name, kind, isolation, homeschool_mode, created_by)
        VALUES (
          ${move.slug},
          ${move.name},
          ${move.kind},
          ${move.isolation},
          ${move.homeschoolMode},
          ${move.createdBy}
        )
        ON CONFLICT (slug) DO NOTHING
      `;
      await tx`
        INSERT INTO memberships (org_id, member_id, stance)
        SELECT id, ${move.ownerMemberId}, 'owner'
        FROM organizations
        WHERE slug = ${move.slug}
        ON CONFLICT (org_id, member_id) DO NOTHING
      `;
      for (const learnerId of move.learnerMemberIds) {
        await tx`
          INSERT INTO memberships (org_id, member_id, stance)
          SELECT id, ${learnerId}, 'learner'
          FROM organizations
          WHERE slug = ${move.slug}
          ON CONFLICT (org_id, member_id) DO NOTHING
        `;
      }
    }
    for (const move of plan.families) {
      for (const learnerId of move.learnerMemberIds) {
        await tx`
          INSERT INTO wards (org_id, guardian_membership_id, child_membership_id)
          SELECT o.id, owner_row.id, learner_row.id
          FROM organizations o
          JOIN memberships owner_row
            ON owner_row.org_id = o.id AND owner_row.member_id = ${move.ownerMemberId}
          JOIN memberships learner_row
            ON learner_row.org_id = o.id AND learner_row.member_id = ${learnerId}
          WHERE o.slug = ${move.slug}
          ON CONFLICT (org_id, guardian_membership_id, child_membership_id) DO NOTHING
        `;
      }
    }
  });
}
