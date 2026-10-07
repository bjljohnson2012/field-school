export const LINKEDIN_COPY = {
  pdfRequired:
    "Field School does not read LinkedIn pages. On your LinkedIn profile choose More, then Save to PDF, and upload that file here.",
  reviewHint: "Nothing is saved until you accept. Skip anything you don't want on your profile.",
} as const;

export const LINKEDIN_PDF_MAX_BYTES = 5 * 1024 * 1024;
const MAX_CANDIDATES = 80;
const TEXT_MAX = 200;

export type CandidateKind = "headline" | "experience" | "education" | "certification" | "skill";

export type ImportCandidate = {
  id: string;
  kind: CandidateKind;
  title: string;
  organization: string;
  startedOn: string | null;
  endedOn: string | null;
};

/** The profile link is kept as the source label only. Nothing is ever requested from it. */
export function parseProfileUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 300) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  if (url.hostname !== "linkedin.com" && !/^[a-z]{2,3}\.linkedin\.com$/.test(url.hostname)) return null;
  const match = /^\/in\/([A-Za-z0-9\-_%]{3,100})\/?$/.exec(url.pathname);
  return match ? `https://www.linkedin.com/in/${match[1]}` : null;
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH = `(?:${MONTHS.join("|")})`;
const POINT = `(?:${MONTH} \\d{4}|\\d{4})`;
const RANGE = new RegExp(`^(${POINT})\\s*[-–]\\s*(${POINT}|present)(?:\\s*\\(.*\\))?$`, "i");
const DURATION = /^\d+ (?:years?|months?)(?: \d+ months?)?$/i;
const EDUCATION_DATES = /\s*·\s*\((?:[a-z]+ )?(\d{4})\s*[-–]\s*(?:[a-z]+ )?(\d{4})\)\s*$/i;
const FOOTER = /^Page \d+ of \d+$/i;
/** Under one company with several roles, a role's location line must not read as a new company. */
const LOCATION = /,|\b(?:area|remote|hybrid|on-site)\b/i;

const SIDEBAR = new Set(["contact", "top skills", "skills", "languages", "certifications", "honors-awards", "publications", "patents"]);
const MAIN = new Set(["summary", "experience", "education"]);

/** "January 2020" → "2020-01", "2020" → "2020", "Present" → null. */
export function linkedinDate(point: string): string | null {
  const [first, second] = point.trim().toLowerCase().split(/\s+/);
  if (first === "present") return null;
  if (/^\d{4}$/.test(first)) return first;
  const month = MONTHS.indexOf(first);
  return month >= 0 && second && /^\d{4}$/.test(second) ? `${second}-${String(month + 1).padStart(2, "0")}` : null;
}

function clip(text: string) {
  return text.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, TEXT_MAX);
}

function sections(lines: readonly string[]) {
  const out = new Map<string, string[]>();
  let current = "";
  const preMain: string[] = [];
  let seenMain = false;
  for (const line of lines) {
    const header = line.toLowerCase();
    if (SIDEBAR.has(header) || MAIN.has(header)) {
      current = header;
      seenMain ||= MAIN.has(header);
      out.set(current, out.get(current) ?? []);
      continue;
    }
    if (!seenMain) preMain.push(line);
    if (current) out.get(current)?.push(line);
  }
  return { out, preMain };
}

function experience(lines: readonly string[]): Omit<ImportCandidate, "id">[] {
  const found: Omit<ImportCandidate, "id">[] = [];
  let previousDate = -1;
  let organization = "";
  let grouped = false;
  lines.forEach((line, d) => {
    const range = RANGE.exec(line);
    if (!range || d < 1) return;
    const title = lines[d - 1];
    const orgAt = d - 2;
    if (orgAt > previousDate && orgAt >= 1 && DURATION.test(lines[orgAt])) {
      organization = lines[orgAt - 1];
      grouped = true;
    } else if (orgAt > previousDate && orgAt >= 0 && !(grouped && LOCATION.test(lines[orgAt]))) {
      organization = lines[orgAt];
      grouped = false;
    }
    found.push({
      kind: "experience",
      title: clip(title),
      organization: clip(organization),
      startedOn: linkedinDate(range[1]),
      endedOn: linkedinDate(range[2]),
    });
    previousDate = d;
  });
  return found;
}

