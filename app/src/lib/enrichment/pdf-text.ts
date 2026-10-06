import { extractText, getDocumentProxy } from "unpdf";

const MAX_PAGES = 12;

/** Text of an uploaded PDF, one line per text row. Read in memory; the file is never stored. */
export async function pdfText(bytes: Uint8Array): Promise<string | null> {
  if (bytes.length < 5 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") return null;
  try {
    const pdf = await getDocumentProxy(bytes);
    if (pdf.numPages > MAX_PAGES) return null;
    const { text } = await extractText(pdf, { mergePages: false });
    return text.join("\n");
  } catch {
    return null;
  }
}
