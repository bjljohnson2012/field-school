export type SharePage = {
  slug: string;
  title: string;
  kicker: string;
  lede: string;
  sections: { heading: string; body: string }[];
  next?: { label: string; href: string };
};

export const sharePages: SharePage[] = [
  {
    slug: "field-school",
    title: "Field School",
    kicker: "Company",
    lede: "Field School is the training portal. It helps you learn AI, sales, go-to-market, and leadership at your own pace, plus small moves you can make with your family.",
    sections: [
      {
        heading: "AI as a teammate",
        body: "Learn to hire and direct AI the way you would a staff — clear jobs, real tools, humans still on send and pay.",
      },
      {
        heading: "Self-paced learning",
        body: "Every course is a ladder: watch the clip, do the field work, clear the quiz. Move when you are ready.",
      },
      {
        heading: "Consistent tracking",
        body: "Progress, certificates, and assessment tools stay on your portal — one place to see what you can do next.",
      },
    ],
    next: { label: "Open the training portal", href: "/" },
  },
  {
    slug: "hire-a-staff",
    title: "Hire a staff",
    kicker: "Operating brief",
    lede: "Grok Bot changes the workday because you become the principal of a staff. A chatbot waits for the next prompt. A staff takes the brief and moves.",
    sections: [
      {
        heading: "Talk to one person",
        body: "Work starts with a chief of staff. The rest of the roster gets the jobs. Agents message each other, so you do not become the hallway.",
      },
      {
        heading: "Each seat has a machine",
        body: "Each named agent runs on its own cloud computer. Logins stay scoped to that machine. The research seat does not inherit the inbox seat’s sessions.",
      },
      {
        heading: "Names, not labels",
        body: "Refuse “Email Bot.” A person has a name and a job. Plugins and routines live in one place, so the staff does not scatter across a dozen apps you have to remember.",
      },
      {
        heading: "Fewer knobs on purpose",
        body: "No model picker. No hundred dropdowns. The product is opinionated so the week can start on Tuesday. Day-to-day knowledge work is this lane.",
      },
    ],
    next: { label: "Walk the Grok Bot course", href: "/c/grok-bot" },
  },
  {
    slug: "desk",
    title: "Share desk",
    kicker: "Template",
    lede: "A portable operating brief for a staff. One job per bot. Routines wake them. Humans keep send, pay, and approve.",
    sections: [
      {
        heading: "Staff",
        body: "Name, one job, voice, and the minimum plugins. If the sentence needs a committee, split the seat.",
      },
      {
        heading: "Routines",
        body: "Name, when it runs, what done looks like, and the exact nag copy if a human missed it.",
      },
      {
        heading: "Overnight brief",
        body: "Source of truth, a four-bullet quality bar, and who verifies. Do not start potato mode before one job exists.",
      },
      {
        heading: "Kill switch",
        body: "Unplug if it emails, charges, or publishes PII without a human.",
      },
    ],
    next: { label: "Build yours in the course desk", href: "/c/grok-bot/desk" },
  },
];

export function getSharePage(slug: string) {
  return sharePages.find((p) => p.slug === slug);
}
