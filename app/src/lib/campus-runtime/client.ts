export type ServerProgress = {
  authenticated: boolean;
  guest?: boolean;
  course?: string;
  org?: string;
  membershipId?: string;
  modules?: Record<
    string,
    {
      watched: boolean;
      assignment: Record<string, boolean>;
      notes: string;
      quizScore: number | null;
      quizPassed: boolean;
      passed: boolean;
    }
  >;
  exam?: { score: number; passed: boolean; at: string } | null;
  certified?: boolean;
  imported?: boolean;
  passed?: number;
  total?: number;
  examTotal?: number;
};

export async function fetchMe() {
  const res = await fetch("/api/me", { credentials: "same-origin" });
  return res.json();
}

export async function fetchProgress(course: string): Promise<ServerProgress> {
  const res = await fetch(`/api/progress?course=${encodeURIComponent(course)}`, {
    credentials: "same-origin",
  });
  return res.json();
}

export async function postProgress(input: {
  course: string;
  station: string;
  kind: "watch" | "practice" | "check" | "exam";
  answers?: Record<string, number>;
  assignment?: Record<string, boolean>;
  notes?: string;
}) {
  const res = await fetch("/api/progress", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json() as Promise<{
    ok: boolean;
    score?: number;
    passed?: boolean;
    progress?: ServerProgress;
  }>;
}

export async function importServerProgress(
  course: string,
  snapshot: {
    modules: NonNullable<ServerProgress["modules"]>;
    exam: NonNullable<ServerProgress["exam"]> | null;
  },
) {
  const res = await fetch("/api/progress/import", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ course, modules: snapshot.modules, exam: snapshot.exam }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { progress?: ServerProgress };
  return body.progress ?? null;
}

export async function postLearningEvent(input: {
  kind: "watch" | "quiz" | "assignment";
  course: string;
  station: string;
  score?: number;
  raw?: Record<string, unknown>;
}) {
  const res = await fetch("/api/events", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}
