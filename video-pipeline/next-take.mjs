export const JUST_CAP_ID = "27pn9xs0zk8a73g";
export const JUST_ASSET_ID = "3c8fe86f6dee8199a716ceec774f0e72";
export const YCJDT_ASSET_ID = "3c9fe86f6dee81299337e318cfef6982";
export const YCJDT_CAP_ID = "j013r823wx9ecaf";

export const LONGFORM_DEFAULT = "remotion";
export const LONGFORM_FALLBACK = "melt";
export const CLEANING_STATUS = "Cleaning";
export const HLS_READY = "HLS Ready";

export const LOGO_LOCK = "/opt/field-school/edit/brand/logo.png";
export const OVERLAY_LOCK = { x: 1576, y: 24, w: 80, h: 64 };
export const CREAM = "#EFE7D6";
export const INK = "#1A1A16";
export const FONT = "Fraunces";
export const HEAD_WIDTH_FRAC = 0.38;
export const DURATION_SLACK = 0.51;

export const BRAND = {
  cream: CREAM,
  ink: INK,
  mark: "Field School",
  font: FONT,
};

export const CHECKLIST = [
  "cap_take_copy",
  "chapters_cover",
  "overlay_lock",
  "cards_head",
  "remotion_just",
  "hls_then_raw",
];

export const UNAUTHORIZED = [
  "ycjdt_proposed_chapters_accept",
  "publish_distribute",
];

const HELD = new Set(["Published", "Distributed"]);

export function isJustCapId(capId) {
  return String(capId || "").trim() === JUST_CAP_ID;
}

export function isJustAsset(assetId) {
  return String(assetId || "").replace(/-/g, "") === JUST_ASSET_ID.replace(/-/g, "");
}

export function isJust({ capId, assetId, raw, log } = {}) {
  const blob = [capId, assetId, raw, log].filter(Boolean).join(" ");
  return blob.includes(JUST_CAP_ID) || blob.replace(/-/g, "").includes(JUST_ASSET_ID.replace(/-/g, ""));
}

export function longformEngine(capId) {
  if (isJustCapId(capId)) {
    return { ok: false, error: "just_locked", engine: null };
  }
  return { ok: true, engine: LONGFORM_DEFAULT, fallback: LONGFORM_FALLBACK };
}

export function authorize(step, ctx = {}) {
  if (UNAUTHORIZED.includes(step)) {
    return { ok: false, error: "not_authorized" };
  }
  if (step === "cleaning_flip") {
    return { ok: false, error: "not_authorized_use_cleaning_on_pass" };
  }
  if (step === "cleaning_on_pass") {
    if (!ctx.pass) return { ok: false, error: "checklist_failed" };
    return { ok: true };
  }
  return { ok: true };
}

export function writeEditSpec(ingest = {}) {
  const capId = String(ingest.capId || "").trim();
  const assetId = String(ingest.assetId || "").trim();

  if (isJust({ capId, assetId, raw: ingest.rawCapFile, log: ingest.processingLog })) {
    return { ok: false, error: "just_locked", spec: null };
  }
  if (!capId) {
    return { ok: false, error: "missing_cap_id", spec: null };
  }

  const duration = Number(ingest.duration || 0);
  if (!(duration > 0)) {
    return { ok: false, error: "duration_missing", spec: null };
  }

  const engine = longformEngine(capId);
  if (!engine.ok) return { ok: false, error: engine.error, spec: null };

  const title = String(ingest.title || "").trim();
  const overlayTitle = ingest.overlayMode === "Logo" ? "" : title;

  const spec = {
    engine: LONGFORM_DEFAULT,
    fallback: LONGFORM_FALLBACK,
    duration,
    overlay: {
      logo: LOGO_LOCK,
      title: overlayTitle,
      ...OVERLAY_LOCK,
    },
    cards: {
      paper: CREAM,
      ink: INK,
      font: FONT,
    },
    head: {
      dock: ingest.headDock || "right",
      width_frac: HEAD_WIDTH_FRAC,
      full_frame: false,
    },
    chapters: normalizeChapters(ingest.chapters, duration),
    cuts: [{ in: 0, out: duration }],
    remotion: { duration },
    raw_drop: false,
  };

  return { ok: true, spec };
}

