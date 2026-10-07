/** Human labels for stored knowledge. Raw ids, slugs, and file codes stay off the desk. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[a-z0-9]{16,}$/i;
const FILE = /^[^ ]+\.[a-z0-9]{1,8}$/i;

export function looksLikeCode(value: string): boolean {
  const text = value.trim();
  if (!text) return true;
  if (UUID.test(text) || TOKEN.test(text)) return true;
  if (FILE.test(text)) return true;
  return !/\s/.test(text) && /[_-]/.test(text) && text.length > 18;
}

export function readableTitle(title: string, excerpt: string): string {
  const clean = title.replace(/\s+/g, " ").trim();
  if (!looksLikeCode(clean)) return clean;
  const sentence = excerpt.replace(/\s+/g, " ").trim().split(/[.?!]/)[0]?.trim() ?? "";
  if (sentence.length >= 12 && !looksLikeCode(sentence)) {
    return sentence.length > 72 ? `${sentence.slice(0, 71)}…` : sentence;
  }
  return "Untitled";
}

export function publishLabel(status: string): "Published" | "Unpublished" {
  return status === "published" ? "Published" : "Unpublished";
}

export function sourceLabel(kind: string): string | null {
  if (kind === "text") return "Note";
  if (kind === "upload") return "File";
  if (kind === "link") return "Link";
  if (kind === "book") return "Book";
  if (kind === "audio") return "Audio";
  if (kind === "idea") return "Idea";
  return null;
}
