import { accessRequestNotifyEmail } from "@/lib/members/policy";
import type { AccessRequest } from "@/lib/members/types";

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim());
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

  if (!smtpConfigured()) {
    console.info(
      "[access-request] stored; email skipped (set SMTP_HOST to notify)",
      { to, subject, email: request.email },
    );
    return { emailed: false, to };
  }

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
    from: process.env.SMTP_FROM?.trim() || to,
    to,
    subject,
    text: body,
  });
  return { emailed: true, to };
}

export async function emailAssessmentResult(input: {
  email: string;
  title: string;
  lines: string[];
  summary: string;
}) {
  const to = input.email;
  const from =
    process.env.SMTP_FROM?.trim() || accessRequestNotifyEmail();
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

  if (!smtpConfigured()) {
    console.info(
      "[assessment-email] newsletter saved; email skipped (set SMTP_HOST to send)",
      { to, subject },
    );
    return { emailed: false, to };
  }

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
    from,
    to,
    subject,
    text,
  });
  return { emailed: true, to };
}
