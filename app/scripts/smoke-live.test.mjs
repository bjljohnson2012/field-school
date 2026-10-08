import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { resolveTargets, smokeLive } from "./smoke-live.mjs";

function listen(handler) {
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  return once(server, "listening").then(() => {
    const address = server.address();
    return { server, origin: `http://127.0.0.1:${address.port}` };
  });
}

function close(server) {
  server.close();
  return once(server, "close");
}

function portalHandler(portalOrigin, options = {}) {
  const googleRedirectHost = options.googleRedirectHost ?? portalOrigin;
  const signupStatus = options.signupStatus ?? 200;
  const seen = [];
  const handler = (req, res) => {
    const url = new URL(req.url, portalOrigin);
    seen.push(`${req.method} ${url.pathname}`);
    if (url.pathname.startsWith("/api/stripe") || url.pathname.startsWith("/checkout")) {
      res.writeHead(500);
      res.end("no charge");
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/auth/csrf") {
      res.writeHead(200, {
        "content-type": "application/json",
        "set-cookie": "authjs.csrf-token=fixture; Path=/; HttpOnly",
      });
      res.end(JSON.stringify({ csrfToken: "fixture-csrf" }));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/auth/signin/google") {
      const redirect = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      redirect.searchParams.set("redirect_uri", `${googleRedirectHost}/api/auth/callback/google`);
      res.writeHead(302, { location: redirect.toString() });
      res.end();
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/auth/signin/twitter") {
      const redirect = new URL("https://twitter.com/i/oauth2/authorize");
      redirect.searchParams.set("redirect_uri", `${portalOrigin}/api/auth/callback/twitter`);
      res.writeHead(302, { location: redirect.toString() });
      res.end();
      return;
    }
    if (req.method !== "GET") {
      res.writeHead(405);
      res.end();
      return;
    }
    if (url.pathname === "/dashboard") {
      res.writeHead(307, { location: "/learn" });
      res.end();
      return;
    }
    if (url.pathname === "/signup") {
      if (signupStatus === 302) {
        res.writeHead(302, { location: "https://buy.stripe.com/test" });
        res.end();
        return;
      }
      res.writeHead(200, { "content-type": "text/html" });
      res.end("join");
      return;
    }
    const pages = new Set(["/", "/login", "/about", "/privacy", "/terms", "/pricing"]);
    if (pages.has(url.pathname)) {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("ok");
      return;
    }
    res.writeHead(404);
    res.end();
  };
  return { handler, seen };
}

test("public portal origin selects the live site, www, and university", () => {
  assert.deepEqual(resolveTargets({ origin: "https://portal.fieldschool.ai" }), {
    origin: "https://portal.fieldschool.ai",
    site: "https://fieldschool.ai",
    www: "https://www.fieldschool.ai",
    university: "https://university.benjohnson.ai",
    http: "http://fieldschool.ai",
  });
  const local = resolveTargets({ origin: "http://127.0.0.1:43141/" });
  assert.equal(local.origin, "http://127.0.0.1:43141");
  assert.equal(local.site, "http://127.0.0.1:43141");
  assert.equal(local.www, null);
  assert.equal(local.university, null);
  assert.equal(local.http, null);
});

test("smoke accepts a portal, the site pages, and the university 301", async () => {
  let current = (_req, res) => {
    res.writeHead(500);
    res.end();
  };
  const portal = await listen((req, res) => current(req, res));
  const fixed = portalHandler(portal.origin);
  current = fixed.handler;
  const university = await listen((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    res.writeHead(301, { location: `${portal.origin}${url.pathname}` });
    res.end();
  });
  const http = await listen((req, res) => {
    res.writeHead(308, { location: `${portal.origin}/` });
    res.end();
  });
  const www = await listen((req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end("www");
  });
  try {
    const report = await smokeLive({
      origin: portal.origin,
      site: portal.origin,
      www: www.origin,
      university: university.origin,
      http: http.origin,
    });
    assert.equal(report.ok, true, JSON.stringify(report.checks));
    assert.deepEqual(
      report.checks.map((check) => check.name),
      [
        "home",
        "login",
        "signup course",
        "dashboard signed out",
        "google start",
        "x start",
        "site home",
        "site about",
        "site privacy",
        "site terms",
        "site pricing",
        "www",
        "http to https",
        "university root",
        "university course",
      ],
    );
    assert.equal(fixed.seen.includes("POST /api/stripe/webhook"), false);
    assert.equal(fixed.seen.includes("POST /checkout"), false);
    assert.ok(fixed.seen.includes("POST /api/auth/signin/google"));
    assert.ok(fixed.seen.includes("POST /api/auth/signin/twitter"));
  } finally {
    await Promise.all([portal, university, http, www].map((item) => close(item.server)));
  }
});

test("smoke rejects a wrong callback host, a stripe signup redirect, and a missing university 301", async () => {
  const wrong = portalHandler("http://127.0.0.1", {
    googleRedirectHost: "https://example.com",
  });
  const portal = await listen((req, res) => wrong.handler(req, res));
  const university = await listen((req, res) => {
    res.writeHead(200);
    res.end("still here");
  });
  try {
    const report = await smokeLive({
      origin: portal.origin,
      site: portal.origin,
      university: university.origin,
    });
    assert.equal(report.ok, false);
    const google = report.checks.find((check) => check.name === "google start");
    const root = report.checks.find((check) => check.name === "university root");
    assert.equal(google.ok, false);
    assert.match(google.detail, /example\.com/);
    assert.equal(root.ok, false);
    assert.match(root.detail, /301/);
  } finally {
    await Promise.all([close(portal.server), close(university.server)]);
  }

  const charging = portalHandler("http://127.0.0.1", { signupStatus: 302 });
  const signup = await listen((req, res) => charging.handler(req, res));
  try {
    const report = await smokeLive({ origin: signup.origin, site: signup.origin });
    const course = report.checks.find((check) => check.name === "signup course");
    assert.equal(course.ok, false);
    assert.match(course.detail, /buy\.stripe\.com/);
  } finally {
    await close(signup.server);
  }
});

test("the CLI exits 0 against the same local contract", async () => {
  let current = (_req, res) => {
    res.writeHead(500);
    res.end();
  };
  const portal = await listen((req, res) => current(req, res));
  const built = portalHandler(portal.origin);
  current = built.handler;
  const child = spawn(
    process.execPath,
    ["scripts/smoke-live.mjs", "--origin", portal.origin],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const [code] = await once(child, "exit");
  await close(portal.server);
  assert.equal(code, 0, `${stdout}\n${stderr}`);
  assert.match(stdout, /home ok/);
  assert.match(stdout, /x start ok/);
});
