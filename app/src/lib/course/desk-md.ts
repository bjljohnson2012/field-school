import type { StaffDesk } from "./types";

export function deskToMarkdown(desk: StaffDesk) {
  const bots = desk.bots
    .filter((b) => b.name.trim())
    .map(
      (b) =>
        `### ${b.name}\n\n- **Job:** ${b.job || "—"}\n- **Voice:** ${b.voice || "—"}\n- **Plugins:** ${b.plugins.length ? b.plugins.join(", ") : "—"}\n`,
    )
    .join("\n");
  const routines = desk.routines
    .filter((r) => r.name.trim())
    .map(
      (r) =>
        `### ${r.name}\n\n- **When:** ${r.when || "—"}\n- **Does:** ${r.does || "—"}\n`,
    )
    .join("\n");
  return `# Share Desk — ${desk.operator || "Operator"}

**Business / context:** ${desk.business || "—"}

This is an operating brief for a Grok Bot staff. One job per bot. Routines wake them. Humans keep send / pay / approve.

## Staff

${bots || "_No bots named yet._"}

## Routines

${routines || "_No routines yet._"}

## Overnight brief (potato)

${desk.overnightBrief || "_Not written._"}

## Rules

1. One bot, one job.
2. Cloud computer stays signed in. Do not re-auth every agent.
3. Teach Task for click-paths. Routines for circadian work.
4. Specialists may veto each other. Committees may not ship.
5. Kill switch: unplug if it emails, charges, or publishes PII without a human.

---
Generated in Field School from Ray Fernando's Grok Bot walkthrough.
`;
}
