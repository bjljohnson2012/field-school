import { brandedEmailHtml } from "@/lib/mail/layout";
import { accessRequestNotifyEmail } from "@/lib/members/policy";
import type { AccessRequest } from "@/lib/members/types";

const NOTE_FROM = "Field School <note@fieldschool.ai>";
const PORTAL = "https://portal.fieldschool.ai";
const NEWSLETTER = "https://fieldschool.ai/newsletter";

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
  html?: string;
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
      html: input.html,
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
  html?: string;
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
    html: input.html,
  });
  return { emailed: true as const };
}

async function sendTextMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
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
  const paragraphs = [
    "A campus member asked for staff access.",
    `Name: ${request.name}`,
    `Email: ${request.email}`,
    `Provider: ${request.provider}`,
    `Submitted: ${request.createdAt}`,
    `Note: ${request.note || "(none)"}`,
  ];
  const review = `${PORTAL}/admin/access-requests`;

  return sendTextMail({
    to,
    subject,
    text: [...paragraphs, "", `Review pending requests: ${review}`].join("\n"),
    html: brandedEmailHtml({
      title: "Staff access request",
      paragraphs,
      action: { href: review, label: "Review requests" },
    }),
    from: mailFrom(NOTE_FROM),
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
    html: brandedEmailHtml({
      title: input.title,
      paragraphs: [...input.lines, input.summary, "You are on the Saturday newsletter."],
      action: { href: NEWSLETTER, label: "Open the newsletter" },
    }),
    from: mailFrom(NOTE_FROM),
    skipLog:
      "[assessment-email] newsletter saved; email skipped (set RESEND_API_KEY or SMTP_HOST to send)",
  });
}

export async function emailSeatConfirmation(input: {
  email: string;
  subject: string;
  text: string;
  title: string;
  paragraphs: string[];
  action: { href: string; label: string };
}) {
  return sendTextMail({
    to: input.email,
    subject: input.subject,
    text: input.text,
    html: brandedEmailHtml({
      title: input.title,
      paragraphs: input.paragraphs,
      action: input.action,
    }),
    from: mailFrom(NOTE_FROM),
    skipLog:
      "[seat-email] seat granted; email skipped (set RESEND_API_KEY or SMTP_HOST to send)",
  });
}
