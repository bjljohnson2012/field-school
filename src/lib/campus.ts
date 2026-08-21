export type Role = "admin" | "student" | "guest";

export const ADMIN_ID = "user-ben";
export const STUDENT_ID = "user-jordan";
export const STUDENT_B_ID = "user-sam";

export const DEAN_EMAIL = "bjljohnson2012@gmail.com";
export const DEAN_NAME = "Benjamin Johnson";

export type CampusUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  notes: string;
  createdAt: string;
};

export function isDeanEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase() === DEAN_EMAIL;
}

/** Keep a signed-out `null`. Never treat it as the dean. */
export function resolveActiveUserId(
  value: unknown,
  users: { id: string }[],
): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (!id) return null;
  return users.some((u) => u.id === id) ? id : null;
}

export const seedUsers: CampusUser[] = [
  {
    id: ADMIN_ID,
    name: DEAN_NAME,
    email: DEAN_EMAIL,
    role: "admin",
    title: "Campus admin",
    notes: "Dean seat. Sign in with Google.",
    createdAt: "2026-08-01T12:00:00.000Z",
  },
  {
    id: STUDENT_ID,
    name: "Jordan Hale",
    email: "jordan@field.school",
    role: "student",
    title: "Operations coordinator",
    notes: "Demo student. Started Grok Bot station 01.",
    createdAt: "2026-08-10T12:00:00.000Z",
  },
  {
    id: STUDENT_B_ID,
    name: "Sam Ortiz",
    email: "sam@field.school",
    role: "student",
    title: "Founder",
    notes: "Has not opened a course yet.",
    createdAt: "2026-08-18T12:00:00.000Z",
  },
];
