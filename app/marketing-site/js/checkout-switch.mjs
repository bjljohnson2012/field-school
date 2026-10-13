export const COACHING_GO_LIVE = false;

export const COACHING_PRICING_URL = "https://portal.fieldschool.ai/pricing";

export const COACHING_MAILTO = "mailto:ben@fieldschool.ai?subject=Coaching";

export const CONSULTING_MAILTO = "mailto:ben@fieldschool.ai?subject=Consulting";

export const FREE_COURSE_HREF = "https://portal.fieldschool.ai/signup?plan=course";

export const COACHING_TIERS = [
  {
    key: "assess",
    name: "Assess",
    price: "$300",
    cadence: "a month",
    line: "One 60-minute session a month. You leave with a written recap and a next-step plan in the portal.",
  },
  {
    key: "model",
    name: "Model",
    price: "$600",
    cadence: "a month",
    line: "Two sessions a month. You get a recap, updates to the model, and answers to email questions within 2 business days.",
  },
  {
    key: "build",
    name: "Build",
    price: "$1,500",
    cadence: "a month",
    line: "Four working sessions a month. Ben builds the model with you, replies to priority email within 1 business day, and you sit a quarterly review.",
  },
];

export function coachingHref(goLive = COACHING_GO_LIVE) {
  return goLive ? COACHING_PRICING_URL : COACHING_MAILTO;
}

export function consultingHref() {
  return CONSULTING_MAILTO;
}

export function individualSlotMarkup() {
  return "";
}

export function applyCoachingSwitch(doc, goLive = COACHING_GO_LIVE) {
  const next = coachingHref(goLive);
  for (const node of doc.querySelectorAll("[data-coaching-cta]")) {
    node.setAttribute("href", next);
  }
  for (const node of doc.querySelectorAll("[data-consulting-cta]")) {
    node.setAttribute("href", consultingHref());
  }
}

if (typeof document !== "undefined") {
  applyCoachingSwitch(document);
}
