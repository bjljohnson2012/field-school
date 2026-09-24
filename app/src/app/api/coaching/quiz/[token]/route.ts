import { handleQuizGet } from "@/lib/coaching/quiz-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return handleQuizGet(token);
}