export function runQualityChecklist(asset = {}, spec = null, extras = {}) {
  const capId = String(asset.capId || asset.cap_id || "").trim();
  const just = isJust({
    capId,
    assetId: asset.assetId || asset.asset_id,
    raw: asset.rawCapFile || asset.raw_cap_file,
    log: asset.processingLog || asset.processing_log,
  });

  const checks = {
    cap_take_copy: capTakeCopy(asset, capId),
    chapters_cover: chaptersCover(asset),
    overlay_lock: overlayLock(asset, spec),
    cards_head: cardsHead(spec),
    remotion_just: remotionJust(asset, spec, extras, just),
    hls_then_raw: hlsThenRaw(asset, spec, extras),
  };

  const failures = CHECKLIST.filter((key) => !checks[key].ok);
  return {
    ok: failures.length === 0,
    pass: failures.length === 0,
    checks,
    failures: failures.map((key) => `${key}: ${checks[key].detail}`),
    just,
  };
}

export function cleaningOnPass(ingest = {}, applyStatus) {
  const status = String(ingest.status || "Review");
  if (HELD.has(status)) {
    return {
      ok: false,
      error: "not_authorized",
      action: "held_publish",
      status,
      escalate: false,
      softShip: false,
    };
  }

  const written = writeEditSpec(ingest);
  if (!written.ok) {
    return holdAndEscalate({
      capId: ingest.capId,
      assetId: ingest.assetId,
      failures: [written.error],
      action: written.error === "just_locked" ? "skip_just" : "hold",
    });
  }

  const quality = runQualityChecklist(ingest, written.spec, ingest.extras || {});
  if (quality.just) {
    return holdAndEscalate({
      capId: ingest.capId,
      assetId: ingest.assetId,
      spec: written.spec,
      failures: quality.failures.length ? quality.failures : ["remotion_just: Just locked until Ready"],
      checks: quality.checks,
      action: "skip_just",
    });
  }
  if (!quality.pass) {
    return holdAndEscalate({
      capId: ingest.capId,
      assetId: ingest.assetId,
      spec: written.spec,
      failures: quality.failures,
      checks: quality.checks,
    });
  }

  const flip = {
    ok: true,
    action: "flip_status",
    status: CLEANING_STATUS,
    spec: written.spec,
    quality,
    escalate: false,
    softShip: false,
    apply: {
      assetId: ingest.assetId || null,
      property: "Status",
      value: CLEANING_STATUS,
    },
  };

  if (typeof applyStatus === "function") {
    flip.applied = applyStatus(flip.apply);
  }

  return flip;
}

export function holdAndEscalate({ capId, assetId, spec, failures, checks, action } = {}) {
  return {
    ok: false,
    action: action || "hold",
    status: null,
    escalate: true,
    escalateTo: "chief_decision_maker",
    via: "cto_cursor_gate",
    softShip: false,
    capId: capId || null,
    assetId: assetId || null,
    spec: spec || null,
    failures: failures || [],
    checks: checks || null,
    gate: "video-pipeline/CURSOR_GATE.md",
  };
}

export const escalateToCdm = holdAndEscalate;

function capTakeCopy(asset, capId) {
  const title = String(asset.title || "").trim();
  const transcript = String(asset.transcript || "").trim();
  const summary = String(asset.summary || asset.ai_summary || "").trim();
  const raw = String(asset.rawCapFile || asset.raw_cap_file || "").trim();
  const missing = [];
  if (!capId) missing.push("cap_id");
  if (!raw && !capId) missing.push("cap_take");
  if (!transcript) missing.push("transcript");
  if (!title) missing.push("title");
  if (!summary) missing.push("summary");
  if (missing.length) return { ok: false, detail: `missing ${missing.join(",")}` };
  return { ok: true, detail: "cap take + transcript/title/summary" };
}

function chaptersCover(asset) {
  const duration = Number(asset.duration);
  if (!(duration > 0)) return { ok: false, detail: "duration missing" };
  const chapters = normalizeChapters(asset.chapters, duration);
  if (!chapters.length) return { ok: false, detail: "no chapters" };
  if (chapters[0].start > DURATION_SLACK) return { ok: false, detail: "gap at start" };
  if (chapters[chapters.length - 1].end + DURATION_SLACK < duration) {
    return { ok: false, detail: "gap at end" };
  }
  for (let i = 0; i < chapters.length; i += 1) {
    const chapter = chapters[i];
    if (!(chapter.end > chapter.start)) return { ok: false, detail: `empty ${chapter.title}` };
    if (i < chapters.length - 1 && chapters[i + 1].start - chapter.end > DURATION_SLACK) {
      return { ok: false, detail: `gap before ${chapters[i + 1].title}` };
    }
  }
  return { ok: true, detail: "chapters cover full duration" };
}

