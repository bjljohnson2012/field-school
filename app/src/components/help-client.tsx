"use client";

import { useState } from "react";

export type HelpAudience = "learner" | "coach" | "leader" | "admin" | "platformAdmin";

export type HelpItem = {
  title: string;
  body: string;
  tags: readonly string[];
  href?: string;
  audience: readonly HelpAudience[];
};

export type HelpViewer = {
  capabilities: readonly string[];
  platformAdmin: boolean;
};

const ELEVATED = new Set(["coach", "leader", "admin"]);

/** Static help. AE HelpClient.tsx was not on disk. Hrefs are the campus paths. */
export const ITEMS: readonly HelpItem[] = [
  {
    title: "Intake",
    body: "Start or resume intake one question at a time. Answers stay on this campus.",
    tags: ["intake", "start"],
    href: "/intake",
    audience: ["learner"],
  },
  {
    title: "Tasks",
    body: "Open tasks for this org live on the tasks board. The Tasks control in the header is the way in.",
    tags: ["tasks", "work"],
    href: "/tasks",
    audience: ["learner", "coach", "leader", "admin", "platformAdmin"],
  },
  {
    title: "Reviews",
    body: "Pending monthly reviews for the people you coach.",
    tags: ["reviews", "coaching"],
    href: "/coaching/reviews",
    audience: ["coach", "leader"],
  },
  {
    title: "Knowledge",
    body: "The coaching knowledge pack for this org. This link stays in help when the center nav item is disabled.",
    tags: ["knowledge"],
    href: "/coaching/knowledge",
    audience: ["coach", "leader"],
  },
  {
    title: "Products",
    body: "Product catalog used in coaching. This link stays in help when the center nav item is disabled.",
    tags: ["products"],
    href: "/coaching/products",
    audience: ["coach"],
  },
  {
    title: "Users",
    body: "Invite and review people in this org. This link stays in help when the center nav item is disabled.",
    tags: ["users"],
    href: "/coaching/users",
    audience: ["admin"],
  },
  {
    title: "Organizations",
    body: "Platform admins manage organizations outside this help list. Org administration is described here and is not linked.",
    tags: ["orgs", "organizations"],
    audience: ["platformAdmin"],
  },
  {
    title: "Team",
    body: "Leaders watch the team they coach and the questions those coaches run.",
    tags: ["team", "leader"],
    audience: ["leader"],
  },
];

export function filterHelpItems(items: readonly HelpItem[], viewer: HelpViewer): HelpItem[] {
  const caps = new Set(viewer.capabilities);
  const learnerPath = !viewer.platformAdmin && ![...caps].some((cap) => ELEVATED.has(cap));
  return items.filter((item) =>
    item.audience.some((audience) => {
      if (audience === "learner") return learnerPath;
      if (audience === "platformAdmin") return viewer.platformAdmin;
      return caps.has(audience);
    }),
  );
}

function matches(item: HelpItem, query: string) {
  if (!query) return true;
  return [item.title, item.body, ...item.tags].join("\n").toLowerCase().includes(query);
}

export function HelpClient({ capabilities, platformAdmin }: HelpViewer) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const needle = query.trim().toLowerCase();
  const shown = filterHelpItems(ITEMS, { capabilities, platformAdmin }).filter((item) =>
    matches(item, needle),
  );

  return (
    <section>
      <h1 className="h-page">Help</h1>
      <label className="mt-6 block">
        <span className="label">Search help</span>
        <input
          className="input"
          type="search"
          value={query}
          placeholder="Search titles, notes, and tags"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {shown.length === 0 ? (
        <section className="card mt-6 p-6">
          <p>{needle ? "No help topics match." : "No help topics for this seat."}</p>
        </section>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((item) => {
            const isOpen = open === item.title;
            return (
              <li key={item.title} className="card p-4">
                <button
                  type="button"
                  className="btn-primary"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : item.title)}
                >
                  {item.title}
                </button>
                {isOpen ? (
                  <div className="mt-3">
                    <p>{item.body}</p>
                    {item.href ? (
                      <a className="mt-3 inline-block text-sm font-semibold" href={item.href}>
                        {item.href}
                      </a>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">{item.tags.join(" · ")}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
