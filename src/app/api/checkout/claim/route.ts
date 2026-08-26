import { NextResponse } from "next/server";
import {
  setPasswordFromClaim,
  setPasswordFromSession,
} from "@/lib/members/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    token?: string;
    session_id?: string;
    name?: string;
    password?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = body.name ?? "";
  const password = body.password ?? "";
  const result = body.token?.trim()
    ? await setPasswordFromClaim({
        token: body.token,
        name,
        password,
      })
    : await setPasswordFromSession({
        sessionId: body.session_id ?? "",
        name,
        password,
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
