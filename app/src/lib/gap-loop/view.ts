export type RequirementView = {
  id: string;
  label: string;
  kind: string;
  weight: number;
  coverage: number;
  systemConfidence: "Low" | "Medium" | "High";
  status: string;
  sortOrder: number;
  doneCondition: { evidenceType: string; text: string };
};

export type GapView = {
  id: string;
  requirementId: string;
  kind: string;
  summary: string;
  coverage: number;
  priority: number;
  status: string;
  rejectReason: string;
  evidenceKey: string;
};

export type TaskView = {
  id: string;
  gapId: string;
  question: string;
  channel: string;
  requestCopy: string;
  status: string;
  links: { href: string; label: string }[];
};

export type EventView = {
  seq: number;
  kind: string;
  summary: string;
  fromState: string;
  toState: string;
  createdAt: string;
};

export type RunView = {
  id: string;
  state: string;
  cycle: number;
  stepCount: number;
  noProgressCycles: number;
  lastScore: number;
  stopReason: string | null;
};

export type OutcomeView = {
  id: string;
  title: string;
  statement: string;
  horizon: string;
  status: string;
  version: number;
  ownerKind: string;
  childMembershipId: string | null;
  createdAt: string;
};

export type WorkspaceView = {
  outcome: OutcomeView;
  run: RunView;
  requirements: RequirementView[];
  gaps: GapView[];
  task: TaskView | null;
  events: EventView[];
  sources: { id: string; label: string; filename: string }[];
  signals: {
    now: { coverageLabel: string; copy: string };
    confidence: null;
    systemConfidence: string;
    next: { title: string; reason: string; locked: false };
  };
};
