import { parseToolSubmission, submissionBody, type ToolSubmission } from "@/lib/tools/results";

const KEY = "fsu-pending-tool";

export function stashPendingTool(submission: ToolSubmission) {
  sessionStorage.setItem(KEY, JSON.stringify(submissionBody(submission)));
}

function readStash(): ToolSubmission | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = parseToolSubmission(JSON.parse(raw));
    if (parsed.ok) return parsed.submission;
  } catch {}
  sessionStorage.removeItem(KEY);
  return null;
}

/** Read without removing: the stash is cleared only after the server keeps the attempt. */
export function peekPendingTool(slug: string): ToolSubmission | null {
  const pending = readStash();
  return pending?.toolSlug === slug ? pending : null;
}

export function clearPendingTool(attemptId: string) {
  if (readStash()?.attemptId === attemptId) sessionStorage.removeItem(KEY);
}
