import { NextResponse } from "next/server";
import {
  corsHeadersForOrigin,
  isAllowedFormOrigin,
  validateFormInput,
} from "@/lib/members/forms";
import { createFormSubmission } from "@/lib/members/store";

export const runtime = "nodejs";

function requestOrigin(request: Request) {
  return request.headers.get("origin");
}

export async function OPTIONS(request: Request) {
  const origin = requestOrigin(request);
  if (!isAllowedFormOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersForOrigin(origin),
  });
}

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  return (await request.json()) as Record<string, unknown>;
}

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const headers = corsHeadersForOrigin(origin);
  if (origin && !isAllowedFormOrigin(origin)) {
    return NextResponse.json(
      { error: "This form only accepts posts from Field School." },
      { status: 403, headers },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await readBody(request);
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers },
    );
  }

  const parsed = validateFormInput(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers },
    );
  }
  if (parsed.spam) {
    return NextResponse.json({ ok: true }, { headers });
  }

  const result = await createFormSubmission({
    kind: parsed.kind,
    name: parsed.name,
    email: parsed.email,
    message: parsed.message,
    source: parsed.source,
  });

  return NextResponse.json(
    { ok: true, id: result.submission.id },
    { headers },
  );
}
