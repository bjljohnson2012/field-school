export type TenantLesson = {
  org: string;
  course: string;
  slug: string;
  objectId: string;
  title: string;
  body: string;
};

export const TENANT_LESSONS: TenantLesson[] = [
  {
    org: "household",
    course: "home",
    slug: "welcome",
    objectId: "home:welcome",
    title: "Household welcome",
    body: "This is a household lesson. It is not the Grok Bot catalog. Watch is a text station. Progress stays in this org.",
  },
  {
    org: "sales",
    course: "sales",
    slug: "welcome",
    objectId: "sales:welcome",
    title: "Welcome to the desk",
    body: "This is a sales-team lesson. Discovery, next step, hygiene. It does not mix with household.",
  },
];

export function lessonForOrg(orgSlug: string) {
  return TENANT_LESSONS.find((l) => l.org === orgSlug) ?? null;
}

export const HOUSEHOLD_SKILLS = [
  { slug: "morning", name: "Morning start", prompt: "Can they start the day without a fight?" },
  { slug: "chores", name: "Named chores", prompt: "Can they finish one named chore without a reminder loop?" },
  { slug: "read", name: "Read and tell", prompt: "Can they read a page and tell you what happened?" },
];

export const SALES_SKILLS = [
  { slug: "discovery", name: "Discovery", prompt: "Can they run a discovery call and name the pain in one sentence?" },
  { slug: "qualification", name: "Qualification", prompt: "Can they qualify next step vs. noise?" },
  { slug: "next-step", name: "Next step", prompt: "Can they leave a dated next step on every live deal?" },
];

export function skillsForOrg(orgSlug: string) {
  if (orgSlug === "household") return HOUSEHOLD_SKILLS;
  if (orgSlug === "sales") return SALES_SKILLS;
  return [];
}
