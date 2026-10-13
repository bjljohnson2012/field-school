const STORAGE_KEY = "fs.marketing.visits";
const CAP = 40;

export const CLICK_RULES = [
  {
    name: "start-free",
    match: (href) => href.startsWith("https://portal.fieldschool.ai/signup"),
  },
  {
    name: "sign-in",
    match: (href) => href.startsWith("https://portal.fieldschool.ai/login"),
  },
  {
    name: "email-ben",
    match: (href) => href.startsWith("mailto:ben@fieldschool.ai"),
  },
  {
    name: "pricing",
    match: (href) =>
      href === "/pricing" ||
      href.startsWith("/pricing?") ||
      href.startsWith("https://portal.fieldschool.ai/pricing"),
  },
];

export function privacyAllows(nav) {
  if (!nav) return true;
  if (nav.doNotTrack === "1" || nav.doNotTrack === "yes") return false;
  if (nav.globalPrivacyControl === true) return false;
  return true;
}

export function referrerOrigin(value) {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

export function classifyClick(href) {
  if (typeof href !== "string" || href.length === 0) return null;
  const rule = CLICK_RULES.find((item) => item.match(href));
  return rule ? rule.name : null;
}

export function appendVisit(log, entry, cap = CAP) {
  const next = Array.isArray(log) ? log.slice() : [];
  next.push(entry);
  if (next.length > cap) next.splice(0, next.length - cap);
  return next;
}

export function readLog(storage) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLog(storage, log) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // sessionStorage can throw when the browser blocks it. Drop the write.
  }
}

function viewEntry(path, referrer, at) {
  return {
    kind: "view",
    path,
    referrerOrigin: referrerOrigin(referrer),
    at,
  };
}

function clickEntry(path, name, href, at) {
  return {
    kind: "click",
    path,
    name,
    href: href.slice(0, 200),
    at,
  };
}

export function start(doc, nav, storage, now = () => new Date().toISOString()) {
  if (!doc || doc.__fsAnalyticsBound) return { recorded: false };
  doc.__fsAnalyticsBound = true;
  if (!privacyAllows(nav)) return { recorded: false };
  const path = doc.location?.pathname || "/";
  writeLog(storage, appendVisit(readLog(storage), viewEntry(path, doc.referrer || "", now())));
  doc.addEventListener("click", (event) => {
    const anchor = event.target?.closest?.("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    const name = classifyClick(href);
    if (!name) return;
    const current = doc.location?.pathname || "/";
    writeLog(
      storage,
      appendVisit(readLog(storage), clickEntry(current, name, href, now())),
    );
  });
  return { recorded: true };
}

if (typeof document !== "undefined") {
  start(document, navigator, window.sessionStorage);
}
