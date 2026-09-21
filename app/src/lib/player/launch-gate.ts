import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LESSON_SPINE_MASTER_SHA256 } from "./lesson-spine-meta";

export const LAUNCH_GATE_LOCKED_SHA256 = LESSON_SPINE_MASTER_SHA256;

export const LAUNCH_GATE_NODES = [
  "Product",
  "ICP",
  "Brand",
  "Offer",
  "Marketing",
  "Sales",
  "Legal",
  "Plan",
] as const;

export type LaunchGateRow = {
  id: string;
  unlock: string;
  landed: true;
  launch_pass: false;
  cite: string;
  path: string;
};

export type LaunchGateEvidence = {
  ok: true;
  launch: "CLOSED 0/8";
  pass: 0;
  nodes: 8;
  product: "HELD";
  distribute: false;
  master_sha256: string;
  play: "/play/lesson-spine";
  publish: "/operator/publish";
  rows: LaunchGateRow[];
  nodes_held: typeof LAUNCH_GATE_NODES;
};

const CANDIDATES = [
  join(process.cwd(), "public/lessons/hls/launch-gate.json"),
  "/opt/cursor/artifacts/lesson-spine-play-rail-hls/2026-09-21/launch-gate.json",
];

export function defaultLaunchGateRows(): LaunchGateRow[] {
  return [
    {
      id: "play-rail",
      unlock: "Ready HLS play rail",
      landed: true,
      launch_pass: false,
      cite: "PR 186 merge b8ba687",
      path: "/play/lesson-spine",
    },
    {
      id: "auth-signed-in",
      unlock: "AUTH signed-in Parent",
      landed: true,
      launch_pass: false,
      cite: "PR 188 merge d136a73",
      path: "/api/me",
    },
    {
      id: "stripe-three-plan",
      unlock: "Stripe Learn with Ben $100/$200/$1,000",
      landed: true,
      launch_pass: false,
      cite: "PR 189 merge 90df7d4",
      path: "/checkout?plan=100",
    },
    {
      id: "metering-fr-kb-3",
      unlock: "FR-KB-3 metering UI",
      landed: true,
      launch_pass: false,
      cite: "PR 190 merge 38912ed",
      path: "/metering",
    },
    {
      id: "publish-polish",
      unlock: "Publish polish operator path",
      landed: true,
      launch_pass: false,
      cite: "PR 191 merge aa47d07",
      path: "/operator/publish",
    },
  ];
}

export function emptyLaunchGate(): LaunchGateEvidence {
  return {
    ok: true,
    launch: "CLOSED 0/8",
    pass: 0,
    nodes: 8,
    product: "HELD",
    distribute: false,
    master_sha256: LAUNCH_GATE_LOCKED_SHA256,
    play: "/play/lesson-spine",
    publish: "/operator/publish",
    rows: defaultLaunchGateRows(),
    nodes_held: LAUNCH_GATE_NODES,
  };
}

export function readLaunchGate(): LaunchGateEvidence {
  for (const dest of CANDIDATES) {
    if (!existsSync(dest)) continue;
    try {
      const body = JSON.parse(readFileSync(dest, "utf8")) as LaunchGateEvidence;
      if (body.master_sha256 !== LAUNCH_GATE_LOCKED_SHA256) continue;
      return {
        ...emptyLaunchGate(),
        ...body,
        launch: "CLOSED 0/8",
        pass: 0,
        nodes: 8,
        product: "HELD",
        distribute: false,
        rows: Array.isArray(body.rows) && body.rows.length
          ? body.rows.map((row) => ({
              ...row,
              landed: true as const,
              launch_pass: false as const,
            }))
          : defaultLaunchGateRows(),
        nodes_held: LAUNCH_GATE_NODES,
      };
    } catch {
      continue;
    }
  }
  return emptyLaunchGate();
}
