import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
export const BEARING_DIMS = [
  "drive",
  "harmony",
  "structure",
  "pace",
  "abstraction",
  "challenge",
  "duty",
  "expression",
] as const;
export type BearingDim = (typeof BEARING_DIMS)[number];
export type Weights = Partial<Record<BearingDim, number>>;

export type InstrumentItem = {
  n: number;
  key: string;
  prompt: string;
  weights: Weights;
  child: boolean;
};

export const PINNED_MD = "docs/campus-runtime/fp-50-v1.md";
export const PINNED_SQL_0003 = "app/db/0003_pattern_weights.sql";
export const PINNED_SQL_0002 = "app/db/0002_field_pattern.sql";
export const PINNED_SQL_0004 = "app/db/0004_tenants.sql";

const ROW =
  /^\| (\d+) \| (.+?) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| ([y ]*) \|$/;

function searchRoots() {
  const roots = new Set<string>();
  const here = dirname(fileURLToPath(import.meta.url));
  for (const root of [
    process.cwd(),
    join(process.cwd(), ".."),
    join(process.cwd(), "app"),
    join(here, "../../../.."),
    join(here, "../../../../.."),
  ]) {
    roots.add(root);
  }
  return [...roots];
}

function resolvePinned(relFromRepo: string) {
  const alt = relFromRepo.startsWith("app/") ? relFromRepo.slice(4) : relFromRepo;
  for (const root of searchRoots()) {
    for (const rel of [relFromRepo, alt]) {
      const path = join(root, rel);
      if (existsSync(path)) return path;
    }
  }
  throw new Error(`pinned_bank_missing:${relFromRepo}`);
}

export function readPinnedBankFiles() {
  const mdPath = resolvePinned(PINNED_MD);
  const sql3Path = resolvePinned(PINNED_SQL_0003);
  const sql2Path = resolvePinned(PINNED_SQL_0002);
  const sql4Path = resolvePinned(PINNED_SQL_0004);
  const md = readFileSync(mdPath, "utf8");
  const sql3 = readFileSync(sql3Path, "utf8");
  const sql2 = readFileSync(sql2Path, "utf8");
  const sql4 = readFileSync(sql4Path, "utf8");
  if (!/fp-50-v1/.test(md)) throw new Error("pinned_md_not_fp50");
  if (!/weights jsonb/i.test(sql3)) throw new Error("pinned_0003_missing_weights");
  if (!/member_profiles/.test(sql2)) throw new Error("pinned_0002_missing_profiles");
  if (!/household/.test(sql4) || !/sales/.test(sql4)) {
    throw new Error("pinned_0004_missing_tenants");
  }
  return { mdPath, sql3Path, sql2Path, sql4Path, md, sql3, sql2, sql4 };
}

export function parseFp50Markdown(md: string): InstrumentItem[] {
  const items: InstrumentItem[] = [];
  for (const line of md.split("\n")) {
    const m = line.match(ROW);
    if (!m) continue;
    const weights: Weights = {};
    BEARING_DIMS.forEach((dim: BearingDim, i) => {
      const n = Number(m[i + 3]);
      if (n) weights[dim] = n;
    });
    const n = Number(m[1]);
    items.push({
      n,
      key: `fp50-${String(n).padStart(2, "0")}`,
      prompt: m[2].trim(),
      weights,
      child: m[11].trim() === "y",
    });
  }
  if (items.length !== 50) {
    throw new Error(`fp50_expected_50_got_${items.length}`);
  }
  return items;
}

let cached: InstrumentItem[] | null = null;

/** Loads the pinned item bank. No second questionnaire. */
export function loadPinnedBank(): InstrumentItem[] {
  if (cached) return cached;
  const files = readPinnedBankFiles();
  cached = parseFp50Markdown(files.md);
  return cached;
}

export function pinnedSqlPaths() {
  const files = readPinnedBankFiles();
  return {
    sql2: files.sql2Path,
    sql3: files.sql3Path,
    sql4: files.sql4Path,
  };
}