function overlayLock(asset, spec) {
  if (!spec) return { ok: false, detail: "no edit spec" };
  const overlay = spec.overlay;
  if (!overlay || typeof overlay !== "object") return { ok: false, detail: "overlay missing" };
  if (String(overlay.logo || "") !== LOGO_LOCK) return { ok: false, detail: "logo path off lock" };
  for (const [key, expected] of Object.entries(OVERLAY_LOCK)) {
    if (Number(overlay[key]) !== expected) return { ok: false, detail: `overlay ${key} off lock` };
  }
  const title = String(asset.title || "").trim();
  if (String(overlay.title || "").trim() !== title) {
    return { ok: false, detail: "overlay title off lock" };
  }
  return { ok: true, detail: "logo+title match lock" };
}

function cardsHead(spec) {
  if (!spec) return { ok: false, detail: "no edit spec" };
  const cards = spec.cards;
  if (!cards || typeof cards !== "object") return { ok: false, detail: "cards missing" };
  const paper = String(cards.paper || cards.cream || "").toUpperCase();
  const ink = String(cards.ink || "").toUpperCase();
  const font = String(cards.font || "");
  if (paper !== CREAM.toUpperCase() || ink !== INK.toUpperCase() || font !== FONT) {
    return { ok: false, detail: "cards not cream/ink/Fraunces" };
  }
  const head = spec.head;
  if (!head || typeof head !== "object") return { ok: false, detail: "head missing" };
  if (head.full_frame === true) return { ok: false, detail: "head full-frame covers type" };
  if (!["left", "right"].includes(String(head.dock || ""))) {
    return { ok: false, detail: "head dock missing" };
  }
  const width = Number(head.width_frac);
  if (!(width > 0) || width > HEAD_WIDTH_FRAC + 0.001) {
    return { ok: false, detail: "head clear zone lost" };
  }
  return { ok: true, detail: "cream/ink/Fraunces + head clear zone" };
}

function remotionJust(asset, spec, extras, just) {
  if (just) return { ok: false, detail: "Just locked until Ready" };
  if (!spec) return { ok: false, detail: "no edit spec" };
  if (spec.engine !== LONGFORM_DEFAULT) return { ok: false, detail: "Remotion is not default" };
  const leftovers = proposeLeftovers(spec);
  if (leftovers.length) return { ok: false, detail: `propose leftovers: ${leftovers.join(",")}` };
  const duration = Number(asset.duration);
  if (!(duration > 0)) return { ok: false, detail: "duration missing" };
  const declared = spec.remotion?.duration ?? spec.duration;
  if (asNumber(declared) == null || Math.abs(Number(declared) - duration) > DURATION_SLACK) {
    return { ok: false, detail: "Remotion duration mismatch" };
  }
  const master = extras.remotion_master_duration;
  if (master != null && Math.abs(Number(master) - duration) > DURATION_SLACK) {
    return { ok: false, detail: "Remotion master duration mismatch" };
  }
  return { ok: true, detail: "Remotion duration matches; no leftovers; Just locked" };
}

function hlsThenRaw(asset, spec, extras) {
  const status = String(asset.status || "");
  const rawDropped = Boolean(extras.raw_dropped);
  const rawDrop = Boolean(spec?.raw_drop);
  if (status === HLS_READY) return { ok: true, detail: "HLS Ready; raw may drop" };
  if (rawDropped || rawDrop) return { ok: false, detail: "raw dropped before HLS Ready" };
  return { ok: true, detail: "raw held until HLS Ready" };
}

function proposeLeftovers(spec) {
  const leftover = [];
  for (const key of ["proposed_chapters", "proposed_cuts"]) {
    if (spec[key] && (Array.isArray(spec[key]) ? spec[key].length : true)) leftover.push(key);
  }
  const remotion = spec.remotion;
  if (remotion && typeof remotion === "object") {
    for (const key of ["title_cards", "vo_slots"]) {
      const rows = remotion[key] || [];
      if (rows.some((row) => row && row.draft)) leftover.push(`remotion.${key}`);
    }
  }
  return leftover;
}

function normalizeChapters(chapters, duration) {
  if (!Array.isArray(chapters) || chapters.length === 0) return [];
  return chapters.map((chapter, index) => {
    const start = Number(chapter.start ?? chapter.in ?? 0);
    const next = chapters[index + 1];
    const end = Number(chapter.end ?? chapter.out ?? (next ? next.start : duration));
    return {
      title: String(chapter.title || "").trim(),
      start,
      end,
    };
  });
}

function asNumber(value) {
  if (typeof value === "boolean" || (typeof value !== "number" && typeof value !== "string")) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
