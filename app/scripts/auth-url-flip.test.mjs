import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { CHECKOUT_GO_LIVE, livePaymentLink, livePriceId } from "../src/lib/billing/checkout-destination.ts";
import { coachingTiers, consultingMailto, offerDisplayNames } from "../src/lib/billing/offer-names.ts";
import { PAID_PLANS } from "../src/lib/billing/plans.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

test("AUTH_URL flip points at portal and 301s university", () => {
  const snippet = readSrc("deploy/caddy/university-301.caddy");
  const flip = readSrc("deploy/flip-auth-url.sh");
  const deploy = readSrc("deploy/deploy.sh");
  const compose = readSrc("deploy/docker-compose.yml");
  const authMd = readSrc("AUTH.md");
  const deployMd = readSrc("DEPLOY.md");

  const snippetActive = snippet
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .join("\n");
  assert.match(snippetActive, /university\.benjohnson\.ai \{/);
  assert.match(snippetActive, /redir https:\/\/portal\.fieldschool\.ai\{uri\} permanent/);
  assert.doesNotMatch(snippetActive, /reverse_proxy/);
  assert.doesNotMatch(snippetActive, /srv1643164/);

  assert.match(flip, /AUTH_URL=https:\/\/portal\.fieldschool\.ai/);
  assert.match(flip, /--no-build --no-deps --force-recreate app/);
  assert.match(flip, /will not wipe \/opt\/field-school/);
  assert.match(flip, /redir https:\/\/portal\.fieldschool\.ai\{uri\} permanent/);
  assert.doesNotMatch(flip, /rm -rf '\$REMOTE_DIR'|find '\$REMOTE_DIR'/);
  assert.doesNotMatch(flip, /docker compose[^\n]*--build/);
  assert.doesNotMatch(flip, /2\.24\.64\.248/);
  assert.doesNotMatch(flip, /27pn9xs0zk8a73g/);
  assert.doesNotMatch(flip, /buy\.stripe\.com/);

  assert.doesNotMatch(deploy, /bash .*flip-auth-url/);
  assert.doesNotMatch(deploy, /university-301\.caddy/);
  assert.doesNotMatch(compose, /caddy/i);

  assert.match(authMd, /AUTH_URL.*https:\/\/portal\.fieldschool\.ai/);
  assert.match(authMd, /university\.benjohnson\.ai.*301/);
  assert.match(deployMd, /flip-auth-url\.sh/);
  assert.match(deployMd, /portal\.fieldschool\.ai/);
});

test("coaching offers are Assess $300, Model $600, and Build $1,500", () => {
  const pricing = readSrc("src/app/pricing/page.tsx");
  const checkout = readSrc("src/lib/billing/checkout-destination.ts");

  assert.deepEqual(Object.keys(offerDisplayNames), [
    "diy",
    "coaching",
    "assess",
    "model",
    "build",
    "consulting",
  ]);
  assert.deepEqual(
    coachingTiers.map((tier) => [tier.key, tier.name, tier.priceLabel]),
    [
      ["assess", "Assess", "$300"],
      ["model", "Model", "$600"],
      ["build", "Build", "$1,500"],
    ],
  );
  assert.equal(consultingMailto, "mailto:ben@fieldschool.ai?subject=Consulting");
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.match(checkout, /export const CHECKOUT_GO_LIVE = false/);
  assert.equal(livePaymentLink(PAID_PLANS["100"]), null);
  assert.equal(livePriceId(PAID_PLANS["100"]), null);
  assert.match(pricing, /\$300/);
  assert.match(pricing, /Email Ben/);
  assert.doesNotMatch(pricing, /Learn with Ben/);
});
