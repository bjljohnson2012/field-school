import { NextResponse } from "next/server";
import { registerMember } from "@/lib/members/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await registerMember({
    name: body.name ?? "",
    email: body.email ?? "",
    password: body.password ?? "",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    member: {
      id: result.member.id,
      email: result.member.email,
      name: result.member.name,
    },
  });
}
