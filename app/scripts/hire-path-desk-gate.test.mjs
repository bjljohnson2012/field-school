import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { admitDesk, signProgressDesk, signedOrgFromUrl } from "../src/lib/progress/desk-sign.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const desks = [
  "src/app/api/progress/brain/route.ts",
  "src/app/api/progress/intent/route.ts",
  "src/app/api/progress/path/route.ts",
  "src/app/api/progress/portion/route.ts",
  "src/app/api/progress/supervised/route.ts",
];

test("hire-path file desks require a signed org url or a session", () => {
  for (const rel of desks) {
    const src = read(rel);
    assert.match(src, /refuseClosedDesk/, rel);
  }
  const events = read("src/app/api/progress/route.ts");
  assert.match(events, /guest: true/);
  assert.doesNotMatch(events, /refuseClosedDesk/);
});

test("a signed org url opens the desk and a foreign org does not", () => {
  const secret = "desk-secret";
  const url = new URL("https://portal.test/api/progress/brain?org=household");
  url.searchParams.set("sig", signProgressDesk("household", secret));
  const signed = admitDesk({
    signedOrg: signedOrgFromUrl(url, secret),
    asked: "household",
    session: { ok: false, status: 401, error: "sign_in_required" },
  });
  assert.deepEqual(signed, { ok: true, org: "household", via: "signed_url" });

  const tampered = new URL("https://portal.test/api/progress/brain?org=sales");
  tampered.searchParams.set("sig", signProgressDesk("household", secret));
  assert.equal(signedOrgFromUrl(tampered, secret), null);
  const unsigned = admitDesk({
    signedOrg: signedOrgFromUrl(new URL("https://portal.test/api/progress/brain?child=play-child"), secret),
    asked: "",
    session: { ok: false, status: 401, error: "sign_in_required" },
  });
  assert.deepEqual(unsigned, { ok: false, status: 401, error: "sign_in_required" });

  const session = admitDesk({
    signedOrg: null,
    asked: "sales",
    session: { ok: true, orgId: "org-sales", orgSlug: "sales" },
  });
  assert.deepEqual(session, { ok: true, org: "sales", via: "session" });

  const cross = admitDesk({
    signedOrg: null,
    asked: "household",
    session: { ok: true, orgId: "org-sales", orgSlug: "sales" },
  });
  assert.deepEqual(cross, { ok: false, status: 403, error: "forbidden_org" });
});
