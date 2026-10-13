import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  COACHING_GO_LIVE,
  COACHING_MAILTO,
  COACHING_PRICING_URL,
  COACHING_TIERS,
  CONSULTING_MAILTO,
  applyCoachingSwitch,
  coachingHref,
  consultingHref,
  individualSlotMarkup,
} from "../marketing-site/js/checkout-switch.mjs";
import {
  coachingTiers,
  individualOffer,
  pricingVisibleText,
} from "../src/lib/billing/offer-names.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "marketing-site");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const retiredName = ["Learn", "with", "Ben"].join(" ");
const closedRooms = [71, 121, 109, 124, 70, 111, 117, 110, 100, 114, 121, 124, 82, 101, 116, 97, 105, 110, 101, 114]
  .map((code) => String.fromCharCode(code))
  .join("")
  .split("|");

function htmlFiles(dir = site, prefix = "") {
  const found = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(abs).isDirectory()) found.push(...htmlFiles(abs, rel));
    else if (name.endsWith(".html")) found.push(rel);
  }
  return found;
}

function publicPages() {
  return [
    "index.html",
    "how-it-works.html",
    "families.html",
    "teams.html",
    "teams/services.html",
    "pricing.html",
    "ben.html",
    "principles.html",
    "newsletter.html",
    "assessment.html",
    "privacy.html",
    "terms.html",
  ];
}

test("go-live switch defaults to Email Ben and flips only coaching", () => {
  assert.equal(COACHING_GO_LIVE, false);
  assert.equal(coachingHref(false), COACHING_MAILTO);
  assert.equal(coachingHref(true), COACHING_PRICING_URL);
  assert.equal(consultingHref(), CONSULTING_MAILTO);
  assert.equal(individualSlotMarkup(), "");

  const nodes = [
    { attrs: { href: COACHING_MAILTO }, coaching: true, consulting: false, text: "Email Ben" },
    { attrs: { href: COACHING_MAILTO }, coaching: true, consulting: false, text: "Email Ben" },
    { attrs: { href: COACHING_MAILTO }, coaching: true, consulting: false, text: "Email Ben" },
    { attrs: { href: CONSULTING_MAILTO }, coaching: false, consulting: true, text: "Email Ben" },
  ];
  const doc = {
    querySelectorAll(selector) {
      return nodes
        .filter((node) => (selector === "[data-coaching-cta]" ? node.coaching : node.consulting))
        .map((node) => ({
          setAttribute(key, value) {
            node.attrs[key] = value;
          },
        }));
    },
  };
  applyCoachingSwitch(doc, true);
  assert.deepEqual(
    nodes.filter((node) => node.coaching).map((node) => node.attrs.href),
    [COACHING_PRICING_URL, COACHING_PRICING_URL, COACHING_PRICING_URL],
  );
  assert.equal(nodes.find((node) => node.consulting).attrs.href, CONSULTING_MAILTO);
  assert.equal(nodes.every((node) => node.text === "Email Ben"), true);
});

test("homepage has the thirteen sections, hero, and nav", () => {
  const home = read("marketing-site/index.html");
  const ids = [
    "hero",
    "credential",
    "voice",
    "problem-a",
    "problem-b",
    "how",
    "included",
    "rooms",
    "start",
    "week",
    "ask",
    "coaching",
    "close",
  ];
  let last = -1;
  for (const id of ids) {
    const at = home.indexOf(`id="${id}"`);
    assert.ok(at > last, id);
    last = at;
  }
  assert.match(home, /Knowledge brains/);
  assert.match(
    home,
    /The knowledge brain for families and teams who cannot be in the room every hour\./,
  );
  assert.match(home, /One course is free\. No card\./);
  assert.match(home, /href="https:\/\/portal\.fieldschool\.ai\/signup\?plan=course"/);
  assert.match(home, /href="https:\/\/portal\.fieldschool\.ai\/login"/);
  assert.match(home, />How it works</);
  assert.match(home, />Families</);
  assert.match(home, />Teams</);
  assert.match(home, />Pricing</);
  assert.match(home, />Ben</);
  assert.match(home, />Sign in</);
  assert.match(home, />Start free</);
  assert.doesNotMatch(home, /href="\/teams\/services"/);
  assert.doesNotMatch(home, /Community/);
  assert.doesNotMatch(home, /Shop/);
  assert.doesNotMatch(home, /Dayton/);
  assert.match(home, /data-room="family"/);
  assert.match(home, /data-room="org"/);
  assert.match(read("marketing-site/js/site.js"), /closest\("\.screen"\)/);
  assert.match(home, /Reality over hope|You taught it once/);
  assert.match(home, /\$300/);
  assert.match(home, /\$600/);
  assert.match(home, /\$1,500/);
});

