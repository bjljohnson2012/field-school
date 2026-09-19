export type SignalUnit = {
  title: string;
  subject?: string;
  status?: string;
  confidence?: string;
  flag?: string;
};

export type SignalIntent = {
  goals?: string[];
  subjects?: string[];
  themes?: string[];
  timeHorizon?: string;
} | null;

export type SignalPortion = {
  title?: string;
  reason?: string;
  status?: string;
  items?: Array<{ title: string; subject?: string }>;
} | null;

export type FamilySignalsInput = {
  childName: string;
  intent: SignalIntent;
  pathItems: Array<{ title: string; subject?: string }>;
  completed: SignalUnit[];
  inProgress: SignalUnit[];
  recommended: SignalUnit[];
  units: SignalUnit[];
  portion: SignalPortion;
  locked: boolean;
};

function capitalize(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "This path";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function confidenceLabel(value: string) {
  if (value === "not_yet") return "Not yet";
  if (value === "getting_there") return "Getting there";
  if (value === "ready") return "Ready";
  return "";
}

export function rollupConfidence(units: SignalUnit[]): "not_yet" | "getting_there" | "ready" | "" {
  const values = units.map((unit) => unit.confidence).filter(Boolean);
  if (!values.length) return "";
  if (values.every((value) => value === "ready")) return "ready";
  if (values.some((value) => value === "ready" || value === "getting_there")) return "getting_there";
  return "not_yet";
}

export function buildFamilySignals(opts: FamilySignalsInput) {
  const total = opts.pathItems.length || opts.units.length;
  const done = opts.completed.length;
  const lastCompleted = opts.completed[opts.completed.length - 1];
  const revisit = opts.units.filter(
    (unit) => unit.flag === "stuck" || (unit.status === "completed" && unit.confidence === "not_yet"),
  );
  const state = rollupConfidence(opts.units.filter((unit) => unit.confidence));
  const label = confidenceLabel(state) || "Not yet";
  const focus = opts.inProgress[0] || revisit[0] || lastCompleted;
  const subject = focus?.subject || opts.intent?.subjects?.[0] || "this path";
  const nextTitle =
    opts.portion?.items?.[0]?.title || opts.recommended[0]?.title || "the next portion";
  const copy = lastCompleted
    ? `${capitalize(subject)} on this path are ${label}. ${
        revisit.length
          ? `Revisit ${revisit[0].title} before the next portion.`
          : `Next is ${nextTitle}.`
      }`
    : opts.intent
      ? `No units complete yet for ${opts.childName}. Intent is set${
          opts.intent.timeHorizon ? ` for ${opts.intent.timeHorizon}` : ""
        }.`
      : `No units complete yet for ${opts.childName}. Save intent, then accept a path.`;

  const intentSubjects = (opts.intent?.subjects ?? []).map((item) => item.toLowerCase());
  const coveredSubjects = opts.completed
    .map((unit) => (unit.subject || "").toLowerCase())
    .filter(Boolean);
  const matched = intentSubjects.filter((item) => coveredSubjects.includes(item));
  const intentMatch = intentSubjects.length
    ? matched.length
      ? `Intent match: ${matched.join(", ")} covered.`
      : "Intent is set. No subject coverage yet."
    : "Intent match waits on a saved intent.";

  const portionItems = opts.portion?.items?.length ? opts.portion.items : opts.recommended;

  return {
    now: {
      copy,
      completed: opts.completed.map((unit) => unit.title),
      coverage: { done, total },
      coverageLabel: total ? `${done} of ${total} units on this path` : "No path units yet",
      revisit: revisit.map((unit) => unit.title),
      intentMatch,
    },
    confidence: {
      state,
      label,
      stuck: opts.units.filter((unit) => unit.flag === "stuck").map((unit) => unit.title),
      easy: opts.units.filter((unit) => unit.flag === "easy").map((unit) => unit.title),
      units: opts.units,
    },
    next: {
      title: opts.portion?.title || opts.recommended[0]?.title || "",
      reason: opts.portion?.reason || "",
      locked: opts.locked,
      items: portionItems.map((item) => ({
        title: item.title,
        subject: item.subject || "",
      })),
      empty: portionItems.length === 0,
    },
  };
}
