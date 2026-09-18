export const JUST_CAP_ID = "27pn9xs0zk8a73g";
export const JUST_ASSET_ID = "3c8fe86f6dee8199a716ceec774f0e72";
export const YCJDT_ASSET_ID = "3c9fe86f6dee81299337e318cfef6982";
export const YCJDT_CAP_ID = "j013r823wx9ecaf";

export const LONGFORM_DEFAULT = "remotion";
export const LONGFORM_FALLBACK = "melt";
export const CLEANING_STATUS = "Cleaning";
export const HLS_READY = "HLS Ready";

export const BRAND = {
  cream: "#EFE7D6",
  ink: "#1A1A16",
  mark: "Field School",
};

export const CHECKLIST = [
  "frame_1920x1080",
  "field_school_mark",
  "full_duration_pedagogical_chapters",
  "cream_ink",
  "remotion_default",
  "melt_fallback_only",
  "no_generic_ai_look",
];

export const UNAUTHORIZED = [
  "ycjdt_proposed_chapters_accept",
  "publish_distribute",
];

const GENERIC_AI = [
  /in this video we'?ll explore/i,
  /let'?s dive in/i,
  /welcome to this (course|lesson|video)/i,
  /generic-?ai/i,
  /#7[cC]3[aA][eE][dD]/,
  /#A78BFA/i,
  /purple gradient/i,
];

const GENERIC_CHAPTER = /^(chapter|part|untitled|section|clip)\s*\d*$/i;

export function isJustCapId(capId) {
  return String(capId || "").trim() === JUST_CAP_ID;
}

export function isJustAsset(assetId) {
  return String(assetId || "").replace(/-/g, "") === JUST_ASSET_ID.replace(/-/g, "");
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

  if (isJustCapId(capId) || isJustAsset(assetId)) {
    return { ok: false, error: "just_locked", spec: null };
  }
  if (!capId) {
    return { ok: false, error: "missing_cap_id", spec: null };
  }
  if (!String(ingest.transcript || "").trim()) {
    return { ok: false, error: "stt_incomplete", spec: null };
  }

  const engine = longformEngine(capId);
  if (!engine.ok) return { ok: false, error: engine.error, spec: null };

  const duration = Number(ingest.duration || 0);
  const chapters = normalizeChapters(ingest.chapters, duration);

  const spec = {
    format: "course",
    capId,
    assetId: assetId || null,
    transcript: String(ingest.transcript),
    duration,
    width: Number(ingest.width || 1920),
    height: Number(ingest.height || 1080),
    engine: ingest.engine || engine.engine,
    fallback: LONGFORM_FALLBACK,
    remotionFailed: Boolean(ingest.remotionFailed),
    mark: ingest.mark || BRAND.mark,
    palette: {
      cream: ingest.cream || BRAND.cream,
      ink: ingest.ink || BRAND.ink,
    },
    look: ingest.look || "field-school",
    overlay: {
      logo: "/opt/field-school/edit/brand/logo.png",
      title: "",
      x: 1576,
      y: 24,
      w: 80,
      h: 64,
    },
    transition: { id: "luma", frames: 12 },
    silence_cut: false,
    cuts: [],
    broll: [],
    chapters,
    shorts: { mode: "blur" },
  };

  return { ok: true, spec };
}

export function runQualityChecklist(spec = {}) {
  const checks = {
    frame_1920x1080: Number(spec.width) === 1920 && Number(spec.height) === 1080,
    field_school_mark:
      String(spec.mark || "").includes(BRAND.mark) && Boolean(spec.overlay?.logo),
    full_duration_pedagogical_chapters: chaptersCoverLesson(spec.chapters, spec.duration),
    cream_ink:
      normalizeHex(spec.palette?.cream) === normalizeHex(BRAND.cream) &&
      normalizeHex(spec.palette?.ink) === normalizeHex(BRAND.ink),
    remotion_default:
      spec.engine === LONGFORM_DEFAULT ||
      (spec.engine === LONGFORM_FALLBACK && spec.remotionFailed === true),
    melt_fallback_only:
      spec.fallback === LONGFORM_FALLBACK &&
      (spec.engine !== LONGFORM_FALLBACK || spec.remotionFailed === true),
    no_generic_ai_look: !hasGenericAiLook(spec),
  };

  const failures = CHECKLIST.filter((key) => !checks[key]);
  return {
    ok: failures.length === 0,
    pass: failures.length === 0,
    checks,
    failures,
  };
}

export function cleaningOnPass(ingest = {}, applyStatus) {
  if (isJustCapId(ingest.capId) || isJustAsset(ingest.assetId)) {
    return {
      ok: false,
      error: "just_locked",
      action: "stop_take",
      status: null,
      escalate: false,
      softShip: false,
    };
  }

  if (ingest.status === HLS_READY) {
    return {
      ok: false,
      error: "already_hls_ready",
      action: "stop_take",
      status: null,
      escalate: false,
      softShip: false,
    };
  }

  const written = writeEditSpec(ingest);
  if (!written.ok) {
    return escalateToCdm({
      capId: ingest.capId,
      assetId: ingest.assetId,
      failures: [written.error],
    });
  }

  const quality = runQualityChecklist(written.spec);
  if (!quality.pass) {
    return escalateToCdm({
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

export function escalateToCdm({ capId, assetId, spec, failures, checks } = {}) {
  return {
    ok: false,
    action: "stop_take",
    status: null,
    escalate: "chief_decision_maker",
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

function normalizeChapters(chapters, duration) {
  if (!Array.isArray(chapters) || chapters.length === 0) return [];
  return chapters.map((chapter, index) => {
    const start = Number(chapter.start ?? chapter.in ?? 0);
    const next = chapters[index + 1];
    const end = Number(
      chapter.end ?? chapter.out ?? (next ? next.start : duration),
    );
    return {
      title: String(chapter.title || "").trim(),
      start,
      end,
    };
  });
}

function chaptersCoverLesson(chapters, duration) {
  if (!Array.isArray(chapters) || chapters.length === 0) return false;
  if (!(Number(duration) > 0)) return false;
  if (chapters[0].start > 1) return false;
  if (chapters[chapters.length - 1].end < Number(duration) - 1) return false;
  for (const chapter of chapters) {
    if (!chapter.title || GENERIC_CHAPTER.test(chapter.title)) return false;
    if (!(chapter.end > chapter.start)) return false;
  }
  for (let i = 1; i < chapters.length; i += 1) {
    if (chapters[i].start - chapters[i - 1].end > 1) return false;
  }
  return true;
}

function normalizeHex(value) {
  return String(value || "").trim().toUpperCase();
}

function hasGenericAiLook(spec) {
  const hay = JSON.stringify(spec);
  if (spec.look && spec.look !== "field-school") return true;
  return GENERIC_AI.some((pattern) => pattern.test(hay));
}
