"""Six-item machine checklist. Fail any → hold. Pass all → Cleaning is allowed."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping

from .edit_spec import (
    CREAM,
    FONT,
    HEAD_WIDTH_FRAC,
    INK,
    LOGO_LOCK,
    OVERLAY_LOCK,
    is_just,
    parse_chapters,
)

CHECKLIST = (
    "cap_take_copy",
    "chapters_cover",
    "overlay_lock",
    "cards_head",
    "remotion_just",
    "hls_then_raw",
)

DURATION_SLACK = 0.51
HELD = frozenset({"Published", "Distributed"})
ESCALATE_TO = "Chief Decision Maker"
ESCALATE_VIA = "CTO/Cursor Gate"


@dataclass(frozen=True)
class CheckResult:
    item: str
    ok: bool
    detail: str


@dataclass(frozen=True)
class GateVerdict:
    passed: bool
    next_status: str
    escalate: bool
    action: str
    checks: tuple[CheckResult, ...]
    escalate_to: str = ESCALATE_TO
    escalate_via: str = ESCALATE_VIA
    failures: tuple[str, ...] = field(default_factory=tuple)

    def log_line(self) -> str:
        if self.passed:
            return "Cleaning (quality gate pass)"
        if self.action == "held_publish":
            return "HOLD Publish/Distribute still held"
        reasons = "; ".join(self.failures) or self.action
        return f"HOLD escalate {self.escalate_to} via {self.escalate_via}: {reasons}"


def evaluate(
    asset: Mapping[str, Any],
    spec: Mapping[str, Any] | None,
    *,
    extras: Mapping[str, Any] | None = None,
) -> GateVerdict:
    extras = extras or {}
    status = str(asset.get("status") or "")
    if status in HELD:
        return GateVerdict(
            passed=False,
            next_status=status,
            escalate=False,
            action="held_publish",
            checks=(),
            failures=("publish_distribute_held",),
        )

    cap_id = _cap_id(asset)
    just = is_just(
        cap_id=cap_id,
        asset_id=str(asset.get("asset_id") or asset.get("page_id") or ""),
        raw=str(asset.get("raw_cap_file") or ""),
        log=str(asset.get("processing_log") or ""),
    )
    checks = (
        _cap_take_copy(asset, cap_id),
        _chapters_cover(asset),
        _overlay_lock(asset, spec),
        _cards_head(spec),
        _remotion_just(asset, spec, extras, just=just),
        _hls_then_raw(asset, spec, extras),
    )
    failures = tuple(f"{item.item}: {item.detail}" for item in checks if not item.ok)
    passed = not failures
    if just:
        return GateVerdict(
            passed=False,
            next_status=status or "Review",
            escalate=True,
            action="skip_just",
            checks=checks,
            failures=failures or ("remotion_just: Just locked until Ready",),
        )
    if passed:
        return GateVerdict(
            passed=True,
            next_status="Cleaning",
            escalate=False,
            action="cleaning",
            checks=checks,
        )
    return GateVerdict(
        passed=False,
        next_status=status or "Review",
        escalate=True,
        action="hold",
        checks=checks,
        failures=failures,
    )


def _cap_id(asset: Mapping[str, Any]) -> str | None:
    value = asset.get("cap_id") or asset.get("cap_video_id")
    if isinstance(value, str) and value.strip():
        return value.strip()
    log = str(asset.get("processing_log") or "")
    for line in log.splitlines():
        if line.startswith("cap_video_id="):
            found = line.split("=", 1)[1].strip()
            if found:
                return found
    raw = str(asset.get("raw_cap_file") or "")
    if "/dev/" in raw:
        return raw.rstrip("/").rsplit("/", 1)[-1] or None
    return None


def _cap_take_copy(asset: Mapping[str, Any], cap_id: str | None) -> CheckResult:
    title = str(asset.get("title") or "").strip()
    transcript = str(asset.get("transcript") or "").strip()
    summary = str(asset.get("ai_summary") or asset.get("summary") or "").strip()
    raw = str(asset.get("raw_cap_file") or "").strip()
    missing: list[str] = []
    if not cap_id:
        missing.append("cap_id")
    if not raw and not cap_id:
        missing.append("cap_take")
    if not transcript:
        missing.append("transcript")
    if not title:
        missing.append("title")
    if not summary:
        missing.append("summary")
    if missing:
        return CheckResult("cap_take_copy", False, "missing " + ",".join(missing))
    return CheckResult("cap_take_copy", True, "cap take + transcript/title/summary")


def _chapters_cover(asset: Mapping[str, Any]) -> CheckResult:
    duration = asset.get("duration")
    if not isinstance(duration, (int, float)) or duration <= 0:
        return CheckResult("chapters_cover", False, "duration missing")
    chapters = parse_chapters(asset.get("chapters"), duration=float(duration))
    if not chapters:
        return CheckResult("chapters_cover", False, "no chapters")
    if chapters[0]["start"] > DURATION_SLACK:
        return CheckResult("chapters_cover", False, "gap at start")
    if chapters[-1]["end"] + DURATION_SLACK < float(duration):
        return CheckResult("chapters_cover", False, "gap at end")
    for index, chapter in enumerate(chapters[:-1]):
        nxt = chapters[index + 1]["start"]
        if nxt - chapter["end"] > DURATION_SLACK:
            return CheckResult("chapters_cover", False, f"gap before {chapters[index + 1]['title']}")
        if chapter["end"] <= chapter["start"]:
            return CheckResult("chapters_cover", False, f"empty {chapter['title']}")
    return CheckResult("chapters_cover", True, "chapters cover full duration")


def _overlay_lock(asset: Mapping[str, Any], spec: Mapping[str, Any] | None) -> CheckResult:
    if not spec:
        return CheckResult("overlay_lock", False, "no edit spec")
    overlay = spec.get("overlay")
    if not isinstance(overlay, dict):
        return CheckResult("overlay_lock", False, "overlay missing")
    logo = str(overlay.get("logo") or "")
    if logo != LOGO_LOCK:
        return CheckResult("overlay_lock", False, "logo path off lock")
    for key, expected in OVERLAY_LOCK.items():
        if _as_number(overlay.get(key)) != expected:
            return CheckResult("overlay_lock", False, f"overlay {key} off lock")
    title = str(asset.get("title") or "").strip()
    overlay_title = str(overlay.get("title") or "").strip()
    if overlay_title != title:
        return CheckResult("overlay_lock", False, "overlay title off lock")
    return CheckResult("overlay_lock", True, "logo+title match lock")


def _cards_head(spec: Mapping[str, Any] | None) -> CheckResult:
    if not spec:
        return CheckResult("cards_head", False, "no edit spec")
    cards = spec.get("cards")
    if not isinstance(cards, dict):
        return CheckResult("cards_head", False, "cards missing")
    paper = str(cards.get("paper") or cards.get("cream") or "").upper()
    ink = str(cards.get("ink") or "").upper()
    font = str(cards.get("font") or "")
    if paper != CREAM.upper() or ink != INK.upper() or font != FONT:
        return CheckResult("cards_head", False, "cards not cream/ink/Fraunces")
    head = spec.get("head")
    if not isinstance(head, dict):
        return CheckResult("cards_head", False, "head missing")
    if head.get("full_frame") is True:
        return CheckResult("cards_head", False, "head full-frame covers type")
    dock = str(head.get("dock") or "")
    if dock not in {"left", "right"}:
        return CheckResult("cards_head", False, "head dock missing")
    width = _as_number(head.get("width_frac"))
    if width is None or width > HEAD_WIDTH_FRAC + 0.001:
        return CheckResult("cards_head", False, "head clear zone lost")
    return CheckResult("cards_head", True, "cream/ink/Fraunces + head clear zone")


def _remotion_just(
    asset: Mapping[str, Any],
    spec: Mapping[str, Any] | None,
    extras: Mapping[str, Any],
    *,
    just: bool,
) -> CheckResult:
    if just:
        return CheckResult("remotion_just", False, "Just locked until Ready")
    if not spec:
        return CheckResult("remotion_just", False, "no edit spec")
    if spec.get("engine") != "remotion":
        return CheckResult("remotion_just", False, "Remotion is not default")
    leftovers = _propose_leftovers(spec)
    if leftovers:
        return CheckResult("remotion_just", False, "propose leftovers: " + ",".join(leftovers))
    duration = asset.get("duration")
    if not isinstance(duration, (int, float)):
        return CheckResult("remotion_just", False, "duration missing")
    remotion = spec.get("remotion") if isinstance(spec.get("remotion"), dict) else {}
    declared = remotion.get("duration", spec.get("duration"))
    if _as_number(declared) is None or abs(float(declared) - float(duration)) > DURATION_SLACK:
        return CheckResult("remotion_just", False, "Remotion duration mismatch")
    master = extras.get("remotion_master_duration")
    if master is not None and abs(float(master) - float(duration)) > DURATION_SLACK:
        return CheckResult("remotion_just", False, "Remotion master duration mismatch")
    return CheckResult("remotion_just", True, "Remotion duration matches; no leftovers; Just locked")


def _hls_then_raw(
    asset: Mapping[str, Any],
    spec: Mapping[str, Any] | None,
    extras: Mapping[str, Any],
) -> CheckResult:
    status = str(asset.get("status") or "")
    raw_dropped = bool(extras.get("raw_dropped"))
    raw_drop = bool(spec.get("raw_drop")) if spec else False
    if status == "HLS Ready":
        return CheckResult("hls_then_raw", True, "HLS Ready; raw may drop")
    if raw_dropped or raw_drop:
        return CheckResult("hls_then_raw", False, "raw dropped before HLS Ready")
    return CheckResult("hls_then_raw", True, "raw held until HLS Ready")


def _propose_leftovers(spec: Mapping[str, Any]) -> list[str]:
    leftover: list[str] = []
    for key in ("proposed_chapters", "proposed_cuts"):
        value = spec.get(key)
        if value:
            leftover.append(key)
    remotion = spec.get("remotion")
    if isinstance(remotion, dict):
        for key in ("title_cards", "vo_slots"):
            rows = remotion.get(key) or []
            if any(isinstance(row, dict) and row.get("draft") for row in rows):
                leftover.append(f"remotion.{key}")
    return leftover


def _as_number(value: object) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value)
