import { accessRequestNotifyEmail } from "@/lib/members/policy";
import type { AccessRequest } from "@/lib/members/types";

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim());
}

function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function mailFrom(fallback: string) {
  return (
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    fallback
  );
}

async function sendWithResend(input: {
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { emailed: false as const };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend rejected the send (${response.status}): ${detail}`);
  }
  return { emailed: true as const };
}

async function sendWithSmtp(input: {
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  if (!smtpConfigured()) return { emailed: false as const };

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  await transporter.sendMail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  return { emailed: true as const };
}

async function sendTextMail(input: {
  to: string;
  subject: string;
  text: string;
  from: string;
  skipLog: string;
}) {
  if (resendConfigured()) {
    await sendWithResend(input);
    return { emailed: true, to: input.to };
  }
  if (smtpConfigured()) {
    await sendWithSmtp(input);
    return { emailed: true, to: input.to };
  }
  console.info(input.skipLog, { to: input.to, subject: input.subject });
  return { emailed: false, to: input.to };
}

export async function notifyAccessRequest(request: AccessRequest) {
  const to = accessRequestNotifyEmail();
  const subject = `Staff access request: ${request.name}`;
  const body = [
    "A campus member asked for staff access.",
    "",
    `Name: ${request.name}`,
    `Email: ${request.email}`,
    `Provider: ${request.provider}`,
    `Submitted: ${request.createdAt}`,
    `Note: ${request.note || "(none)"}`,
    "",
    "Review pending requests at /admin/access-requests.",
  ].join("\n");

  return sendTextMail({
    to,
    subject,
    text: body,
    from: mailFrom(to),
    skipLog:
      "[access-request] stored; email skipped (set RESEND_API_KEY or SMTP_HOST to notify)",
  });
}

export async function emailAssessmentResult(input: {
  email: string;
  title: string;
  lines: string[];
  summary: string;
}) {
  const to = input.email;
  const subject = `Your Field School ${input.title}`;
  const text = [
    input.title,
    "",
    ...input.lines,
    "",
    input.summary,
    "",
    "You are on the Saturday newsletter.",
    "https://fieldschool.ai/newsletter",
  ].join("\n");

  return sendTextMail({
    to,
    subject,
    text,
    from: mailFrom(accessRequestNotifyEmail()),
    skipLog:
      "[assessment-email] newsletter saved; email skipped (set RESEND_API_KEY or SMTP_HOST to send)",
  });
}

export async function emailSeatConfirmation(input: {
  email: string;
  subject: string;
  text: string;
}) {
  return sendTextMail({
    to: input.email,
    subject: input.subject,
    text: input.text,
    from: mailFrom("Field School <note@fieldschool.ai>"),
    skipLog:
      "[seat-email] seat granted; email skipped (set RESEND_API_KEY or SMTP_HOST to send)",
  });
}
