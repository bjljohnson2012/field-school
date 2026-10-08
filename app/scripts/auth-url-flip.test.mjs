import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

test("existing checkout rows stay on their payment links", () => {
  const plans = readSrc("src/lib/billing/plans.ts");
  const pricing = readSrc("src/app/pricing/page.tsx");
  const flip = readSrc("deploy/flip-auth-url.sh");

  assert.match(plans, /id: "100"/);
  assert.match(plans, /checkoutUrl: "https:\/\/buy\.stripe\.com\/28EbJ0dlvaDVcrGcVg8g005"/);
  assert.match(plans, /id: "200"/);
  assert.match(plans, /checkoutUrl: "https:\/\/buy\.stripe\.com\/8x25kCa9j6nF4Ze8F08g006"/);
  assert.match(plans, /id: "1000"/);
  assert.match(plans, /checkoutUrl: "https:\/\/buy\.stripe\.com\/aFa8wOgxHeUbcrG5sO8g007"/);
  assert.match(pricing, /checkoutPath\("100"\)/);
  assert.match(pricing, /checkoutPath\("200"\)/);
  assert.match(pricing, /checkoutPath\("1000"\)/);
  assert.doesNotMatch(flip, /price_1U8SW/);
});

test("flip script dry-run is the default and the key falls back to vps_deploy", () => {
  const flip = readSrc("deploy/flip-auth-url.sh");
  assert.match(flip, /--dry-run/);
  assert.match(
    flip,
    /for candidate in "\$HOME\/\.ssh\/vps_deploy" "\$HOME\/\.ssh\/field-school-agent" "\$HOME\/\.ssh\/id_ed25519_hostinger"/,
  );
  assert.match(
    flip,
    /missing SSH key \(tried VPS_SSH_KEY, vps_deploy, field-school-agent, id_ed25519_hostinger\)/,
  );
  const dryRunAt = flip.indexOf("dry-run. pass --apply");
  const missingKeyAt = flip.indexOf("missing SSH key");
  const sshAt = flip.indexOf('"${SSH[@]}"');
  assert.ok(dryRunAt > 0);
  assert.ok(missingKeyAt > dryRunAt);
  assert.ok(sshAt > missingKeyAt);
});

const OLD_CADDY = `university.benjohnson.ai, srv1643164.hstgr.cloud {
    encode gzip
    reverse_proxy field-school-app:3000
    log {
        output file /data/university.access.log
    }
}
`;

const NEW_CADDY = `university.benjohnson.ai {
    encode gzip
    redir https://portal.fieldschool.ai{uri} permanent
    log {
        output file /data/university.access.log
    }
}

srv1643164.hstgr.cloud {
    encode gzip
    reverse_proxy field-school-app:3000
    log {
        output file /data/hstgr.access.log
    }
}
`;

function pythonBlocks(flip) {
  return [...flip.matchAll(/python3 - <<'PY'\n([\s\S]*?)\nPY/g)].map((match) => match[1]);
}

function runPython(code, env) {
  return spawnSync("python3", ["-c", code], {
    encoding: "utf8",
    env: { PATH: process.env.PATH, ...env },
  });
}

test("AUTH_URL and university Caddy rewrites converge on a second run", () => {
  const flip = readSrc("deploy/flip-auth-url.sh");
  assert.match(flip, /os\.environ\.get\("FLIP_ENV_FILE", "\/opt\/field-school\.env"\)/);
  assert.match(flip, /os\.environ\.get\("FLIP_CADDY_FILE", "\/opt\/ae-coach\/docker\/Caddyfile"\)/);
  assert.equal(existsSync("/opt/field-school.env"), false);
  assert.equal(existsSync("/opt/ae-coach/docker/Caddyfile"), false);

  const [envPy, caddyPy] = pythonBlocks(flip);
  assert.equal(pythonBlocks(flip).length, 2);

  const dir = mkdtempSync(join(tmpdir(), "auth-url-flip-"));
  try {
    const envFile = join(dir, "field-school.env");
    const original = [
      "AUTH_SECRET=fixture-secret",
      "AUTH_URL=https://university.benjohnson.ai",
      "NEXTAUTH_URL=https://university.benjohnson.ai",
      "OTHER=keep",
      "",
    ].join("\n");
    writeFileSync(envFile, original);
    const first = runPython(envPy, { FLIP_ENV_FILE: envFile });
    assert.equal(first.status, 0, first.stderr);
    const once = readFileSync(envFile, "utf8");
    assert.equal(
      once,
      [
        "AUTH_SECRET=fixture-secret",
        "AUTH_URL=https://portal.fieldschool.ai",
        "NEXTAUTH_URL=https://portal.fieldschool.ai",
        "OTHER=keep",
        "",
      ].join("\n"),
    );
    const second = runPython(envPy, { FLIP_ENV_FILE: envFile });
    assert.equal(second.status, 0, second.stderr);
    assert.equal(readFileSync(envFile, "utf8"), once);

    const missing = join(dir, "missing.env");
    writeFileSync(missing, "OTHER=keep\n");
    const refused = runPython(envPy, { FLIP_ENV_FILE: missing });
    assert.notEqual(refused.status, 0);
    assert.equal(readFileSync(missing, "utf8"), "OTHER=keep\n");

    const caddyFile = join(dir, "Caddyfile");
    const wrapped = `# keep\n${OLD_CADDY}# tail\n`;
    writeFileSync(caddyFile, wrapped);
    const applied = runPython(caddyPy, { FLIP_CADDY_FILE: caddyFile });
    assert.equal(applied.status, 0, applied.stderr);
    const rewritten = readFileSync(caddyFile, "utf8");
    assert.equal(rewritten, `# keep\n${NEW_CADDY}# tail\n`);
    const again = runPython(caddyPy, { FLIP_CADDY_FILE: caddyFile });
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /Caddy university 301 already applied/);
    assert.equal(readFileSync(caddyFile, "utf8"), rewritten);

    const odd = join(dir, "odd.Caddyfile");
    writeFileSync(odd, "no university block\n");
    const rejected = runPython(caddyPy, { FLIP_CADDY_FILE: odd });
    assert.notEqual(rejected.status, 0);
    assert.equal(readFileSync(odd, "utf8"), "no university block\n");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
