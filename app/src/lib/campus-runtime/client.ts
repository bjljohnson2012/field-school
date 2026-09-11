export type ServerProgress = {
  authenticated: boolean;
  guest?: boolean;
  course?: string;
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
