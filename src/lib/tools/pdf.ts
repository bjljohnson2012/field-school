import type { AssessmentShare } from "@/lib/tools/share";

function escapePdf(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapWords(text: string, width: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function latin1(text: string) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function assessmentPdfFilename(share: AssessmentShare) {
  return `field-school-${share.toolSlug}.pdf`;
}

export function buildAssessmentPdf(share: AssessmentShare) {
  const wrapped = [
    "Field School",
    "Training portal",
    "",
    share.title,
    share.completedAt.slice(0, 10),
    "",
    ...share.lines.flatMap((line) => wrapWords(line, 86)),
    "",
    wrapWords(share.summary, 86),
  ].flat();

  const ops = ["BT", "/F1 16 Tf", "72 720 Td", `(${escapePdf(wrapped[0] ?? "Field School")}) Tj`];
  for (const line of wrapped.slice(1)) {
    ops.push("0 -18 Td", `/F1 11 Tf`, `(${escapePdf(line || " ")}) Tj`);
  }
  ops.push("ET");
  const stream = ops.join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }
  const xrefStart = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  body += xref;
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return latin1(body);
}

export function downloadAssessmentPdf(share: AssessmentShare) {
  const bytes = buildAssessmentPdf(share);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = assessmentPdfFilename(share);
  link.click();
  URL.revokeObjectURL(url);
}