test("services are linked only from teams and consulting has no dollar amount", () => {
  const hits = htmlFiles().filter((rel) => read(`marketing-site/${rel}`).includes('href="/teams/services"'));
  assert.deepEqual(hits, ["teams.html"]);
  const services = read("marketing-site/teams/services.html");
  assert.match(services, /Do It Yourself/);
  assert.match(services, /Coaching/);
  assert.match(services, /Consulting/);
  const consulting = services.split('data-offer="consulting"')[1].split("</article>")[0];
  assert.doesNotMatch(consulting, /\$/);
  assert.match(consulting, /Email Ben/);
  assert.match(consulting, /subject=Consulting/);
  assert.match(services, /data-coaching-cta/);
  assert.doesNotMatch(read("marketing-site/families.html"), /\/teams\/services|Consulting/);
  assert.doesNotMatch(read("marketing-site/pricing.html"), /\/teams\/services/);
});

test("public marketing pages drop the retired prices and the hidden seat", () => {
  const banned = /\$10(?!\d)|\$50(?!\d)|\$1,059|plan=10\b|plan=50\b|plan=1059\b|buy\.stripe\.com/;
  for (const rel of htmlFiles()) {
    const html = read(`marketing-site/${rel}`);
    assert.doesNotMatch(html, banned, rel);
    assert.equal(html.includes(retiredName), false, rel);
    assert.equal(html.includes("\u2014"), false, rel);
    assert.doesNotMatch(html, new RegExp(`\\b(?:${closedRooms.join("|")})\\b`), rel);
    assert.doesNotMatch(html, /Individual/, rel);
  }
  assert.match(read("marketing-site/pricing.html"), /\$300/);
  assert.equal(read("marketing-site/pricing.html").includes("Individual"), false);
});

test("portal pricing renders coaching prices and an empty individual slot", () => {
  assert.equal(individualOffer(), null);
  const visible = pricingVisibleText();
  assert.match(visible, /\$300/);
  assert.match(visible, /\$600/);
  assert.match(visible, /\$1,500/);
  assert.match(visible, /Email Ben/);
  assert.match(visible, /In person in Dayton is available when you are both there/);
  assert.doesNotMatch(visible, /\$10(?!\d)|\$50(?!\d)|\$1,059|plan=10|buy\.stripe\.com/);
  assert.equal(visible.includes(retiredName), false);
  assert.equal(visible.includes("Individual"), false);
  assert.deepEqual(
    coachingTiers.map((tier) => tier.priceLabel),
    COACHING_TIERS.map((tier) => tier.price),
  );
  const page = read("src/app/pricing/page.tsx");
  assert.match(page, /individualOffer/);
  assert.match(page, /coachingTiers/);
  assert.match(page, /Email Ben/);
  assert.doesNotMatch(page, /\$10|\$50|\$1,059|plan=10|plan=50|plan=1059|buy\.stripe\.com|cartPath|checkoutPath/);
  assert.equal(page.includes(retiredName), false);
  const cart = read("src/app/cart/cart-client.tsx");
  assert.match(cart, /That seat is not offered/);
  assert.match(cart, /See pricing/);
  assert.match(cart, /Email Ben/);
  assert.doesNotMatch(cart, /Pay /);
  assert.doesNotMatch(cart, /checkoutPath/);
});

test("prepared fieldschool.ai caddy map returns 301s and is not wired into deploy", () => {
  const map = read("deploy/caddy/fieldschool-301.caddy");
  const expected = {
    "/about": "/how-it-works",
    "/portal": "/how-it-works",
    "/community": "/how-it-works",
    "/twelve": "/principles",
    "/coaching": "/teams",
    "/founder": "/ben",
    "/tools": "/assessment",
    "/shop": "/",
    "/branding": "/",
    "/branding/": "/",
  };
  for (const [from, to] of Object.entries(expected)) {
    const line = map.split("\n").find((row) => row.includes(`redir ${from} `));
    assert.ok(line, from);
    assert.match(line, new RegExp(`redir ${from.replace("/", "\\/")} ${to.replace("/", "\\/")} permanent`));
  }
  assert.match(map, /Not applied/);
  const deploy = read("deploy/deploy-site.sh");
  assert.doesNotMatch(deploy, /fieldschool-301/);
});

test("coaching buttons on the site are the three tiers", () => {
  for (const rel of publicPages()) {
    const html = read(`marketing-site/${rel}`);
    const tags = html.match(/<a\b[^>]*data-coaching-cta[^>]*>/g) || [];
    for (const tag of tags) {
      assert.match(tag, /data-tier="(assess|model|build)"/);
      assert.match(tag, /href="mailto:ben@fieldschool.ai\?subject=Coaching"/);
      assert.doesNotMatch(tag, /data-consulting-cta/);
    }
    const consulting = html.match(/<a\b[^>]*data-consulting-cta[^>]*>/g) || [];
    for (const tag of consulting) {
      assert.match(tag, /href="mailto:ben@fieldschool.ai\?subject=Consulting"/);
      assert.doesNotMatch(tag, /data-coaching-cta/);
    }
  }
  const home = read("marketing-site/index.html");
  assert.equal((home.match(/data-coaching-cta/g) || []).length, 3);
});

test("signup for the free course names the same headline", () => {
  const form = read("src/app/signup/signup-form.tsx");
  assert.match(form, /plan === "course"/);
  assert.match(form, /Start your free course/);
});
