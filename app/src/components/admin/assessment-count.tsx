"use client";

import { useEffect, useState } from "react";

type StaffOrg = { slug: string; name: string };
type Snapshot =
  | { status: "loading" }
  | { status: "ready"; count: number; orgs: StaffOrg[] }
  | { status: "unavailable" };

function orgLabel(orgs: StaffOrg[]) {
  if (!orgs.length) return "no org";
  return orgs.map((org) => org.name).join(", ");
}

function label(snapshot: Snapshot) {
  if (snapshot.status === "loading") return "assessments …";
  if (snapshot.status === "unavailable") return "assessments unavailable";
  return `${snapshot.count} assessments · ${orgLabel(snapshot.orgs)}`;
}

export function AssessmentCount({ email }: { email: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ status: "loading" });

  useEffect(() => {
    const mail = email.trim();
    if (!mail) {
      setSnapshot({ status: "unavailable" });
      return;
    }
    const controller = new AbortController();
    setSnapshot({ status: "loading" });
    const url = `/api/admin/members/assessments?email=${encodeURIComponent(mail)}`;
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        const body: unknown = await response.json();
        if (typeof body !== "object" || body === null || !("count" in body)) throw new Error("unavailable");
        const count = body.count;
        if (typeof count !== "number" || !Number.isInteger(count) || count < 0) throw new Error("unavailable");
        const orgs = "orgs" in body && Array.isArray(body.orgs) ? body.orgs.filter(isStaffOrg) : [];
        setSnapshot({ status: "ready", count, orgs });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSnapshot({ status: "unavailable" });
      });
    return () => controller.abort();
  }, [email]);

  return (
    <span data-assessment-count data-org-column>
      {label(snapshot)}
    </span>
  );
}

function isStaffOrg(value: unknown): value is StaffOrg {
  if (typeof value !== "object" || value === null) return false;
  const row = value as { slug?: unknown; name?: unknown };
  return typeof row.slug === "string" && typeof row.name === "string";
}
