import { randomBytes, randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RESERVED_SLUGS = ["sales", "household", "field-school"];
const ROLE_MARKER_FILES = new Set(["COMPANY_ADMIN", "DIRECTOR", "VP_SALES"]);
const UPLOAD_ROOT = "/opt/field-school/uploads";

const SKILLS = [
  ["DISCOVERY", "coaching-discovery", "Discovery", "learner"],
  ["OBJECTION_HANDLING", "objection-handling", "Objection handling", "learner"],
  ["CLOSING", "closing", "Closing", "learner"],
  ["COMMUNICATION", "communication", "Communication", "learner"],
  ["RESILIENCE", "resilience", "Resilience", "learner"],
  ["PRODUCT_MASTERY", "product-mastery", "Product mastery", "learner"],
  ["LEADERSHIP", "leadership", "Leadership", "coach"],
  ["FORECASTING", "forecasting", "Forecasting", "coach"],
];

const SKILL_BY_CATEGORY = new Map(SKILLS.map(([category, slug, name, audience]) => [category, { slug, name, audience }]));

export const SOURCE_QUERIES = [
  ["orgs", `SELECT id, name, slug, brand_logo_url, ai_model, status, created_at, updated_at FROM orgs`],
  ["users", `SELECT id, email, name, password_hash, role, status, org_id, vp_id, created_at, updated_at FROM users`],
  ["invite_tokens", `SELECT id, user_id, expires_at, used_at, created_at FROM invite_tokens`],
  ["director_assignments", `SELECT id, director_id, org_id, created_at FROM director_assignments`],
  ["company_profiles", `SELECT org_id, required_skills, values, sales_methodology, improve_button_label, created_at, updated_at FROM company_profiles`],
  ["products", `SELECT id, org_id, name, slug, summary, audience, active, created_at, updated_at FROM products`],
  ["questions", `SELECT id, org_id, product_id, category, question_type, text, options_json, tags_json, weight, active, author_user_id, created_at, updated_at FROM questions`],
  ["answer_sets", `SELECT id, ae_profile_id, director_profile_id, version, status, resume_index, question_order, started_at, completed_at FROM answer_sets`],
  ["answers", `SELECT id, answer_set_id, question_id, value, created_at, updated_at FROM answers`],
  ["ae_profiles", `SELECT id, user_id, org_id, director_id, personality_summary, sales_style_summary, communication_summary, motivations, strengths_json, weaknesses_json, enneagram_type, disc_profile, mbti_type, coaching_hints_json, reasoning_summary, synthesis_status, synthesis_error, synthesis_started_at, last_synthesized_at, created_at, updated_at FROM ae_profiles`],
  ["director_profiles", `SELECT id, user_id, org_id, personality_summary, leadership_summary, forecasting_summary, motivations, strengths_json, weaknesses_json, enneagram_type, disc_profile, mbti_type, coaching_hints_json, reasoning_summary, synthesis_status, synthesis_error, synthesis_started_at, last_synthesized_at, created_at, updated_at FROM director_profiles`],
  ["skill_scores", `SELECT id, ae_profile_id, category, score, notes, source, last_updated_by_user_id, last_updated_at, created_at FROM skill_scores`],
  ["director_skill_scores", `SELECT id, director_profile_id, category, score, notes, source, last_updated_at, created_at FROM director_skill_scores`],
  ["skill_score_history", `SELECT id, ae_profile_id, category, score, source, recorded_at FROM skill_score_history`],
  ["coaching_notes", `SELECT id, ae_profile_id, director_id, content, visible_to_ae, created_at, updated_at FROM coaching_notes`],
  ["prep_docs", `SELECT id, ae_profile_id, director_id, content, created_at FROM prep_docs`],
  ["cross_ref_analyses", `SELECT id, prep_doc_id, ae_profile_id, recommendations_json, talking_points_json, raw_output, generated_at FROM cross_ref_analyses`],
  ["plans", `SELECT id, ae_profile_id, year, quarter, focus_areas_json, milestones_json, status, created_at, updated_at FROM plans`],
  ["recommendations", `SELECT id, ae_profile_id, source, category, route_to, channel, title, description, status, source_article_ids, created_at, updated_at FROM recommendations`],
  ["tasks", `SELECT id, ae_profile_id, assignee_user_id, created_by_user_id, title, description, status, due_at, completed_at, created_at FROM tasks`],
  ["quarterly_performance", `SELECT id, ae_profile_id, year, quarter, quota_cents, attained_cents, notes, created_at, updated_at FROM quarterly_performance`],
  ["quiz_retake_requests", `SELECT id, requester_user_id, ad_hoc_quiz_id, answer_set_id, status, created_at FROM quiz_retake_requests`],
  ["recurring_quiz_schedules", `SELECT id, ae_profile_id, director_profile_id, active, cadence, next_run_at, created_at, updated_at FROM recurring_quiz_schedules`],
  ["ad_hoc_quizzes", `SELECT id, ae_profile_id, director_profile_id, sent_by_user_id, title, question_ids, token_hash, status, answer_set_id, created_at FROM ad_hoc_quizzes`],
  ["one_on_one_preps", `SELECT id, ae_profile_id, director_profile_id, prepared_by_user_id, prep_doc_text, generated_json, model_used, status, error_message, created_at FROM one_on_one_preps`],
  ["coaching_plans", `SELECT id, ae_profile_id, director_profile_id, built_by_user_id, generated_json, model_used, status, error_message, read_by_json, created_at FROM coaching_plans`],
  ["org_skill_benchmarks", `SELECT id, org_id, category, what_good_looks_like, custom_notes, created_at, updated_at FROM org_skill_benchmarks`],
  ["org_skill_benchmark_files", `SELECT id, benchmark_id, filename, storage_path, text_preview, uploaded_by_user_id, created_at FROM org_skill_benchmark_files`],
  ["game_attempts", `SELECT id, user_id, org_id, skill_category, prompt, user_response, ai_score, points_awarded, status, started_at FROM game_attempts`],
  ["director_reviews", `SELECT id, director_id, ae_profile_id, month_of, status, created_at FROM director_reviews`],
  ["director_review_answers", `SELECT id, director_review_id, question_id, value, score_deltas_json, created_at FROM director_review_answers`],
  ["file_assets", `SELECT id, org_id, owner_user_id, filename, storage_path, mime_type, size_bytes, visibility, mapping_id, created_at FROM file_assets`],
  ["file_mappings", `SELECT id, org_id, mapped_by_user_id, kind, update_intent, visibility, ai_suggested_kind, ai_suggested_intent, ai_confidence, ai_rationale, confirmed_at, created_at FROM file_mappings`],
  ["knowledge_repositories", `SELECT id, org_id, kind, name, visibility, created_at, updated_at FROM knowledge_repositories`],
  ["knowledge_articles", `SELECT id, org_id, repository_id, product_id, skill_category, title, body, tags_json, author_user_id, status, approved_by_user_id, embedding, created_at, updated_at FROM knowledge_articles`],
  ["audit_logs", `SELECT id, org_id, actor_user_id, action, target_type, target_id, metadata, created_at FROM audit_logs`],
];

export class ImportRefusal extends Error {
  constructor(code) {
    super(code);
    this.name = "ImportRefusal";
    this.code = code;
  }
}

export class DryRunRollback extends Error {
  constructor() {
    super("dry_run_rollback");
    this.name = "DryRunRollback";
    this.code = "dry_run_rollback";
  }
}

export function assertCoachingImport(env) {
  if (env.COACHING_IMPORT !== "1") throw new ImportRefusal("coaching_import_required");
}

export function databaseName(url) {
  let pathname = "";
  try {
    pathname = new URL(String(url).trim().replace(/^postgres(ql)?:/i, "http:")).pathname;
  } catch {
    throw new ImportRefusal("destination_url_unusable");
  }
  const name = decodeURIComponent(pathname.replace(/^\//, "").split("/")[0] || "");
  if (!name) throw new ImportRefusal("destination_name_missing");
  return name;
}

export function assertDestinationDatabase(url) {
  if (databaseName(url) === "aecoach") throw new ImportRefusal("destination_is_aecoach");
}

export function assertReadOnly(text) {
  if (/^\s*(insert|update|delete|drop|alter|truncate|create|grant|copy)\b/i.test(text)) {
    throw new ImportRefusal("source_write_refused");
  }
}

export function assertDestStatement(text) {
  const sql = String(text);
  if (/^\s*delete\b/i.test(sql)) throw new ImportRefusal("dest_delete_refused");
  if (/campus-store|smtp_pass|brand_palette|recheck_cadence/i.test(sql)) {
    throw new ImportRefusal("dest_secret_refused");
  }
  if (/^\s*update\b/i.test(sql) && /\b(household|field-school)\b/i.test(sql)) {
    throw new ImportRefusal("reserved_org_update_refused");
  }
}

export function validateOrgMap(parsed) {
  if (!Array.isArray(parsed)) throw new ImportRefusal("org_map_invalid");
  const seen = new Set();
  const map = [];
  for (const entry of parsed) {
    if (!entry || typeof entry.from !== "string" || !entry.from.trim()) {
      throw new ImportRefusal("org_map_invalid");
    }
    const from = entry.from.trim();
    if (seen.has(from)) throw new ImportRefusal("org_map_duplicate");
    seen.add(from);
    if (entry.to === "household" || entry.to === "field-school") {
      throw new ImportRefusal("org_map_reserved_target");
    }
    if (entry.to !== "sales") throw new ImportRefusal("org_map_target");
    map.push({ from, to: "sales" });
  }
  return map;
}

export function readOrgMapText(text) {
  return validateOrgMap(JSON.parse(text));
}

export function planOrgPlacement({ sourceSlug, map, existingSlugs }) {
  const entry = map.find((row) => row.from === sourceSlug);
  if (entry) return { mode: "merge", slug: "sales", sourceSlug, collided: false };
  const taken = RESERVED_SLUGS.includes(sourceSlug) || existingSlugs.has(sourceSlug);
  if (taken) return { mode: "create", slug: `${sourceSlug}-aecoach`, sourceSlug, collided: true };
  return { mode: "create", slug: sourceSlug, sourceSlug, collided: false };
}

export function httpsUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function mapVisibility(value) {
  if (value === "AE_ONLY") return "learner";
  if (value === "DIRECTOR_ONLY") return "coach";
  if (value === "BOTH") return "both";
  return null;
}

export function fileSkipReason(filename, sizeBytes) {
  const base = String(filename || "").split(/[/\\]/).pop() || "";
  if (base.endsWith(".bak")) return "bak";
  if (ROLE_MARKER_FILES.has(base) && (sizeBytes === 0 || sizeBytes == null)) return "role_marker";
  if (/api[_-]?key|secret|session/i.test(base)) return "secret_file";
  return null;
}

export function stanceForRole(role) {
  if (role === "DIRECTOR") return { stance: "coach", capabilities: ["coach"] };
  if (role === "VP_SALES") return { stance: "leader", capabilities: ["leader"] };
  if (role === "COMPANY_ADMIN") return { stance: "admin", capabilities: ["admin"] };
  if (role === "ORG_ADMIN") return { stance: "learner", capabilities: [] };
  return { stance: "learner", capabilities: ["learner"] };
}

export function assignTaskMemberships({ assigneeMembershipId, profileMembershipId }) {
  if (assigneeMembershipId && profileMembershipId && assigneeMembershipId !== profileMembershipId) {
    return { assigneeMembershipId, subjectMembershipId: profileMembershipId };
  }
  if (assigneeMembershipId) return { assigneeMembershipId, subjectMembershipId: null };
  if (profileMembershipId) {
    return { assigneeMembershipId: profileMembershipId, subjectMembershipId: profileMembershipId };
  }
  return null;
}

export function renderImportReport(counts) {
  return Object.keys(counts)
    .sort()
    .map((table) => {
      const row = counts[table];
      return `coaching.import table=${table} source=${row.source} dest=${row.dest} skipped=${row.skipped}`;
    })
    .join("\n");
}

export function rollbackConfirm(env) {
  return env.COACHING_ROLLBACK_CONFIRM === "1";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function asDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function jsonValue(value, fallback) {
  if (value == null) return fallback;
  return value;
}

function lowerStatus(value, fallback) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.trim().toLowerCase();
}

function taskStatus(value) {
  const raw = String(value || "OPEN").toUpperCase();
  if (raw === "IN_PROGRESS") return "in_progress";
  if (raw === "DONE") return "done";
  if (raw === "CANCELLED" || raw === "CANCELED") return "cancelled";
  return "open";
}

function routeTo(value) {
  return value === "DIRECTOR_ONLY" ? "coach" : "learner";
}

function channelOf(value) {
  const raw = String(value || "NOTE").toUpperCase();
  if (raw === "TASK") return "task";
  if (raw === "EMAIL") return "email";
  return "note";
}

function mapIntent(value) {
  if (value === "ADD_TO_COACHING_LOG") return "coaching_log";
  if (value === "UPDATE_PROFILE") return "update_profile";
  return "reference";
}

function repoKind(value) {
  const raw = String(value || "CUSTOM").toUpperCase();
  if (["PRODUCT", "SALES_SKILL", "PERSONALITY", "LEADERSHIP", "CUSTOM"].includes(raw)) return raw;
  return "CUSTOM";
}

function unitStatus(value) {
  const raw = String(value || "PENDING").toUpperCase();
  if (raw === "APPROVED") return "approved";
  if (raw === "REJECTED") return "rejected";
  return "pending";
}

function synthesisStatus(value) {
  if (!value) return null;
  const raw = String(value).toUpperCase();
  if (raw === "GENERATING") return "generating";
  if (raw === "READY") return "ready";
  if (raw === "FAILED") return "failed";
  return null;
}

function eventKind(source) {
  if (source === "DIRECTOR_OVERRIDE") return "skill_override";
  if (source === "MONTHLY_REVIEW") return "monthly_review";
  return "diagnostic";
}

function stripSecrets(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value ?? {};
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (/pass|secret|api[_-]?key|token|smtp|brand_palette|brandPalette/i.test(key)) continue;
    out[key] = item;
  }
  return out;
}

function orgFeatures(org, profile, placement) {
  const features = {};
  if (placement.collided) features.sourceSlug = placement.sourceSlug;
  const logo = httpsUrl(org.brand_logo_url);
  if (logo) features.logoUrl = logo;
  if (org.ai_model) features.aiModel = org.ai_model;
  if (profile?.sales_methodology) features.salesMethodology = profile.sales_methodology;
  if (profile?.values != null) features.values = profile.values;
  if (profile?.improve_button_label) features.improveButtonLabel = profile.improve_button_label;
  if (org.status && org.status !== "ACTIVE") features.status = String(org.status).toLowerCase();
  delete features.brandPalette;
  delete features.smtpPass;
  return features;
}

function safeExt(filename) {
  const ext = extname(String(filename || "")).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

export function planImport({ source, campus, orgMap, now = new Date(), ids = randomUUID, mintToken = () => randomBytes(32).toString("base64url"), fileExists = () => false, uploadRoot = UPLOAD_ROOT }) {
  const map = validateOrgMap(orgMap);
  const src = source || {};
  const rows = (key) => (Array.isArray(src[key]) ? src[key] : []);
  const tally = {};
  for (const [key] of SOURCE_QUERIES) {
    tally[key] = { source: rows(key).length, dest: 0, skipped: 0 };
  }
  const kept = (key) => {
    tally[key].dest += 1;
  };
  const skipped = (key) => {
    tally[key].skipped += 1;
  };
  const errors = [];
  const statements = [];
  const copies = [];
  const push = (table, text, values) => {
    assertDestStatement(text);
    statements.push({ table, text, values });
  };
  const legacy = new Map((campus?.legacy || []).map((row) => [`${row.table_name}:${row.legacy_id}`, row.new_id]));
  const remember = (table, legacyId, id) => {
    const key = `${table}:${legacyId}`;
    if (!legacy.has(key)) legacy.set(key, id);
    push(
      "legacy_ids",
      `INSERT INTO legacy_ids (source, legacy_id, table_name, new_id) VALUES ('aecoach', $1, $2, $3) ON CONFLICT (source, table_name, legacy_id) DO NOTHING`,
      [String(legacyId), table, legacy.get(key)],
    );
    return legacy.get(key);
  };
  const reuse = (table, legacyId) => legacy.get(`${table}:${legacyId}`) || null;

  const orgsBySlug = new Map((campus?.orgs || []).map((org) => [org.slug, org]));
  const existingSlugs = new Set(orgsBySlug.keys());
  const membersByEmail = new Map((campus?.members || []).map((member) => [normalizeEmail(member.email), member]));
  const campusMemberships = campus?.memberships || [];
  const skillKeys = new Set((campus?.skills || []).map((skill) => `${skill.org_id}:${skill.slug}`));
  const profilesByOrg = new Map();
  for (const profile of rows("company_profiles")) {
    profilesByOrg.set(profile.org_id, profile);
  }

  const orgBySource = new Map();
  const importedOrgIds = [];
  for (const org of rows("orgs")) {
    const previous = reuse("organizations", org.id);
    if (previous) {
      const slug = [...orgsBySlug.values()].find((row) => row.id === previous)?.slug || planOrgPlacement({
        sourceSlug: org.slug,
        map,
        existingSlugs,
      }).slug;
      orgBySource.set(org.id, { id: previous, slug, sourceSlug: org.slug });
      importedOrgIds.push(previous);
      kept("orgs");
      continue;
    }
    const placement = planOrgPlacement({ sourceSlug: org.slug, map, existingSlugs });
    if (placement.mode === "merge") {
      const sales = orgsBySlug.get("sales");
      if (!sales) {
        errors.push({ code: "missing_sales", table: "orgs" });
        skipped("orgs");
        continue;
      }
      orgBySource.set(org.id, { id: sales.id, slug: "sales", sourceSlug: org.slug, merge: true });
      importedOrgIds.push(sales.id);
      const features = orgFeatures(org, profilesByOrg.get(org.id), placement);
      push(
        "organizations",
        `UPDATE organizations SET features = COALESCE(features, '{}'::jsonb) || $2::jsonb WHERE id = $1 AND slug = 'sales'`,
        [sales.id, JSON.stringify(features)],
      );
      remember("organizations", org.id, sales.id);
      kept("orgs");
      continue;
    }
    if (existingSlugs.has(placement.slug)) {
      errors.push({ code: "slug_collision", table: "orgs" });
      skipped("orgs");
      continue;
    }
    const id = ids();
    const features = orgFeatures(org, profilesByOrg.get(org.id), placement);
    push(
      "organizations",
      `INSERT INTO organizations (id, slug, name, kind, isolation, features) VALUES ($1, $2, $3, 'company', 'platform_plus', $4::jsonb) ON CONFLICT (slug) DO NOTHING`,
      [id, placement.slug, org.name || placement.slug, JSON.stringify(features)],
    );
    remember("organizations", org.id, id);
    existingSlugs.add(placement.slug);
    orgsBySlug.set(placement.slug, { id, slug: placement.slug, name: org.name, features });
    orgBySource.set(org.id, { id, slug: placement.slug, sourceSlug: org.slug });
    importedOrgIds.push(id);
    kept("orgs");
  }

  for (const profile of rows("company_profiles")) {
    if (orgBySource.has(profile.org_id)) kept("company_profiles");
    else skipped("company_profiles");
  }

  const memberByUser = new Map();
  const kindByUser = new Map();
  for (const user of rows("users")) {
    const email = normalizeEmail(user.email);
    if (!email || !orgBySource.has(user.org_id)) {
      skipped("users");
      continue;
    }
    const existing = membersByEmail.get(email);
    if (existing?.kind === "child") {
      memberByUser.set(user.id, existing.id);
      kindByUser.set(user.id, "child");
      kept("users");
      continue;
    }
    let memberId = existing?.id || null;
    if (!memberId) {
      const previous = reuse("members", user.id);
      memberId = previous || ids();
      if (!previous) {
        push(
          "members",
          `INSERT INTO members (id, email, name, kind) VALUES ($1, $2, $3, 'adult') ON CONFLICT (email) DO NOTHING`,
          [memberId, email, String(user.name || "Member").slice(0, 200)],
        );
        remember("members", user.id, memberId);
        membersByEmail.set(email, { id: memberId, email, name: user.name, kind: "adult" });
      }
    } else {
      remember("members", user.id, memberId);
    }
    memberByUser.set(user.id, memberId);
    kindByUser.set(user.id, existing?.kind || "adult");
    if (user.password_hash) {
      const credentialId = reuse("member_credentials", user.id) || ids();
      push(
        "member_credentials",
        `INSERT INTO member_credentials (id, member_id, source, password_hash) VALUES ($1, $2, 'aecoach', $3) ON CONFLICT (member_id, source) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [credentialId, memberId, user.password_hash],
      );
      remember("member_credentials", user.id, credentialId);
    }
    kept("users");
  }

  const membershipByUserOrg = new Map();
  const stanceByMembership = new Map();
  for (const membership of campusMemberships) {
    stanceByMembership.set(membership.id, membership.stance);
  }
  const fieldSchool = orgsBySlug.get("field-school");

  function existingMembership(memberId, orgId) {
    return campusMemberships.find((row) => row.member_id === memberId && row.org_id === orgId) || null;
  }

  function ensureMembership(userId, orgId, stance, capabilities, { allowExistingCapability = false } = {}) {
    const memberId = memberByUser.get(userId);
    if (!memberId || !orgId) return null;
    if (kindByUser.get(userId) === "child") return null;
    const key = `${userId}:${orgId}`;
    if (membershipByUserOrg.has(key)) return membershipByUserOrg.get(key);
    const found = existingMembership(memberId, orgId);
    if (found) {
      membershipByUserOrg.set(key, found.id);
      stanceByMembership.set(found.id, found.stance);
      if (allowExistingCapability) {
        for (const capability of capabilities) {
          push(
            "membership_capabilities",
            `INSERT INTO membership_capabilities (membership_id, capability) VALUES ($1, $2) ON CONFLICT (membership_id, capability) DO NOTHING`,
            [found.id, capability],
          );
        }
      }
      return found.id;
    }
    const id = ids();
    push(
      "memberships",
      `INSERT INTO memberships (id, org_id, member_id, stance) VALUES ($1, $2, $3, $4) ON CONFLICT (org_id, member_id) DO NOTHING`,
      [id, orgId, memberId, stance],
    );
    for (const capability of capabilities) {
      push(
        "membership_capabilities",
        `INSERT INTO membership_capabilities (membership_id, capability) VALUES ($1, $2) ON CONFLICT (membership_id, capability) DO NOTHING`,
        [id, capability],
      );
    }
    membershipByUserOrg.set(key, id);
    stanceByMembership.set(id, stance);
    campusMemberships.push({ id, org_id: orgId, member_id: memberId, stance });
    return id;
  }

  for (const user of rows("users")) {
    if (!memberByUser.has(user.id)) continue;
    const placed = orgBySource.get(user.org_id);
    if (!placed) continue;
    if (kindByUser.get(user.id) === "child") continue;
    const home = stanceForRole(user.role);
    ensureMembership(user.id, placed.id, home.stance, home.capabilities);
    if (user.role === "ORG_ADMIN") {
      for (const orgId of importedOrgIds) {
        ensureMembership(user.id, orgId, "learner", []);
      }
      if (fieldSchool) {
        ensureMembership(user.id, fieldSchool.id, "admin", ["platform_admin"], { allowExistingCapability: true });
      } else {
        errors.push({ code: "missing_field_school", table: "users" });
      }
    }
  }

  for (const assignment of rows("director_assignments")) {
    const user = rows("users").find((row) => row.id === assignment.director_id);
    const placed = orgBySource.get(assignment.org_id);
    if (!user || !placed || !memberByUser.has(user.id) || kindByUser.get(user.id) === "child") {
      skipped("director_assignments");
      continue;
    }
    const home = stanceForRole(user.role);
    const membershipId = ensureMembership(
      user.id,
      placed.id,
      user.role === "ORG_ADMIN" ? "learner" : home.stance,
      user.role === "ORG_ADMIN" ? [] : home.capabilities,
    );
    if (!membershipId) skipped("director_assignments");
    else kept("director_assignments");
  }

  const aeById = new Map(rows("ae_profiles").map((row) => [row.id, row]));
  const directorById = new Map(rows("director_profiles").map((row) => [row.id, row]));

  function profileMembership(profile, kind) {
    if (!profile) return null;
    const placed = orgBySource.get(profile.org_id);
    if (!placed || !memberByUser.has(profile.user_id)) return null;
    return membershipByUserOrg.get(`${profile.user_id}:${placed.id}`) || null;
  }

  for (const profile of rows("ae_profiles")) {
    const placed = orgBySource.get(profile.org_id);
    const subject = profileMembership(profile);
    const director = rows("users").find((row) => row.id === profile.director_id);
    if (!placed || !subject || !director) continue;
    const coach = membershipByUserOrg.get(`${director.id}:${placed.id}`);
    if (!coach || coach === subject) continue;
    const previous = reuse("coaching_links", `director:${profile.id}`);
    if (previous) continue;
    const id = ids();
    push(
      "coaching_links",
      `INSERT INTO coaching_links (id, org_id, coach_membership_id, subject_membership_id, kind) VALUES ($1, $2, $3, $4, 'director') ON CONFLICT (org_id, coach_membership_id, subject_membership_id, kind) DO NOTHING`,
      [id, placed.id, coach, subject],
    );
    remember("coaching_links", `director:${profile.id}`, id);
  }

  for (const user of rows("users")) {
    if (!user.vp_id) continue;
    const placed = orgBySource.get(user.org_id);
    const subject = placed ? membershipByUserOrg.get(`${user.id}:${placed.id}`) : null;
    const coach = placed ? membershipByUserOrg.get(`${user.vp_id}:${placed.id}`) : null;
    if (!placed || !subject || !coach || coach === subject) continue;
    const previous = reuse("coaching_links", `vp:${user.id}`);
    if (previous) continue;
    const id = ids();
    push(
      "coaching_links",
      `INSERT INTO coaching_links (id, org_id, coach_membership_id, subject_membership_id, kind) VALUES ($1, $2, $3, $4, 'vp') ON CONFLICT (org_id, coach_membership_id, subject_membership_id, kind) DO NOTHING`,
      [id, placed.id, coach, subject],
    );
    remember("coaching_links", `vp:${user.id}`, id);
  }

  for (const token of rows("invite_tokens")) {
    const user = rows("users").find((row) => row.id === token.user_id);
    const placed = user ? orgBySource.get(user.org_id) : null;
    const expires = asDate(token.expires_at);
    const unused = !token.used_at && expires && expires.getTime() > now.getTime();
    if (!user || !placed || !unused || kindByUser.get(user.id) === "child" || !memberByUser.has(user.id)) {
      skipped("invite_tokens");
      continue;
    }
    const previous = reuse("invites", token.id);
    if (!previous) {
      const home = stanceForRole(user.role);
      const clear = mintToken();
      push(
        "invites",
        `INSERT INTO invites (id, org_id, email, stance, token, status, expires_at) VALUES ($1, $2, $3, $4, $5, 'pending', $6) ON CONFLICT (token) DO NOTHING`,
        [ids(), placed.id, normalizeEmail(user.email), user.role === "ORG_ADMIN" ? "learner" : home.stance, clear, expires],
      );
      remember("invites", token.id, statements.at(-1).values[0]);
    }
    kept("invite_tokens");
  }

  const ensuredSkills = new Set(skillKeys);
  function ensureSkill(orgId, category) {
    const meta = SKILL_BY_CATEGORY.get(category);
    if (!meta) return null;
    const key = `${orgId}:${meta.slug}`;
    if (ensuredSkills.has(key)) return meta.slug;
    const id = ids();
    push(
      "skills",
      `INSERT INTO skills (id, org_id, slug, name, rubric) VALUES ($1, $2, $3, $4, $5::jsonb) ON CONFLICT (org_id, slug) DO NOTHING`,
      [id, orgId, meta.slug, meta.name, JSON.stringify({ scale: "0-100", audience: meta.audience, imported: true })],
    );
    ensuredSkills.add(key);
    return meta.slug;
  }
  for (const org of orgBySource.values()) {
    for (const [category] of SKILLS) ensureSkill(org.id, category);
  }
  for (const benchmark of rows("org_skill_benchmarks")) {
    const placed = orgBySource.get(benchmark.org_id);
    if (!placed || !SKILL_BY_CATEGORY.has(benchmark.category)) skipped("org_skill_benchmarks");
    else kept("org_skill_benchmarks");
  }

  const productBySource = new Map();
  for (const product of rows("products")) {
    const placed = orgBySource.get(product.org_id);
    if (!placed) {
      skipped("products");
      continue;
    }
    const id = reuse("products", product.id) || ids();
    if (!reuse("products", product.id)) {
      push(
        "products",
        `INSERT INTO products (id, org_id, slug, name, summary, audience, active) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (org_id, slug) DO NOTHING`,
        [id, placed.id, product.slug || id, product.name || "Product", product.summary ?? null, product.audience ?? null, product.active !== false],
      );
      remember("products", product.id, id);
    }
    productBySource.set(product.id, id);
    kept("products");
  }

  const questionBySource = new Map();
  for (const question of rows("questions")) {
    const placed = question.org_id ? orgBySource.get(question.org_id) : { id: null };
    if (question.org_id && !orgBySource.has(question.org_id)) {
      skipped("questions");
      continue;
    }
    const author = question.author_user_id && placed?.id
      ? membershipByUserOrg.get(`${question.author_user_id}:${placed.id}`) || null
      : null;
    const id = reuse("questions", question.id) || ids();
    if (!reuse("questions", question.id)) {
      push(
        "questions",
        `INSERT INTO questions (id, org_id, product_id, category, question_type, text, options, tags, weight, active, author_membership_id) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11)`,
        [
          id,
          placed?.id ?? null,
          question.product_id ? productBySource.get(question.product_id) || null : null,
          question.category,
          question.question_type,
          question.text || "",
          JSON.stringify(question.options_json ?? null),
          JSON.stringify(question.tags_json ?? []),
          question.weight ?? 1,
          question.active !== false,
          author,
        ],
      );
      remember("questions", question.id, id);
    }
    questionBySource.set(question.id, { id, orgId: placed?.id ?? null });
    kept("questions");
  }

  for (const profile of rows("ae_profiles")) {
    const placed = orgBySource.get(profile.org_id);
    const membershipId = profileMembership(profile);
    if (!placed || !membershipId) {
      skipped("ae_profiles");
      continue;
    }
    if (!reuse("coaching_profiles", profile.id)) {
      const id = ids();
      push(
        "coaching_profiles",
        `INSERT INTO coaching_profiles (id, org_id, membership_id, personality_summary, sales_style_summary, communication_summary, leadership_summary, forecasting_summary, motivations, strengths, weaknesses, enneagram_type, disc_profile, mbti_type, coaching_hints, reasoning_summary, synthesis_status, synthesis_error, synthesis_started_at, last_synthesized_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14,$15::jsonb,$16,$17,$18,$19,$20) ON CONFLICT (org_id, membership_id) DO NOTHING`,
        [
          id,
          placed.id,
          membershipId,
          profile.personality_summary ?? null,
          profile.sales_style_summary ?? null,
          profile.communication_summary ?? null,
          null,
          null,
          JSON.stringify(jsonValue(profile.motivations, [])),
          JSON.stringify(jsonValue(profile.strengths_json, [])),
          JSON.stringify(jsonValue(profile.weaknesses_json, [])),
          profile.enneagram_type ?? null,
          profile.disc_profile ?? null,
          profile.mbti_type ?? null,
          JSON.stringify(profile.coaching_hints_json ?? null),
          profile.reasoning_summary ?? null,
          synthesisStatus(profile.synthesis_status),
          profile.synthesis_error ?? null,
          asDate(profile.synthesis_started_at),
          asDate(profile.last_synthesized_at),
        ],
      );
      remember("coaching_profiles", profile.id, id);
    }
    kept("ae_profiles");
  }

  for (const profile of rows("director_profiles")) {
    const placed = orgBySource.get(profile.org_id);
    const membershipId = profileMembership(profile);
    if (!placed || !membershipId) {
      skipped("director_profiles");
      continue;
    }
    const previous = reuse("coaching_profiles", profile.id);
    const id = previous || ids();
    if (!previous) {
      push(
        "coaching_profiles",
        `INSERT INTO coaching_profiles (id, org_id, membership_id, personality_summary, sales_style_summary, communication_summary, leadership_summary, forecasting_summary, motivations, strengths, weaknesses, enneagram_type, disc_profile, mbti_type, coaching_hints, reasoning_summary, synthesis_status, synthesis_error, synthesis_started_at, last_synthesized_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14,$15::jsonb,$16,$17,$18,$19,$20) ON CONFLICT (org_id, membership_id) DO UPDATE SET leadership_summary = COALESCE(EXCLUDED.leadership_summary, coaching_profiles.leadership_summary), forecasting_summary = COALESCE(EXCLUDED.forecasting_summary, coaching_profiles.forecasting_summary)`,
        [
          id,
          placed.id,
          membershipId,
          profile.personality_summary ?? null,
          null,
          null,
          profile.leadership_summary ?? null,
          profile.forecasting_summary ?? null,
          JSON.stringify(jsonValue(profile.motivations, [])),
          JSON.stringify(jsonValue(profile.strengths_json, [])),
          JSON.stringify(jsonValue(profile.weaknesses_json, [])),
          profile.enneagram_type ?? null,
          profile.disc_profile ?? null,
          profile.mbti_type ?? null,
          JSON.stringify(profile.coaching_hints_json ?? null),
          profile.reasoning_summary ?? null,
          synthesisStatus(profile.synthesis_status),
          profile.synthesis_error ?? null,
          asDate(profile.synthesis_started_at),
          asDate(profile.last_synthesized_at),
        ],
      );
      remember("coaching_profiles", profile.id, id);
    }
    kept("director_profiles");
  }

  function insertScore({ key, legacyId, orgId, membershipId, category, score, notes, sourceName, actorUserId, when }) {
    const meta = SKILL_BY_CATEGORY.get(category);
    if (!orgId || !membershipId || !meta) {
      skipped(key);
      return;
    }
    ensureSkill(orgId, category);
    const previous = reuse("skill_states", legacyId);
    const id = previous || ids();
    const raw = { imported: true, legacyId: String(legacyId), scale: "0-100", source: sourceName || null };
    if (!previous) {
      push(
        "skill_states",
        `INSERT INTO skill_states (id, org_id, membership_id, skill_id, score, raw) SELECT $1, $2, $3, s.id, $4, $5::jsonb FROM skills s WHERE s.org_id = $2 AND s.slug = $6 ON CONFLICT (org_id, membership_id, skill_id) DO UPDATE SET score = EXCLUDED.score, raw = EXCLUDED.raw, updated_at = now()`,
        [id, orgId, membershipId, score, JSON.stringify(raw), meta.slug],
      );
      remember("skill_states", legacyId, id);
    }
    const actor = (actorUserId && membershipByUserOrg.get(`${actorUserId}:${orgId}`)) || membershipId;
    const eventPrevious = reuse("learning_events", legacyId);
    if (!eventPrevious) {
      const eventId = ids();
      push(
        "learning_events",
        `INSERT INTO learning_events (id, org_id, membership_id, actor_membership_id, actor_stance, kind, object_type, object_id, skill_ids, score, raw, created_at) VALUES ($1,$2,$3,$4,$5,$6,'skill',$7,$8::text[],$9,$10::jsonb,$11)`,
        [
          eventId,
          orgId,
          membershipId,
          actor,
          stanceByMembership.get(actor) || "learner",
          eventKind(sourceName),
          meta.slug,
          [meta.slug],
          score,
          JSON.stringify(raw),
          asDate(when) || now,
        ],
      );
      remember("learning_events", legacyId, eventId);
    }
    if (notes) {
      const obsPrevious = reuse("skill_observations", legacyId);
      if (!obsPrevious) {
        const obsId = ids();
        push(
          "skill_observations",
          `INSERT INTO skill_observations (id, org_id, membership_id, skill_id, score, evidence, created_at) SELECT $1, $2, $3, s.id, $4, $5, $6 FROM skills s WHERE s.org_id = $2 AND s.slug = $7`,
          [obsId, orgId, membershipId, score, String(notes).slice(0, 2000), asDate(when) || now, meta.slug],
        );
        remember("skill_observations", legacyId, obsId);
      }
    }
    kept(key);
  }

  for (const score of rows("skill_scores")) {
    const profile = aeById.get(score.ae_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    insertScore({
      key: "skill_scores",
      legacyId: score.id,
      orgId: placed?.id,
      membershipId: profileMembership(profile),
      category: score.category,
      score: score.score,
      notes: score.notes,
      sourceName: score.source,
      actorUserId: score.last_updated_by_user_id,
      when: score.last_updated_at || score.created_at,
    });
  }
  for (const score of rows("director_skill_scores")) {
    const profile = directorById.get(score.director_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    insertScore({
      key: "director_skill_scores",
      legacyId: score.id,
      orgId: placed?.id,
      membershipId: profileMembership(profile),
      category: score.category,
      score: score.score,
      notes: score.notes,
      sourceName: score.source,
      actorUserId: null,
      when: score.last_updated_at || score.created_at,
    });
  }
  for (const score of rows("skill_score_history")) {
    const profile = aeById.get(score.ae_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const membershipId = profileMembership(profile);
    const meta = SKILL_BY_CATEGORY.get(score.category);
    if (!placed || !membershipId || !meta) {
      skipped("skill_score_history");
      continue;
    }
    const previous = reuse("skill_observations", `history:${score.id}`);
    if (!previous) {
      const id = ids();
      push(
        "skill_observations",
        `INSERT INTO skill_observations (id, org_id, membership_id, skill_id, score, evidence, created_at) SELECT $1, $2, $3, s.id, $4, NULL, $5 FROM skills s WHERE s.org_id = $2 AND s.slug = $6`,
        [id, placed.id, membershipId, score.score, asDate(score.recorded_at) || now, meta.slug],
      );
      remember("skill_observations", `history:${score.id}`, id);
      const eventId = ids();
      const raw = { imported: true, legacyId: String(score.id), scale: "0-100", source: score.source || null };
      push(
        "learning_events",
        `INSERT INTO learning_events (id, org_id, membership_id, actor_membership_id, actor_stance, kind, object_type, object_id, skill_ids, score, raw, created_at) VALUES ($1,$2,$3,$3,$4,$5,'skill',$6,$7::text[],$8,$9::jsonb,$10)`,
        [eventId, placed.id, membershipId, stanceByMembership.get(membershipId) || "learner", eventKind(score.source), meta.slug, [meta.slug], score.score, JSON.stringify(raw), asDate(score.recorded_at) || now],
      );
      remember("learning_events", `history:${score.id}`, eventId);
    }
    kept("skill_score_history");
  }

  const quizAnswerSets = new Set(rows("ad_hoc_quizzes").map((quiz) => quiz.answer_set_id).filter(Boolean));
  const answerSetBySource = new Map();
  for (const set of rows("answer_sets")) {
    const ae = set.ae_profile_id ? aeById.get(set.ae_profile_id) : null;
    const director = set.director_profile_id ? directorById.get(set.director_profile_id) : null;
    const profile = ae || director;
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const membershipId = profileMembership(profile);
    if (!placed || !membershipId) {
      skipped("answer_sets");
      continue;
    }
    const previous = reuse("answer_sets", set.id);
    const id = previous || ids();
    const order = Array.isArray(set.question_order) ? set.question_order.map((qid) => questionBySource.get(qid)?.id).filter(Boolean) : [];
    if (!previous) {
      const kind = quizAnswerSets.has(set.id) ? "quiz" : director ? "director_intake" : "intake";
      push(
        "answer_sets",
        `INSERT INTO answer_sets (id, org_id, membership_id, kind, status, version, resume_index, question_order, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`,
        [id, placed.id, membershipId, kind, lowerStatus(set.status, "in_progress"), set.version || 1, set.resume_index || 0, JSON.stringify(order), asDate(set.started_at) || now],
      );
      remember("answer_sets", set.id, id);
    }
    answerSetBySource.set(set.id, { id, orgId: placed.id });
    kept("answer_sets");
  }

  for (const answer of rows("answers")) {
    const set = answerSetBySource.get(answer.answer_set_id);
    const question = questionBySource.get(answer.question_id);
    if (!set || !question) {
      skipped("answers");
      continue;
    }
    const previous = reuse("answers", answer.id);
    if (!previous) {
      const id = ids();
      push(
        "answers",
        `INSERT INTO answers (id, org_id, answer_set_id, question_id, value) VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT (answer_set_id, question_id) DO NOTHING`,
        [id, set.orgId, set.id, question.id, JSON.stringify(answer.value ?? {})],
      );
      remember("answers", answer.id, id);
    }
    kept("answers");
  }

  for (const note of rows("coaching_notes")) {
    const profile = aeById.get(note.ae_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const subject = profileMembership(profile);
    const author = placed ? membershipByUserOrg.get(`${note.director_id}:${placed.id}`) : null;
    if (!placed || !subject || !author) {
      skipped("coaching_notes");
      continue;
    }
    if (!reuse("coaching_notes", note.id)) {
      const id = ids();
      push(
        "coaching_notes",
        `INSERT INTO coaching_notes (id, org_id, author_membership_id, subject_membership_id, body, visible_to_learner, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, placed.id, author, subject, note.content || "", Boolean(note.visible_to_ae), asDate(note.created_at) || now, asDate(note.updated_at) || now],
      );
      remember("coaching_notes", note.id, id);
    }
    kept("coaching_notes");
  }

  for (const plan of rows("plans")) {
    const profile = aeById.get(plan.ae_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const subject = profileMembership(profile);
    const author = profile?.director_id && placed ? membershipByUserOrg.get(`${profile.director_id}:${placed.id}`) : subject;
    if (!placed || !subject || !author) {
      skipped("plans");
      continue;
    }
    if (!reuse("coaching_plans", `plan:${plan.id}`)) {
      const id = ids();
      push(
        "coaching_plans",
        `INSERT INTO coaching_plans (id, org_id, subject_membership_id, author_membership_id, generated, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)`,
        [id, placed.id, subject, author, JSON.stringify({ year: plan.year, quarter: plan.quarter, focusAreas: plan.focus_areas_json ?? [], milestones: plan.milestones_json ?? [] }), lowerStatus(plan.status, "active"), asDate(plan.created_at) || now, asDate(plan.updated_at) || now],
      );
      remember("coaching_plans", `plan:${plan.id}`, id);
    }
    kept("plans");
  }

  for (const plan of rows("coaching_plans")) {
    const profile = plan.ae_profile_id ? aeById.get(plan.ae_profile_id) : directorById.get(plan.director_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const subject = profileMembership(profile);
    const author = placed ? membershipByUserOrg.get(`${plan.built_by_user_id}:${placed.id}`) || subject : null;
    if (!placed || !subject || !author) {
      skipped("coaching_plans");
      continue;
    }
    if (!reuse("coaching_plans", plan.id)) {
      const id = ids();
      push(
        "coaching_plans",
        `INSERT INTO coaching_plans (id, org_id, subject_membership_id, author_membership_id, generated, model_name, status, error, read_by, created_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9::jsonb,$10)`,
        [id, placed.id, subject, author, JSON.stringify(plan.generated_json ?? {}), plan.model_used ?? null, lowerStatus(plan.status, "generating"), plan.error_message ?? null, JSON.stringify(plan.read_by_json ?? []), asDate(plan.created_at) || now],
      );
      remember("coaching_plans", plan.id, id);
    }
    kept("coaching_plans");
  }

  const prepIdBySource = new Map();
  for (const prep of rows("prep_docs")) {
    const profile = aeById.get(prep.ae_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const subject = profileMembership(profile);
    const author = placed ? membershipByUserOrg.get(`${prep.director_id}:${placed.id}`) : null;
    if (!placed || !subject || !author) {
      skipped("prep_docs");
      continue;
    }
    const previous = reuse("one_on_one_preps", `prep:${prep.id}`);
    const id = previous || ids();
    const analyses = rows("cross_ref_analyses").filter((row) => row.prep_doc_id === prep.id);
    if (!previous) {
      push(
        "one_on_one_preps",
        `INSERT INTO one_on_one_preps (id, org_id, subject_membership_id, author_membership_id, prep_doc_text, generated, status, created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,'ready',$7)`,
        [id, placed.id, subject, author, prep.content || "", JSON.stringify({ crossRefs: analyses.map((row) => stripSecrets({ recommendations: row.recommendations_json, talkingPoints: row.talking_points_json })) }), asDate(prep.created_at) || now],
      );
      remember("one_on_one_preps", `prep:${prep.id}`, id);
    }
    prepIdBySource.set(prep.id, id);
    kept("prep_docs");
  }
  for (const cross of rows("cross_ref_analyses")) {
    if (!prepIdBySource.has(cross.prep_doc_id) && !reuse("one_on_one_preps", `prep:${cross.prep_doc_id}`)) skipped("cross_ref_analyses");
    else kept("cross_ref_analyses");
  }
  for (const prep of rows("one_on_one_preps")) {
    const profile = prep.ae_profile_id ? aeById.get(prep.ae_profile_id) : directorById.get(prep.director_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const subject = profileMembership(profile);
    const author = placed ? membershipByUserOrg.get(`${prep.prepared_by_user_id}:${placed.id}`) || subject : null;
    if (!placed || !subject || !author) {
      skipped("one_on_one_preps");
      continue;
    }
    if (!reuse("one_on_one_preps", prep.id)) {
      const id = ids();
      push(
        "one_on_one_preps",
        `INSERT INTO one_on_one_preps (id, org_id, subject_membership_id, author_membership_id, prep_doc_text, generated, model_name, status, error, created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)`,
        [id, placed.id, subject, author, prep.prep_doc_text || "", JSON.stringify(stripSecrets(prep.generated_json) ?? {}), prep.model_used ?? null, lowerStatus(prep.status, "generating"), prep.error_message ?? null, asDate(prep.created_at) || now],
      );
      remember("one_on_one_preps", prep.id, id);
    }
    kept("one_on_one_preps");
  }

  const unitByArticle = new Map();
  const repoBySource = new Map();
  for (const repo of rows("knowledge_repositories")) {
    const placed = orgBySource.get(repo.org_id);
    const visibility = mapVisibility(repo.visibility) || (repo.kind === "PERSONALITY" || repo.kind === "LEADERSHIP" ? "coach" : "both");
    if (!placed) {
      skipped("knowledge_repositories");
      continue;
    }
    const previous = reuse("knowledge_repos", repo.id);
    const id = previous || ids();
    if (!previous) {
      push(
        "knowledge_repos",
        `INSERT INTO knowledge_repos (id, org_id, repo_kind, name, visibility) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (org_id, repo_kind, name) DO NOTHING`,
        [id, placed.id, repoKind(repo.kind), repo.name || "Library", visibility],
      );
      remember("knowledge_repos", repo.id, id);
    }
    repoBySource.set(repo.id, { id, orgId: placed.id, visibility });
    kept("knowledge_repositories");
  }

  for (const article of rows("knowledge_articles")) {
    const repo = repoBySource.get(article.repository_id);
    const visibility = repo.visibility || "both";
    if (!repo) {
      skipped("knowledge_articles");
      continue;
    }
    const previous = reuse("coaching_knowledge_units", article.id);
    const id = previous || ids();
    const meta = article.skill_category ? SKILL_BY_CATEGORY.get(article.skill_category) : null;
    if (!previous) {
      push(
        "coaching_knowledge_units",
        `INSERT INTO coaching_knowledge_units (id, org_id, repository_id, product_id, title, body, skill_slugs, tags, status, visibility, author_membership_id, approver_membership_id, embedding) VALUES ($1,$2,$3,$4,$5,$6,$7::text[],$8::jsonb,$9,$10,$11,$12,$13::jsonb)`,
        [
          id,
          repo.orgId,
          repo.id,
          article.product_id ? productBySource.get(article.product_id) || null : null,
          article.title || "Article",
          article.body || "",
          meta ? [meta.slug] : [],
          JSON.stringify(article.tags_json ?? []),
          unitStatus(article.status),
          visibility,
          article.author_user_id ? membershipByUserOrg.get(`${article.author_user_id}:${repo.orgId}`) || null : null,
          article.approved_by_user_id ? membershipByUserOrg.get(`${article.approved_by_user_id}:${repo.orgId}`) || null : null,
          article.embedding == null ? null : JSON.stringify(article.embedding),
        ],
      );
      remember("coaching_knowledge_units", article.id, id);
    }
    unitByArticle.set(article.id, id);
    kept("knowledge_articles");
  }

  for (const rec of rows("recommendations")) {
    const profile = aeById.get(rec.ae_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const subject = profileMembership(profile);
    if (!placed || !subject) {
      skipped("recommendations");
      continue;
    }
    const previous = reuse("recommendations", rec.id);
    if (!previous) {
      const id = ids();
      const units = Array.isArray(rec.source_article_ids) ? rec.source_article_ids.map((articleId) => unitByArticle.get(articleId)).filter(Boolean) : [];
      push(
        "recommendations",
        `INSERT INTO recommendations (id, org_id, subject_membership_id, source, category, route_to, channel, title, body, status, source_unit_ids) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)`,
        [id, placed.id, subject, lowerStatus(rec.source, "director"), lowerStatus(rec.category, "general"), routeTo(rec.route_to), channelOf(rec.channel), rec.title || "Recommendation", rec.description || "", lowerStatus(rec.status, "open"), JSON.stringify(units)],
      );
      remember("recommendations", rec.id, id);
    }
    kept("recommendations");
  }

  for (const task of rows("tasks")) {
    const profile = task.ae_profile_id ? aeById.get(task.ae_profile_id) : null;
    const profileOrg = profile ? orgBySource.get(profile.org_id) : null;
    const assigneeUser = task.assignee_user_id ? rows("users").find((row) => row.id === task.assignee_user_id) : null;
    const assigneeOrg = assigneeUser ? orgBySource.get(assigneeUser.org_id) : null;
    const orgId = profileOrg?.id || assigneeOrg?.id || null;
    const profileMembershipId = profile && orgId ? membershipByUserOrg.get(`${profile.user_id}:${orgId}`) || profileMembership(profile) : null;
    const assigneeMembershipId = task.assignee_user_id && orgId ? membershipByUserOrg.get(`${task.assignee_user_id}:${orgId}`) : null;
    const author = task.created_by_user_id && orgId ? membershipByUserOrg.get(`${task.created_by_user_id}:${orgId}`) : null;
    const assigned = assignTaskMemberships({
      assigneeMembershipId,
      profileMembershipId,
    });
    if (!orgId || !author || !assigned) {
      skipped("tasks");
      continue;
    }
    if (!reuse("work_items", task.id)) {
      const id = ids();
      push(
        "work_items",
        `INSERT INTO work_items (id, org_id, assignee_membership_id, author_membership_id, subject_membership_id, title, body, status, due_at, completed_at, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, orgId, assigned.assigneeMembershipId, author, assigned.subjectMembershipId, task.title || "Task", task.description ?? null, taskStatus(task.status), asDate(task.due_at), asDate(task.completed_at), asDate(task.created_at) || now],
      );
      remember("work_items", task.id, id);
    }
    kept("tasks");
  }

  const reviewBySource = new Map();
  for (const review of rows("director_reviews")) {
    const profile = aeById.get(review.ae_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const subject = profileMembership(profile);
    const coach = placed ? membershipByUserOrg.get(`${review.director_id}:${placed.id}`) : null;
    if (!placed || !subject || !coach) {
      skipped("director_reviews");
      continue;
    }
    const previous = reuse("reviews", review.id);
    const id = previous || ids();
    if (!previous) {
      push(
        "reviews",
        `INSERT INTO reviews (id, org_id, coach_membership_id, subject_membership_id, month_of, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (org_id, coach_membership_id, subject_membership_id, month_of) DO NOTHING`,
        [id, placed.id, coach, subject, asDate(review.month_of) || now, lowerStatus(review.status, "pending"), asDate(review.created_at) || now],
      );
      remember("reviews", review.id, id);
    }
    reviewBySource.set(review.id, { id, orgId: placed.id });
    kept("director_reviews");
  }
  for (const answer of rows("director_review_answers")) {
    const review = reviewBySource.get(answer.director_review_id);
    const question = questionBySource.get(answer.question_id);
    if (!review || !question) {
      skipped("director_review_answers");
      continue;
    }
    if (!reuse("review_answers", answer.id)) {
      const id = ids();
      push(
        "review_answers",
        `INSERT INTO review_answers (id, org_id, review_id, question_id, value) VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT (review_id, question_id) DO NOTHING`,
        [id, review.orgId, review.id, question.id, JSON.stringify({ value: answer.value ?? null, scoreDeltas: answer.score_deltas_json ?? [] })],
      );
      remember("review_answers", answer.id, id);
    }
    kept("director_review_answers");
  }

  const quizBySource = new Map();
  for (const quiz of rows("ad_hoc_quizzes")) {
    const profile = quiz.ae_profile_id ? aeById.get(quiz.ae_profile_id) : directorById.get(quiz.director_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const subject = profileMembership(profile);
    const author = placed ? membershipByUserOrg.get(`${quiz.sent_by_user_id}:${placed.id}`) || subject : null;
    if (!placed || !subject || !author || !quiz.token_hash) {
      skipped("ad_hoc_quizzes");
      continue;
    }
    const previous = reuse("ad_hoc_quizzes", quiz.id);
    const id = previous || ids();
    const questionIds = Array.isArray(quiz.question_ids) ? quiz.question_ids.map((qid) => questionBySource.get(qid)?.id).filter(Boolean) : [];
    if (!previous) {
      push(
        "ad_hoc_quizzes",
        `INSERT INTO ad_hoc_quizzes (id, org_id, subject_membership_id, author_membership_id, title, token_hash, status, question_ids, answer_set_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10) ON CONFLICT (token_hash) DO NOTHING`,
        [id, placed.id, subject, author, quiz.title || "Quiz", quiz.token_hash, lowerStatus(quiz.status, "pending"), JSON.stringify(questionIds), quiz.answer_set_id ? answerSetBySource.get(quiz.answer_set_id)?.id || null : null, asDate(quiz.created_at) || now],
      );
      remember("ad_hoc_quizzes", quiz.id, id);
    }
    quizBySource.set(quiz.id, id);
    kept("ad_hoc_quizzes");
  }
  for (const schedule of rows("recurring_quiz_schedules")) {
    const profile = schedule.ae_profile_id ? aeById.get(schedule.ae_profile_id) : directorById.get(schedule.director_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const subject = profileMembership(profile);
    if (!placed || !subject || !asDate(schedule.next_run_at)) {
      skipped("recurring_quiz_schedules");
      continue;
    }
    if (!reuse("quiz_schedules", schedule.id)) {
      const id = ids();
      push(
        "quiz_schedules",
        `INSERT INTO quiz_schedules (id, org_id, subject_membership_id, cadence, next_run_at, active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, placed.id, subject, lowerStatus(schedule.cadence, "monthly"), asDate(schedule.next_run_at), schedule.active !== false, asDate(schedule.created_at) || now],
      );
      remember("quiz_schedules", schedule.id, id);
    }
    kept("recurring_quiz_schedules");
  }
  for (const retake of rows("quiz_retake_requests")) {
    const user = rows("users").find((row) => row.id === retake.requester_user_id);
    const placed = user ? orgBySource.get(user.org_id) : null;
    const requester = placed ? membershipByUserOrg.get(`${retake.requester_user_id}:${placed.id}`) : null;
    if (!placed || !requester) {
      skipped("quiz_retake_requests");
      continue;
    }
    if (!reuse("retake_requests", retake.id)) {
      const id = ids();
      push(
        "retake_requests",
        `INSERT INTO retake_requests (id, org_id, requester_membership_id, quiz_id, answer_set_id, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, placed.id, requester, retake.ad_hoc_quiz_id ? quizBySource.get(retake.ad_hoc_quiz_id) || null : null, retake.answer_set_id ? answerSetBySource.get(retake.answer_set_id)?.id || null : null, lowerStatus(retake.status, "pending"), asDate(retake.created_at) || now],
      );
      remember("retake_requests", retake.id, id);
    }
    kept("quiz_retake_requests");
  }

  function queueFile({ key, legacyTable, legacyId, orgId, author, title, filename, storagePath, mime, sizeBytes, visibility, body, kind }) {
    const reason = fileSkipReason(filename, sizeBytes);
    if (reason || !orgId || !author) {
      skipped(key);
      return null;
    }
    const previous = reuse(legacyTable, legacyId);
    const id = previous || ids();
    const https = httpsUrl(storagePath);
    const sourceKind = https ? "url" : body && !storagePath ? "note" : "upload";
    const localPresent = Boolean(storagePath) && !https && fileExists(storagePath);
    const present = Boolean(https) || localPresent;
    if (!previous) {
      const destPath = localPresent ? join(uploadRoot, orgId, `${id}${safeExt(filename)}`) : null;
      push(
        "coaching_sources",
        `INSERT INTO coaching_sources (id, org_id, kind, title, storage_path, body, mime, byte_size, visibility, storage_status, author_membership_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [id, orgId, kind || sourceKind, title || filename || "File", https || destPath, body || "", mime ?? null, sizeBytes ?? null, visibility, present ? "present" : "missing", author, now],
      );
      remember(legacyTable, legacyId, id);
      if (destPath) copies.push({ from: storagePath, to: destPath });
    }
    kept(key);
    return id;
  }

  const benchmarkOrg = new Map();
  for (const benchmark of rows("org_skill_benchmarks")) {
    const placed = orgBySource.get(benchmark.org_id);
    if (placed) benchmarkOrg.set(benchmark.id, placed.id);
  }
  for (const file of rows("org_skill_benchmark_files")) {
    const orgId = benchmarkOrg.get(file.benchmark_id);
    const author = orgId ? membershipByUserOrg.get(`${file.uploaded_by_user_id}:${orgId}`) : null;
    queueFile({
      key: "org_skill_benchmark_files",
      legacyTable: "coaching_sources",
      legacyId: `benchmark-file:${file.id}`,
      orgId,
      author,
      title: file.filename,
      filename: file.filename,
      storagePath: file.storage_path,
      mime: null,
      sizeBytes: file.text_preview ? 1 : 0,
      visibility: "coach",
      body: file.text_preview || "",
      kind: "upload",
    });
  }
  const sourceByFile = new Map();
  for (const file of rows("file_assets")) {
    const placed = orgBySource.get(file.org_id);
    const author = placed ? membershipByUserOrg.get(`${file.owner_user_id}:${placed.id}`) : null;
    const id = queueFile({
      key: "file_assets",
      legacyTable: "coaching_sources",
      legacyId: file.id,
      orgId: placed?.id,
      author,
      title: file.filename,
      filename: file.filename,
      storagePath: file.storage_path,
      mime: file.mime_type,
      sizeBytes: file.size_bytes,
      visibility: mapVisibility(file.visibility) || "coach",
      body: "",
      kind: null,
    });
    if (id) sourceByFile.set(file.mapping_id || file.id, { id, orgId: placed.id });
  }
  for (const mapping of rows("file_mappings")) {
    const placed = orgBySource.get(mapping.org_id);
    const visibility = mapVisibility(mapping.visibility);
    const linked = sourceByFile.get(mapping.id);
    if (!placed || !visibility || !linked) {
      skipped("file_mappings");
      continue;
    }
    const previous = reuse("source_mappings", mapping.id);
    if (!previous) {
      const id = ids();
      const sourceId = linked.id;
      push(
        "source_mappings",
        `INSERT INTO source_mappings (id, org_id, source_id, kind, intent, visibility, ai_suggested_kind, ai_suggested_intent, ai_confidence, ai_rationale, confirmed_at, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [id, placed.id, sourceId, lowerStatus(mapping.kind, "general"), mapIntent(mapping.update_intent), visibility, mapping.ai_suggested_kind ? lowerStatus(mapping.ai_suggested_kind, null) : null, mapping.ai_suggested_intent ? mapIntent(mapping.ai_suggested_intent) : null, mapping.ai_confidence ?? null, mapping.ai_rationale ?? null, asDate(mapping.confirmed_at), asDate(mapping.created_at) || now],
      );
      remember("source_mappings", mapping.id, id);
    }
    kept("file_mappings");
  }

  for (const attempt of rows("game_attempts")) {
    const placed = orgBySource.get(attempt.org_id);
    const membershipId = placed ? membershipByUserOrg.get(`${attempt.user_id}:${placed.id}`) : null;
    if (!placed || !membershipId || !attempt.prompt) {
      skipped("game_attempts");
      continue;
    }
    if (!reuse("drill_attempts", attempt.id)) {
      const id = ids();
      const meta = SKILL_BY_CATEGORY.get(attempt.skill_category);
      push(
        "drill_attempts",
        `INSERT INTO drill_attempts (id, org_id, membership_id, skill_category, prompt, user_response, ai_score, points_awarded, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, placed.id, membershipId, meta?.slug || String(attempt.skill_category || "general").toLowerCase(), attempt.prompt, attempt.user_response ?? null, attempt.ai_score ?? null, attempt.points_awarded || 0, lowerStatus(attempt.status, "in_progress"), asDate(attempt.started_at) || now],
      );
      remember("drill_attempts", attempt.id, id);
    }
    kept("game_attempts");
  }

  for (const row of rows("quarterly_performance")) {
    const profile = aeById.get(row.ae_profile_id);
    const placed = profile ? orgBySource.get(profile.org_id) : null;
    const membershipId = profileMembership(profile);
    if (!placed || !membershipId) {
      skipped("quarterly_performance");
      continue;
    }
    if (!reuse("performance_snapshots", row.id)) {
      const id = ids();
      push(
        "performance_snapshots",
        `INSERT INTO performance_snapshots (id, org_id, membership_id, year, quarter, quota_cents, attained_cents, notes, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (org_id, membership_id, year, quarter) DO NOTHING`,
        [id, placed.id, membershipId, row.year, row.quarter, row.quota_cents ?? null, row.attained_cents ?? null, row.notes ?? null, asDate(row.created_at) || now],
      );
      remember("performance_snapshots", row.id, id);
    }
    kept("quarterly_performance");
  }

  for (const log of rows("audit_logs")) {
    const placed = log.org_id ? orgBySource.get(log.org_id) : null;
    const actor = placed ? membershipByUserOrg.get(`${log.actor_user_id}:${placed.id}`) : null;
    if (!actor) {
      skipped("audit_logs");
      continue;
    }
    if (!reuse("audit_logs", log.id)) {
      const id = ids();
      push(
        "audit_logs",
        `INSERT INTO audit_logs (id, org_id, actor_membership_id, action, target_type, target_id, metadata, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
        [id, placed?.id ?? null, actor, String(log.action || "imported").toLowerCase(), log.target_type || "legacy", String(log.target_id || log.id), JSON.stringify(stripSecrets(log.metadata)), asDate(log.created_at) || now],
      );
      remember("audit_logs", log.id, id);
    }
    kept("audit_logs");
  }

  const unexplained = [];
  for (const [key] of SOURCE_QUERIES) {
    const row = tally[key];
    if (row.dest + row.skipped !== row.source) unexplained.push({ table: key, delta: row.source - row.dest - row.skipped });
  }
  return { statements, copies, counts: tally, errors, unexplained };
}

export async function loadSource(query, { dryRun }) {
  const snapshot = {};
  const errors = [];
  for (const [key, sql] of SOURCE_QUERIES) {
    assertReadOnly(sql);
    try {
      snapshot[key] = await query(sql);
    } catch (err) {
      const missing = err && (err.code === "42703" || err.code === "42P01");
      if (dryRun && missing) {
        snapshot[key] = [];
        errors.push({ code: "missing_relation", table: key });
        continue;
      }
      throw new ImportRefusal(missing ? "missing_relation" : "source_read_failed");
    }
  }
  return { snapshot, errors };
}

export async function loadCampus(query) {
  const orgs = await query(`SELECT id, slug, name, features FROM organizations`);
  const members = await query(`SELECT id, email, name, kind FROM members`);
  const memberships = await query(`SELECT id, org_id, member_id, stance FROM memberships`);
  const capabilities = await query(`SELECT membership_id, capability FROM membership_capabilities`);
  const legacy = await query(`SELECT table_name, legacy_id, new_id FROM legacy_ids WHERE source = 'aecoach'`);
  const skills = await query(`SELECT id, org_id, slug FROM skills`);
  return { orgs, members, memberships, capabilities, legacy, skills };
}

export async function applyPlan(db, plan) {
  for (const statement of plan.statements) {
    assertDestStatement(statement.text);
    await db.query(statement.text, statement.values);
  }
}

export async function withDestTransaction(dest, dryRun, work) {
  let result = null;
  try {
    await dest.begin(async (tx) => {
      result = await work(tx);
      if (dryRun) throw new DryRunRollback();
    });
  } catch (err) {
    if (err instanceof DryRunRollback) return { rolledBack: true, result };
    throw err;
  }
  return { rolledBack: false, result };
}

export async function copyImportedFiles(copies, copyFile = defaultCopy) {
  for (const file of copies) await copyFile(file.from, file.to);
}

function defaultCopy(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}

export async function finishImport({ dest, plan, dryRun, copyFile }) {
  const outcome = await withDestTransaction(dest, dryRun, async (tx) => {
    await applyPlan(tx, plan);
    return plan.counts;
  });
  if (!dryRun && !outcome.rolledBack) await copyImportedFiles(plan.copies, copyFile);
  return outcome;
}

export async function runImport({ env, argv, connect, readMap, now, ids, mintToken, fileExists, uploadRoot, copyFile, log = () => {} }) {
  assertCoachingImport(env);
  const destUrl = String(env.DATABASE_URL || "").trim();
  const sourceUrl = String(env.AECOACH_DATABASE_URL || "").trim();
  if (!destUrl || !sourceUrl) throw new ImportRefusal("database_url_missing");
  assertDestinationDatabase(destUrl);
  if (destUrl === sourceUrl) throw new ImportRefusal("source_and_destination_match");
  const dryRun = argv.includes("--dry-run");
  const orgMap = readMap();
  const dest = await connect(destUrl, false);
  const source = await connect(sourceUrl, true);
  try {
    await source.query(`SET default_transaction_read_only = on`);
    let loaded;
    try {
      loaded = await loadSource((sql) => source.query(sql), { dryRun });
    } catch (err) {
      if (err instanceof ImportRefusal) throw err;
      throw new ImportRefusal("source_read_failed");
    }
    const campus = await loadCampus((sql) => dest.query(sql));
    const plan = planImport({
      source: loaded.snapshot,
      campus,
      orgMap,
      now,
      ids,
      mintToken,
      fileExists,
      uploadRoot,
    });
    const blocked = plan.errors.length > 0 || plan.unexplained.length > 0 || loaded.errors.length > 0;
    if (!dryRun && blocked) {
      log(renderImportReport(plan.counts));
      throw new ImportRefusal(plan.errors[0]?.code || loaded.errors[0]?.code || "unexplained_delta");
    }
    await finishImport({ dest, plan, dryRun, copyFile });
    log(renderImportReport(plan.counts));
    if (blocked) throw new ImportRefusal(plan.errors[0]?.code || loaded.errors[0]?.code || "unexplained_delta");
    return plan.counts;
  } finally {
    await dest.end?.();
    await source.end?.();
  }
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

async function main() {
  const connect = async (url, readOnly) => {
    const postgres = (await import("postgres")).default;
    const sql = postgres(url, { max: 1 });
    return {
      query(text, values) {
        if (readOnly) assertReadOnly(text);
        return sql.unsafe(text, values || []);
      },
      begin(fn) {
        return sql.begin((tx) => fn({
          query(text, values) {
            return tx.unsafe(text, values || []);
          },
        }));
      },
      end() {
        return sql.end({ timeout: 5 });
      },
    };
  };
  await runImport({
    env: process.env,
    argv: process.argv,
    connect,
    readMap: () => readOrgMapText(readFileSync(join(HERE, "aecoach-org-map.json"), "utf8")),
    log: (line) => {
      if (line) console.log(line);
    },
  });
}

if (invokedDirectly()) {
  main().catch((err) => {
    const code = err && err.code ? String(err.code) : "error";
    console.error(`coaching.import failed code=${code.replace(/[^\w.-]/g, "")}`);
    process.exitCode = 1;
  });
}

