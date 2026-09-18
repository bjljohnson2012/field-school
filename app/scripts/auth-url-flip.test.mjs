import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

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

test("Learn with Ben Stripe links stay 100 / 200 / 1000", () => {
  const plans = readSrc("src/lib/billing/plans.ts");
  const pricing = readSrc("src/app/pricing/page.tsx");
  const flip = readSrc("deploy/flip-auth-url.sh");

  assert.match(plans, /id: "100"/);
  assert.match(plans, /checkoutUrl: "https:\/\/buy\.stripe\.com\/28EbJ0dlvaDVcrGcVg8g005"/);
  assert.match(plans, /id: "200"/);
  assert.match(plans, /checkoutUrl: "https:\/\/buy\.stripe\.com\/8x25kCa9j6nF4Ze8F08g006"/);
  assert.match(plans, /id: "1000"/);
  assert.match(plans, /checkoutUrl: "https:\/\/buy\.stripe\.com\/aFa8wOgxHeUbcrG5sO8g007"/);
  assert.match(pricing, /Learn with Ben/);
  assert.match(pricing, /checkoutPath\("100"\)/);
  assert.match(pricing, /checkoutPath\("200"\)/);
  assert.match(pricing, /checkoutPath\("1000"\)/);
  assert.doesNotMatch(flip, /price_1U8SW/);
});
