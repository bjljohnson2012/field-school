export type ToolStatus = "live" | "coming";
export type ToolCategory =
  | "intelligence"
  | "skill"
  | "checklist"
  | "personality";

export type AssessmentTool = {
  slug: string;
  title: string;
  category: ToolCategory;
  status: ToolStatus;
  kicker: string;
  minutes: string;
  summary: string;
  comingNote?: string;
};

export const assessmentTools: AssessmentTool[] = [
  {
    slug: "skill",
    title: "Skill assessment",
    category: "skill",
    status: "live",
    kicker: "What you can already run",
    minutes: "8 min",
    summary:
      "Rate the work you can actually do today — briefs, tools, shipping, and keeping a human on the risky clicks. Results stay on your portal.",
  },
  {
    slug: "intelligence",
    title: "Intelligence assessment",
    category: "intelligence",
    status: "live",
    kicker: "How you take in work",
    minutes: "7 min",
    summary:
      "A working-intelligence profile: how you notice, decide, and learn. Not a vendor IQ score. Saved next to your courses so the next ladder fits.",
  },
  {
    slug: "tool-checklist",
    title: "Tool assessment checklist",
    category: "checklist",
    status: "coming",
    kicker: "Coming later",
    minutes: "—",
    summary:
      "A checklist for the tools a job actually needs — logins, paid seats, and what can be practiced without the license.",
    comingNote:
      "This slot is reserved. When it ships, completions will land on the same portal as skill and intelligence.",
  },
  {
    slug: "personality",
    title: "Personality checklist",
    category: "personality",
    status: "coming",
    kicker: "Coming later",
    minutes: "—",
    summary:
      "A short working-style checklist so a staff brief matches how you actually operate — not a party quiz.",
    comingNote:
      "Reserved for a later drop. The registry is already wired so a new checklist can save beside your other tools.",
  },
];

export function getTool(slug: string) {
  return assessmentTools.find((t) => t.slug === slug);
}

export function liveTools() {
  return assessmentTools.filter((t) => t.status === "live");
}
