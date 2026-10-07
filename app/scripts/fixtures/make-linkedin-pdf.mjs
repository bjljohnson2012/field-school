// Writes a small text-only PDF laid out like LinkedIn's "Save to PDF" export, for parser tests.
// Usage: node scripts/fixtures/make-linkedin-pdf.mjs > scripts/fixtures/linkedin-export.pdf

export const LINKEDIN_LINES = [
  "Contact",
  "www.linkedin.com/in/ada-example (LinkedIn)",
  "Top Skills",
  "Writing Briefs",
  "Product Strategy",
  "TypeScript",
  "Certifications",
  "Certified Scrum Product Owner",
  "Ada Example",
  "Operations lead at Northwind",
  "Rochester, New York",
  "Summary",
  "I run small teams that ship.",
  "Experience",
  "Northwind",
  "4 years 2 months",
  "Operations Lead",
  "March 2022 - Present (2 years 7 months)",
  "Rochester, New York",
  "Operations Analyst",
  "September 2020 - February 2022 (1 year 6 months)",
  "Contoso",
  "Project Coordinator",
  "June 2017 - August 2020 (3 years 3 months)",
  "Page 1 of 2",
  "Education",
  "University of Rochester",
  "Bachelor of Arts - BA, Economics · (2013 - 2017)",
];

function escape(text) {
  return text.replace(/[\\()]/g, (c) => `\\${c}`).replace(/·/g, "\\267");
}

export function linkedinPdf(lines = LINKEDIN_LINES) {
  const content = ["BT", "/F1 10 Tf", "12 TL", "40 780 Td"];
  for (const line of lines) content.push(`(${escape(line)}) Tj`, "T*");
  content.push("ET");
  const stream = content.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body, "latin1");
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(body, "latin1"));
}

if (import.meta.url === `file://${process.argv[1]}`) process.stdout.write(linkedinPdf());
