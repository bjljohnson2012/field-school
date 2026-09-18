import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveCheckoutDestination } from "@/lib/billing/checkout-destination";
import { getPaidPlan } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { plan?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const plan = getPaidPlan(body.plan);
  if (!plan) {
    return NextResponse.json({ error: "Unknown paid plan." }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const destination = await resolveCheckoutDestination({
    plan,
    email: session?.user?.email,
  });

  return NextResponse.json({
    url: destination.url,
    via: destination.via,
    plan: plan.id,
  });
}
