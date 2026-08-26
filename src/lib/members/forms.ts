import { isValidEmail, normalizeEmail } from "@/lib/members/policy";
import {
  FORM_KINDS,
  type FormKind,
  type FormSubmission,
} from "@/lib/members/types";

export const FORM_LABELS: Record<FormKind, string> = {
  saturday_note: "Saturday list",
  topic_request: "Topic requests",
  shop_waitlist: "Shop waitlist",
};

export const MAX_FORM_NAME = 120;
export const MAX_FORM_MESSAGE = 2000;
export const MAX_FORM_SOURCE = 200;

const PUBLIC_FORM_ORIGINS = [
  "https://fieldschool.ai",
  "https://www.fieldschool.ai",
  "https://portal.fieldschool.ai",
  "https://university.benjohnson.ai",
];

export function isFormKind(value: unknown): value is FormKind {
  return typeof value === "string" && (FORM_KINDS as readonly string[]).includes(value);
}

export function formKindLabel(kind: FormKind) {
  return FORM_LABELS[kind];
}

export function isAllowedFormOrigin(origin: string | null) {
  if (!origin) return false;
  if (PUBLIC_FORM_ORIGINS.includes(origin)) return true;
  if (process.env.NODE_ENV !== "production") {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }
  return false;
}

export function corsHeadersForOrigin(origin: string | null): Record<string, string> {
  if (!isAllowedFormOrigin(origin) || !origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function validateFormInput(input: {
  kind?: unknown;
  name?: unknown;
  email?: unknown;
  message?: unknown;
  source?: unknown;
  website?: unknown;
}):
  | {
      ok: true;
      spam: boolean;
      kind: FormKind;
      name: string;
      email: string;
      message: string;
      source: string;
    }
  | { ok: false; error: string } {
  if (typeof input.website === "string" && input.website.trim()) {
    return {
      ok: true,
      spam: true,
      kind: "saturday_note",
      name: "",
      email: "",
      message: "",
      source: "",
    };
  }

  if (!isFormKind(input.kind)) {
    return { ok: false, error: "Unknown form." };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = normalizeEmail(typeof input.email === "string" ? input.email : "");
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const source = typeof input.source === "string" ? input.source.trim() : "";

  if (name.length > MAX_FORM_NAME) {
    return { ok: false, error: "Name is too long." };
  }
  if (message.length > MAX_FORM_MESSAGE) {
    return { ok: false, error: "That note is too long." };
  }
  if (source.length > MAX_FORM_SOURCE) {
    return { ok: false, error: "Source is too long." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  if (input.kind === "topic_request" && !name) {
    return { ok: false, error: "Name is required." };
  }
  if (input.kind === "topic_request" && !message) {
    return { ok: false, error: "Tell us the topic you want covered." };
  }

  return {
    ok: true,
    spam: false,
    kind: input.kind,
    name,
    email,
    message,
    source,
  };
}

export function sortFormSubmissions(rows: FormSubmission[]) {
  return [...rows].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}
