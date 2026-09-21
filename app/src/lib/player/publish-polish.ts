import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LESSON_SPINE_MASTER_SHA256 } from "./lesson-spine-meta";

export const PUBLISH_POLISH_LOCKED_SHA256 = LESSON_SPINE_MASTER_SHA256;

export type PublishPolishRow = {
  at: string;
  dest_sha256: string;
  published: true;
  distribute: false;
  launch: "CLOSED 0/8";
  actor: string;
  note: string;
};

export type PublishPolishEvidence = {
  ok: true;
  status: "Published";
  kind: "HLS";
  polish: true;
  published: true;
  distribute: false;
  launch: "CLOSED 0/8";
  master_sha256: string;
  play: "/play/lesson-spine";
  ready: "/api/media/lesson-spine/ready";
  rows: PublishPolishRow[];
};

const CANDIDATES = [
  join(process.cwd(), "public/lessons/hls/publish-polish.json"),
  "/opt/cursor/artifacts/lesson-spine-play-rail-hls/2026-09-21/publish-polish.json",
];

export function emptyPublishPolish(): PublishPolishEvidence {
  return {
    ok: true,
    status: "Published",
    kind: "HLS",
    polish: true,
    published: true,
    distribute: false,
    launch: "CLOSED 0/8",
    master_sha256: PUBLISH_POLISH_LOCKED_SHA256,
    play: "/play/lesson-spine",
    ready: "/api/media/lesson-spine/ready",
    rows: [],
  };
}

export function polishReadyFields<T extends Record<string, unknown>>(body: T) {
  return {
    ...body,
    published: true,
    publish: "polished",
    distribute: false,
    launch: "CLOSED 0/8",
  };
}

export function readPublishPolish(): PublishPolishEvidence {
  for (const dest of CANDIDATES) {
    if (!existsSync(dest)) continue;
    try {
      const body = JSON.parse(readFileSync(dest, "utf8")) as PublishPolishEvidence;
      if (body.master_sha256 !== PUBLISH_POLISH_LOCKED_SHA256) continue;
      return {
        ...emptyPublishPolish(),
        ...body,
        published: true,
        polish: true,
        distribute: false,
        launch: "CLOSED 0/8",
        rows: Array.isArray(body.rows) ? body.rows : [],
      };
    } catch {
      continue;
    }
  }
  return emptyPublishPolish();
}

export function recordPublishPolish(input: {
  destSha256?: string;
  distribute?: unknown;
  actor: string;
  destPath?: string;
}) {
  if (input.distribute === true) {
    return { ok: false as const, error: "distribute_held" };
  }
  const destSha256 = String(input.destSha256 || "").trim();
  if (destSha256 !== PUBLISH_POLISH_LOCKED_SHA256) {
    return { ok: false as const, error: "dest_sha_mismatch" };
  }
  const current = readPublishPolish();
  const row: PublishPolishRow = {
    at: new Date().toISOString(),
    dest_sha256: destSha256,
    published: true,
    distribute: false,
    launch: "CLOSED 0/8",
    actor: input.actor.trim().slice(0, 120) || "operator",
    note: "Play-rail Publish polish. Cleaning→Publish real. Distribute HELD. Launch CLOSED 0/8.",
  };
  const next: PublishPolishEvidence = {
    ...current,
    published: true,
    polish: true,
    distribute: false,
    launch: "CLOSED 0/8",
    rows: [...current.rows, row],
  };
  const dest =
    input.destPath ||
    join(process.cwd(), "public/lessons/hls/publish-polish.json");
  writeFileSync(dest, `${JSON.stringify(next, null, 2)}\n`);
  return { ok: true as const, evidence: next, row };
}
