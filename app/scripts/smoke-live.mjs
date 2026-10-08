import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const REDIRECT = new Set([301, 302, 303, 307, 308]);

function strip(value) {
  return String(value).replace(/\/$/, "");
}

export function resolveTargets(options) {
  const origin = strip(options.origin);
  const host = new URL(origin).hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
  const publicPortal = host === "portal.fieldschool.ai";
  const site = options.site ? strip(options.site) : local ? origin : "https://fieldschool.ai";
  const www = options.www
    ? strip(options.www)
    : publicPortal
      ? "https://www.fieldschool.ai"
      : null;
  const university = options.university
    ? strip(options.university)
    : publicPortal
      ? "https://university.benjohnson.ai"
      : null;
  const http = options.http
    ? strip(options.http)
    : publicPortal
      ? "http://fieldschool.ai"
      : null;
  return { origin, site, www, university, http };
}

async function ask(url, init) {
  return fetch(url, { redirect: "manual", ...init });
}

function locationOf(response, base) {
  const raw = response.headers.get("location");
  if (!raw) return null;
  return new URL(raw, base);
}

async function expectPage(url) {
  const response = await ask(url);
  if (response.status !== 200) {
    throw new Error(`status ${response.status}`);
  }
  return "200";
}

async function oauthStart(origin, provider, allowedHosts) {
  const csrf = await ask(`${origin}/api/auth/csrf`);
  if (csrf.status !== 200) {
    throw new Error(`csrf status ${csrf.status}`);
  }
  const payload = await csrf.json();
  if (!payload.csrfToken) {
    throw new Error("csrf token missing");
  }
  const setCookie =
    typeof csrf.headers.getSetCookie === "function" ? csrf.headers.getSetCookie() : [];
  const cookie = setCookie.map((row) => row.split(";")[0]).join("; ");
  const response = await ask(`${origin}/api/auth/signin/${provider}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie,
    },
    body: new URLSearchParams({
      csrfToken: payload.csrfToken,
      callbackUrl: "/login/complete",
    }),
  });
  if (!REDIRECT.has(response.status)) {
    throw new Error(`status ${response.status}`);
  }
  const destination = locationOf(response, origin);
  if (!destination || !allowedHosts.includes(destination.host)) {
    throw new Error(`provider host ${destination ? destination.host : "missing"}`);
  }
  const redirectUri = destination.searchParams.get("redirect_uri");
  if (!redirectUri) {
    throw new Error("redirect_uri missing");
  }
  const callback = new URL(redirectUri);
  const expected = new URL(origin);
  if (callback.host !== expected.host) {
    throw new Error(`callback host ${callback.host}`);
  }
  return callback.host;
}

export async function smokeLive(options) {
  const targets = resolveTargets(options);
  const checks = [];

  async function run(name, fn) {
    try {
      const detail = await fn();
      checks.push({ name, ok: true, detail: detail || "ok" });
    } catch (error) {
      checks.push({
        name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await run("home", () => expectPage(`${targets.origin}/`));
  await run("login", () => expectPage(`${targets.origin}/login`));
  await run("signup course", async () => {
    const response = await ask(`${targets.origin}/signup?plan=course`);
    const location = response.headers.get("location") || "";
    if (location.includes("buy.stripe.com")) {
      throw new Error(`location ${location}`);
    }
    if (response.status !== 200) {
      throw new Error(`status ${response.status}`);
    }
    return "200";
  });
  await run("dashboard signed out", async () => {
    const response = await ask(`${targets.origin}/dashboard`);
    if (!REDIRECT.has(response.status)) {
      throw new Error(`status ${response.status}`);
    }
    const location = locationOf(response, targets.origin);
    if (!location) throw new Error("missing location");
    if (location.href.includes("buy.stripe.com")) {
      throw new Error(`location ${location.href}`);
    }
    if (location.host !== new URL(targets.origin).host) {
      throw new Error(`left origin for ${location.host}`);
    }
    return location.pathname;
  });
  await run("google start", () =>
    oauthStart(targets.origin, "google", ["accounts.google.com"]),
  );
  await run("x start", () =>
    oauthStart(targets.origin, "twitter", ["twitter.com", "x.com", "api.x.com"]),
  );

  const sitePages = [
    ["site home", "/"],
    ["site about", "/about"],
    ["site privacy", "/privacy"],
    ["site terms", "/terms"],
    ["site pricing", "/pricing"],
  ];
  for (const [name, path] of sitePages) {
    await run(name, () => expectPage(`${targets.site}${path}`));
  }

  if (targets.www) {
    await run("www", async () => {
      const response = await ask(`${targets.www}/`);
      if (response.status === 200) return "200";
      if (!REDIRECT.has(response.status)) {
        throw new Error(`status ${response.status}`);
      }
      const location = locationOf(response, targets.www);
      if (!location || location.host !== new URL(targets.site).host) {
        throw new Error(`location ${location ? location.href : "missing"}`);
      }
      return location.href;
    });
  }

  if (targets.http) {
    await run("http to https", async () => {
      const response = await ask(`${targets.http}/`);
      if (response.status !== 301 && response.status !== 308) {
        throw new Error(`status ${response.status}`);
      }
      const location = locationOf(response, targets.http);
      const site = new URL(`${targets.site}/`);
      if (!location || location.origin !== site.origin || location.pathname !== "/") {
        throw new Error(`location ${location ? location.href : "missing"}`);
      }
      return location.href;
    });
  }

  if (targets.university) {
    const paths = [
      ["university root", "/"],
      ["university course", "/c/grok-bot"],
    ];
    for (const [name, path] of paths) {
      await run(name, async () => {
        const response = await ask(`${targets.university}${path}`);
        if (response.status !== 301 && response.status !== 308) {
          throw new Error(`expected 301, got ${response.status}`);
        }
        const location = locationOf(response, targets.university);
        const want = new URL(path, `${targets.origin}/`);
        if (!location || location.href !== want.href) {
          throw new Error(`location ${location ? location.href : "missing"}`);
        }
        return location.href;
      });
    }
  }

  return { ok: checks.every((check) => check.ok), checks };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--origin") options.origin = value;
    else if (arg === "--site") options.site = value;
    else if (arg === "--www") options.www = value;
    else if (arg === "--university") options.university = value;
    else if (arg === "--http") options.http = value;
    else {
      throw new Error(
        "usage: node scripts/smoke-live.mjs --origin URL [--site URL] [--www URL] [--university URL] [--http URL]",
      );
    }
    index += 1;
  }
  if (!options.origin) throw new Error("missing --origin");
  return options;
}

async function main() {
  try {
    const report = await smokeLive(parseArgs(process.argv.slice(2)));
    for (const check of report.checks) {
      console.log(`${check.name} ${check.ok ? "ok" : "fail"} ${check.detail}`);
    }
    process.exit(report.ok ? 0 : 1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
