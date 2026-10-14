import { handleKnowledgeCron } from "@/lib/gap-loop/cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  return handleKnowledgeCron(request);
}
