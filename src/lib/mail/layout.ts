export const MAIL_LOGO_URL =
  process.env.MAIL_LOGO_URL?.trim() ||
  "https://fieldschool.ai/img/field-school-lockup.png";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function brandedEmailHtml(input: {
  title: string;
  paragraphs: string[];
  action?: { href: string; label: string } | null;
}) {
  const paragraphs = input.paragraphs
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-family:IBM Plex Sans,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#5c5850;">${linkify(escapeHtml(line))}</p>`,
    )
    .join("");

  const button = input.action
    ? `<p style="margin:24px 0 8px;"><a href="${escapeHtml(input.action.href)}" style="display:inline-block;background:#1f5eff;color:#ffffff;font-family:IBM Plex Sans,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:12px 18px;border-radius:10px;">${escapeHtml(input.action.label)}</a></p>`
    : "";

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f6f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ec;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border:1px solid #d8d2c6;border-radius:12px;">
          <tr>
            <td style="padding:28px 32px 12px;background:#f6f3ec;border-bottom:1px solid #d8d2c6;border-radius:12px 12px 0 0;">
              <img src="${MAIL_LOGO_URL}" width="220" alt="Field School" style="display:block;border:0;width:220px;max-width:100%;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px;">
              <h1 style="margin:0 0 16px;font-family:Fraunces,Georgia,Times,serif;font-size:28px;line-height:1.2;letter-spacing:-0.03em;color:#1a1916;">${escapeHtml(input.title)}</h1>
              ${paragraphs}
              ${button}
              <p style="margin:28px 0 0;font-family:IBM Plex Sans,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#5c5850;">Field School<br>Lead yourself. Learn yourself. Do the Work.<br><a href="https://fieldschool.ai" style="color:#1f5eff;text-decoration:none;">fieldschool.ai</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function linkify(escaped: string) {
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1f5eff;text-decoration:underline;">$1</a>',
  );
}
