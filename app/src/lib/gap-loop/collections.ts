/**
 * Payload-shaped descriptors for the Knowledge-Gap Loop tables.
 * Stored with Drizzle. No live Payload.
 */

type Field = { name: string; type: string; required?: boolean };
type Collection = {
  slug: string;
  label: string;
  fields: Field[];
  relations: string[];
  versions: boolean;
  access: { read: string; write: string };
};

const ownerFields: Field[] = [
  { name: "org_id", type: "relationship", required: true },
  { name: "growth_unit_id", type: "relationship", required: true },
  { name: "owner_kind", type: "select", required: true },
  { name: "owner_membership_id", type: "relationship", required: true },
  { name: "child_membership_id", type: "relationship" },
];

export const GAP_LOOP_COLLECTIONS: readonly Collection[] = [
  {
    slug: "outcomes",
    label: "Outcomes",
    fields: [
      ...ownerFields,
      { name: "title", type: "text", required: true },
      { name: "statement", type: "textarea", required: true },
      { name: "horizon", type: "text" },
      { name: "done_conditions", type: "json" },
      { name: "status", type: "select", required: true },
      { name: "version", type: "number", required: true },
      { name: "supersedes_id", type: "relationship" },
      { name: "intent_id", type: "relationship" },
    ],
    relations: ["growth_units", "learning_intents"],
    versions: true,
    access: { read: "owner or staff in this org", write: "owner. child membership denied" },
  },
  {
    slug: "outcome_requirements",
    label: "Outcome requirements",
    fields: [
      ...ownerFields,
      { name: "outcome_id", type: "relationship", required: true },
      { name: "sort_order", type: "number", required: true },
      { name: "label", type: "text", required: true },
      { name: "kind", type: "select", required: true },
      { name: "weight", type: "number", required: true },
      { name: "done_condition", type: "json", required: true },
      { name: "coverage", type: "number", required: true },
      { name: "system_confidence", type: "select", required: true },
      { name: "status", type: "select", required: true },
      { name: "origin", type: "select", required: true },
    ],
    relations: ["outcomes"],
    versions: false,
    access: { read: "same as the outcome", write: "owner confirms or edits before scoring" },
  },
  {
    slug: "knowledge_nodes",
    label: "Knowledge nodes",
    fields: [
      ...ownerFields,
      { name: "requirement_id", type: "relationship" },
      { name: "kind", type: "select", required: true },
      { name: "label", type: "text", required: true },
      { name: "body", type: "textarea" },
      { name: "sha256", type: "text" },
      { name: "filename", type: "text" },
      { name: "ref_table", type: "text" },
      { name: "ref_id", type: "text" },
      { name: "evidence", type: "json", required: true },
      { name: "status", type: "select", required: true },
    ],
    relations: ["growth_units", "outcome_requirements"],
    versions: false,
    access: { read: "owner in this org", write: "loop only, with at least one citation" },
  },
  {
    slug: "knowledge_edges",
    label: "Knowledge edges",
    fields: [
      ...ownerFields,
      { name: "from_node", type: "relationship", required: true },
      { name: "to_node", type: "relationship", required: true },
      { name: "rel", type: "select", required: true },
      { name: "because", type: "textarea", required: true },
      { name: "evidence", type: "json", required: true },
      { name: "weight", type: "number", required: true },
      { name: "status", type: "select", required: true },
      { name: "origin", type: "text", required: true },
    ],
    relations: ["knowledge_nodes"],
    versions: false,
    access: { read: "owner in this org", write: "loop only, with at least one citation" },
  },
  {
    slug: "gap_findings",
    label: "Gap findings",
    fields: [
      ...ownerFields,
      { name: "outcome_id", type: "relationship", required: true },
      { name: "requirement_id", type: "relationship", required: true },
      { name: "kind", type: "select", required: true },
      { name: "summary", type: "textarea", required: true },
      { name: "coverage_at_find", type: "number", required: true },
      { name: "priority", type: "number", required: true },
      { name: "status", type: "select", required: true },
      { name: "reject_reason", type: "textarea" },
      { name: "evidence_key", type: "text", required: true },
      { name: "found_in_run_id", type: "relationship" },
    ],
    relations: ["outcomes", "outcome_requirements", "loop_runs"],
    versions: false,
    access: { read: "owner", write: "owner may reject, waive, or reopen" },
  },
  {
    slug: "research_tasks",
    label: "Research tasks",
    fields: [
      ...ownerFields,
      { name: "gap_id", type: "relationship", required: true },
      { name: "question", type: "textarea", required: true },
      { name: "channel", type: "select", required: true },
      { name: "request_copy", type: "textarea", required: true },
      { name: "status", type: "select", required: true },
      { name: "query_text", type: "textarea" },
      { name: "approved_by_membership_id", type: "relationship" },
      { name: "approved_at", type: "date" },
      { name: "response", type: "json" },
    ],
    relations: ["gap_findings"],
    versions: false,
    access: { read: "owner", write: "owner responds. web channel stays closed in M1" },
  },
  {
    slug: "loop_runs",
    label: "Loop runs",
    fields: [
      ...ownerFields,
      { name: "outcome_id", type: "relationship", required: true },
      { name: "state", type: "select", required: true },
      { name: "cycle", type: "number", required: true },
      { name: "step_count", type: "number", required: true },
      { name: "max_steps", type: "number", required: true },
      { name: "no_progress_cycles", type: "number", required: true },
      { name: "last_score", type: "number", required: true },
      { name: "stop_reason", type: "text" },
      { name: "lease_owner", type: "text" },
      { name: "lease_until", type: "date" },
    ],
    relations: ["outcomes"],
    versions: false,
    access: { read: "owner", write: "one runner holds the lease" },
  },
  {
    slug: "loop_events",
    label: "Loop events",
    fields: [
      ...ownerFields,
      { name: "run_id", type: "relationship", required: true },
      { name: "seq", type: "number", required: true },
      { name: "idempotency_key", type: "text", required: true },
      { name: "from_state", type: "text", required: true },
      { name: "to_state", type: "text", required: true },
      { name: "kind", type: "text", required: true },
      { name: "summary", type: "textarea", required: true },
      { name: "detail", type: "json", required: true },
      { name: "model", type: "text" },
      { name: "tokens_in", type: "number" },
      { name: "tokens_out", type: "number" },
    ],
    relations: ["loop_runs"],
    versions: false,
    access: { read: "owner", write: "append only" },
  },
];