function education(lines: readonly string[]): Omit<ImportCandidate, "id">[] {
  const found: Omit<ImportCandidate, "id">[] = [];
  lines.forEach((line, i) => {
    const dates = EDUCATION_DATES.exec(line);
    if (!dates || i < 1) return;
    found.push({
      kind: "education",
      title: clip(line.slice(0, dates.index)),
      organization: clip(lines[i - 1]),
      startedOn: dates[1],
      endedOn: dates[2],
    });
  });
  return found;
}

function plain(kind: "skill" | "certification", items: readonly string[] | undefined): Omit<ImportCandidate, "id">[] {
  return (items ?? []).map((title) => ({ kind, title: clip(title), organization: "", startedOn: null, endedOn: null }));
}

/**
 * Turns the text of LinkedIn's "Save to PDF" export into a review list. The layout is
 * LinkedIn's: a sidebar (Contact, Top Skills, Certifications, ...), then name, headline,
 * and location, then Summary, Experience, and Education. Anything misread is fixed or
 * skipped by the User in review.
 */
export function candidatesFromText(text: string): ImportCandidate[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line && !FOOTER.test(line));
  const { out, preMain } = sections(lines);
  const found: Omit<ImportCandidate, "id">[] = [];
  if (preMain.length >= 3) {
    found.push({ kind: "headline", title: clip(preMain[preMain.length - 2]), organization: "", startedOn: null, endedOn: null });
  }
  const sidebarTail = new Set(preMain.slice(-3));
  const sidebarItems = (key: string) => out.get(key)?.filter((line) => !sidebarTail.has(line));
  found.push(...plain("skill", [...(sidebarItems("top skills") ?? []), ...(sidebarItems("skills") ?? [])]));
  found.push(...plain("certification", sidebarItems("certifications")));
  found.push(...experience(out.get("experience") ?? []));
  found.push(...education(out.get("education") ?? []));
  const seen = new Set<string>();
  return found
    .filter((candidate) => {
      const key = `${candidate.kind}|${candidate.title.toLowerCase()}|${candidate.organization.toLowerCase()}`;
      if (!candidate.title || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_CANDIDATES)
    .map((candidate, i) => ({ ...candidate, id: `${candidate.kind}-${i}` }));
}

const KINDS: readonly CandidateKind[] = ["headline", "experience", "education", "certification", "skill"];
const DATE = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

/** Accepted items come back from the browser and are checked again before anything is written. */
export function readCandidate(raw: unknown): ImportCandidate | null {
  if (typeof raw !== "object" || raw === null) return null;
  const get = (key: string): unknown => Object.getOwnPropertyDescriptor(raw, key)?.value;
  const id = get("id");
  const kind = get("kind");
  const title = get("title");
  const organization = get("organization") ?? "";
  const startedOn = get("startedOn") ?? null;
  const endedOn = get("endedOn") ?? null;
  if (typeof id !== "string" || id.length > 40) return null;
  const knownKind = KINDS.find((k) => k === kind);
  if (!knownKind || typeof title !== "string" || typeof organization !== "string") return null;
  const cleanTitle = clip(title);
  if (!cleanTitle || title.length > TEXT_MAX * 2 || organization.length > TEXT_MAX * 2) return null;
  for (const date of [startedOn, endedOn]) {
    if (date !== null && (typeof date !== "string" || !DATE.test(date))) return null;
  }
  return {
    id,
    kind: knownKind,
    title: cleanTitle,
    organization: clip(organization),
    startedOn: typeof startedOn === "string" ? startedOn : null,
    endedOn: typeof endedOn === "string" ? endedOn : null,
  };
}
