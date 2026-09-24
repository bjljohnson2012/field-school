/**
 * One operator email for a failed coaching synthesis.
 * Resend when RESEND_API_KEY is set, otherwise SMTP_*. No new vendor.
 * Dedup is one email per failed subject until that status leaves failed
 * or the row is retried (a new updated_at while failed).
 */

import { accessRequestNotifyEmail } from "@/lib/members/policy";
import { brandedEmailHtml } from "./layout";

export const FAILED_SYNTHESIS_WINDOW_MS = 15 * 60 * 1000;

const NOTE_FROM = "Field School <note@fieldschool.ai>";

export type FailedSynthesisRow = {
  orgId: string;
  membershipId: string;
  synthesisStatus: string | null;
  updatedAt: Date | string | null;
};

type AlertStore = Map<string, string>;

const globalAlerts = globalThis as typeof globalThis & {
  coachingFailedSynthesisAlerts?: AlertStore;
};

function alertStore(): AlertStore {
  if (!globalAlerts.coachingFailedSynthesisAlerts) {
    globalAlerts.coachingFailedSynthesisAlerts = new Map();
  }
  return globalAlerts.coachingFailedSynthesisAlerts;
}

export function resetFailedSynthesisAlerts() {
  alertStore().clear();
}

export function failedSynthesisSubjectKey(orgId: string, membershipId: string) {
  return `${orgId}:${membershipId}`;
}

export function failureStamp(updatedAt: Date | string | null | undefined): string | null {
  if (!updatedAt) return null;
  const at = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  const ms = at.getTime();
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

export function isUnretriedFailedSynthesis(row: FailedSynthesisRow, now: Date) {
  if (row.synthesisStatus !== "failed") return false;
  const stamp = failureStamp(row.updatedAt);
  if (!stamp) return false;
  const age = now.getTime() - new Date(stamp).getTime();
  return age >= 0 && age < FAILED_SYNTHESIS_WINDOW_MS;
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim());
}

function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function mailFrom() {
  return process.env.RESEND_FROM?.trim() || process.env.SMTP_FROM?.trim() || NOTE_FROM;
}

async function sendWithResend(input: { from: string; to: string; subject: string; text: string; html: string }) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
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
  return response.ok;
}

async function sendWithSmtp(input: { from: string; to: string; subject: string; text: string; html: string }) {
  if (!smtpConfigured()) return false;
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
  return true;
}

export async function sendOperatorMail(input: { subject: string; paragraphs: string[] }) {
  const to = accessRequestNotifyEmail();
  const text = input.paragraphs.join("\n");
  const html = brandedEmailHtml({
    title: input.subject,
    paragraphs: input.paragraphs,
  });
  const message = { from: mailFrom(), to, subject: input.subject, text, html };
  try {
    if (resendConfigured()) {
      const emailed = await sendWithResend(message);
      return { emailed };
    }
    if (smtpConfigured()) {
      const emailed = await sendWithSmtp(message);
      return { emailed };
    }
  } catch {
    return { emailed: false };
  }
  return { emailed: false };
}

export async function sendFailedSynthesisAlert(row: Pick<FailedSynthesisRow, "orgId" | "membershipId">) {
  return sendOperatorMail({
    subject: "Coaching synthesis failed",
    paragraphs: [
      "A coaching synthesis is failed, younger than 15 minutes, and has not been retried.",
      `Org: ${row.orgId}`,
      `Subject: ${row.membershipId}`,
    ],
  });
}

export async function alertUnretriedFailedSyntheses(
  rows: FailedSynthesisRow[],
  options: {
    now?: Date;
    send?: (row: FailedSynthesisRow) => Promise<{ emailed: boolean }>;
  } = {},
) {
  const now = options.now ?? new Date();
  const send = options.send ?? sendFailedSynthesisAlert;
  const store = alertStore();
  const stillFailed = new Set<string>();
  for (const row of rows) {
    if (row.synthesisStatus !== "failed" || !row.orgId || !row.membershipId) continue;
    stillFailed.add(failedSynthesisSubjectKey(row.orgId, row.membershipId));
  }
  for (const key of store.keys()) {
    if (!stillFailed.has(key)) store.delete(key);
  }

  let emailed = 0;
  for (const row of rows) {
    if (!isUnretriedFailedSynthesis(row, now)) continue;
    const key = failedSynthesisSubjectKey(row.orgId, row.membershipId);
    const stamp = failureStamp(row.updatedAt);
    if (!stamp || store.get(key) === stamp) continue;
    try {
      const result = await send(row);
      if (result?.emailed) {
        store.set(key, stamp);
        emailed += 1;
      }
    } catch {
      /* leave the episode unclaimed so a later health check can retry the alert */
    }
  }
  return { emailed };
}
