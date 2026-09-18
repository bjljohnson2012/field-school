import { NextResponse } from "next/server";
import { recordNewEnrollment } from "@/lib/members/enroll";
import { guardPublicSubmit } from "@/lib/members/spam";
import { registerMember } from "@/lib/members/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    website?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const blocked = guardPublicSubmit(request, body, "signup");
  if (blocked) return blocked;

  const result = await registerMember({
    name: body.name ?? "",
    email: body.email ?? "",
    password: body.password ?? "",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (result.created) {
    await recordNewEnrollment({
      name: result.member.name,
      email: result.member.email,
    });
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
