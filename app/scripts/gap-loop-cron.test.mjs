import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const savedDatabaseUrl = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { pathToFileURL } from "node:url";
const src = ${JSON.stringify(src)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") {
    return nextResolve("next/server.js", context);
  }
  const parent = context.parentURL || "";
  const ours = parent.includes("/app/src/") || parent.includes("/app/scripts/");
  if (ours && specifier.startsWith("@/")) {
    return nextResolve(pathToFileURL(src + "/" + specifier.slice(2) + ".ts").href, context);
  }
  if (ours && specifier.startsWith(".") && !/\\.(ts|js|mjs|cjs|json)$/.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}
`),
);

const coaching = await import(pathToFileURL(join(src, "app/api/cron/coaching/route.ts")).href);
const knowledge = await import(pathToFileURL(join(src, "lib/gap-loop/cron.ts")).href);

const SECRET = "cron-secret-canary-do-not-echo";

test.after(() => {
  if (savedDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = savedDatabaseUrl;
});

function request(authorization) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("https://portal.fieldschool.ai/api/cron/knowledge-loop", {
    method: "POST",
    headers,
  });
}

test("bearerMatches matches the coaching cron", () => {
  assert.equal(knowledge.handleKnowledgeCron === undefined, false);
  assert.equal(coaching.bearerMatches(`Bearer ${SECRET}`, SECRET), true);
  assert.equal(coaching.bearerMatches("Bearer wrong", SECRET), false);
  assert.equal(coaching.bearerMatches(`Bearer ${SECRET}`, ""), false);
  assert.equal(coaching.bearerMatches(null, SECRET), false);
});

test("POST is 401 without the secret", async () => {
  for (const authorization of [undefined, "Bearer wrong", `Bearer ${""}`]) {
    const response = await knowledge.handleKnowledgeCron(request(authorization), {
      env: authorization === undefined ? {} : { CRON_SECRET: SECRET },
      drain: async () => {
        throw new Error("drain should not run");
      },
    });
    assert.equal(response.status, 401);
  }
});

test("the route drains a researching run once under the lease", async () => {
  let held = false;
  let runs = 0;
  const drain = async () => {
    if (held) return 0;
    held = true;
    runs += 1;
    return 1;
  };
  const first = await knowledge.handleKnowledgeCron(request(`Bearer ${SECRET}`), {
    env: { CRON_SECRET: SECRET },
    drain,
  });
  const second = await knowledge.handleKnowledgeCron(request(`Bearer ${SECRET}`), {
    env: { CRON_SECRET: SECRET },
    drain,
  });
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { ok: true, rowsChanged: 1 });
  assert.deepEqual(await second.json(), { ok: true, rowsChanged: 0 });
  assert.equal(runs, 1);
  const compose = readFileSync(new URL("../deploy/docker-compose.yml", import.meta.url), "utf8");
  const service = compose.slice(compose.indexOf("\n  knowledge-loop-cron:"));
  const command = service.split("\n").find((line) => line.includes("command:"));
  assert.equal(typeof command, "string");
  assert.match(command, /curl -sS -X POST -H \\"Authorization: Bearer \$\$CRON_SECRET\\" http:\/\/field-school-app:3000\/api\/cron\/knowledge-loop/);
  assert.match(command, /sleep 900/);
  assert.doesNotMatch(command, /\\\s*$/);
  assert.doesNotMatch(command, /echo \\"[^"]*CRON_SECRET/);
});
