export type ToolKind =
  | "intelligence"
  | "skill"
  | "personality"
  | "checklist";

export type AssessmentTool = {
  slug: string;
  title: string;
  kind: ToolKind;
  summary: string;
  /** Ready tools are interactive; others show as coming soon. */
  status: "ready" | "coming-soon";
};

/**
 * Catalog of portal tools. Add new assessments here; results persist via
 * `tool_results` so learners can track them alongside course progress.
 */
export const ASSESSMENT_TOOLS: AssessmentTool[] = [
  {
    slug: "intelligence-assessment",
    title: "Intelligence assessment",
    kind: "intelligence",
    summary:
      "A baseline read on how you learn, decide, and apply judgment under ambiguity.",
    status: "coming-soon",
  },
  {
    slug: "skill-assessment",
    title: "Skill assessment",
    kind: "skill",
    summary:
      "Map what you can already do against the skills Field School courses build.",
    status: "coming-soon",
  },
  {
    slug: "personality-checklist",
    title: "Personality checklist",
    kind: "personality",
    summary:
      "A lightweight profile so your portal and course recommendations stay personal.",
    status: "coming-soon",
  },
  {
    slug: "tool-assessment-checklist",
    title: "Tool assessment checklist",
    kind: "checklist",
    summary:
      "Inventory the tools you already use and the ones you still need before a course.",
    status: "coming-soon",
  },
];

export function getTool(slug: string) {
  return ASSESSMENT_TOOLS.find((t) => t.slug === slug) ?? null;
}
