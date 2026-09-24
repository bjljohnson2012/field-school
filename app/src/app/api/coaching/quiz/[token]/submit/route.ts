import { requireCoachingWrite } from "@/lib/coaching/writes";
import { handleQuizSubmit } from "@/lib/coaching/quiz-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const blocked = requireCoachingWrite();
  if (blocked) return blocked;

  const { token } = await context.params;
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  return handleQuizSubmit(token, body);
}
