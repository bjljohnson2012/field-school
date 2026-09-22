export const HOUSEHOLD_SLUG = "household";
export const SALES_SLUG = "sales";

export const JOB_SENTENCE =
  "When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.";

export type Desk = "household" | "sales";

export type PersonRow = {
  membershipId: string;
  name: string;
  kind: string;
  stance: string;
  org: string;
  orgName: string;
  login: string;
};

export const DESK_COPY: Record<
  Desk,
  { title: string; lede: string; empty: string; kind: string; login: string }
> = {
  sales: {
    title: "Login learners",
    lede: "Sales lists login learners. The leader is the User who pays. A child is not a buyer.",
    empty: "No login learners in Sales yet.",
    kind: "Login learner",
    login: "Member",
  },
  household: {
    title: "Tracked children",
    lede: "Household lists tracked children. Login is none. A child is not a buyer. The parent is the User.",
    empty: "No tracked children in Household yet.",
    kind: "Tracked child",
    login: "None",
  },
};

export function deskForOrg(slug: string): Desk | null {
  if (slug === SALES_SLUG) return "sales";
  if (slug === HOUSEHOLD_SLUG) return "household";
  return null;
}

function isChild(person: PersonRow) {
  return person.kind === "child";
}

function loginIsNone(person: PersonRow) {
  return person.login.trim().toLowerCase() === "none";
}

/** One room per call. Sales is login learners. Household is tracked children with login none. */
export function peopleForDesk(people: readonly PersonRow[], desk: Desk): PersonRow[] {
  if (desk === "sales") {
    return people.filter(
      (person) =>
        person.org === SALES_SLUG &&
        !isChild(person) &&
        !loginIsNone(person) &&
        person.login.trim().length > 0,
    );
  }
  return people.filter(
    (person) => person.org === HOUSEHOLD_SLUG && isChild(person) && loginIsNone(person),
  );
}

export function roomsFor(slugs: readonly string[], staff: boolean): Desk[] {
  const found: Desk[] = [];
  for (const slug of slugs) {
    const desk = deskForOrg(slug);
    if (desk && !found.includes(desk)) found.push(desk);
  }
  if (found.length > 0) return found;
  if (staff) return ["sales", "household"];
  return [];
}

/** Active room wins. A single membership is that room. Two rooms stay unselected until the User picks one. */
export function initialDesk(opts: {
  activeSlug: string;
  membershipSlugs: readonly string[];
  staff: boolean;
}): Desk | null {
  const rooms = roomsFor(opts.membershipSlugs, opts.staff);
  const active = deskForOrg(opts.activeSlug);
  if (active && rooms.includes(active)) return active;
  if (rooms.length === 1) return rooms[0];
  return null;
}
