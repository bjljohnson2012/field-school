"""Video writes the automated Edit spec at Review. Does not flip Status."""

from __future__ import annotations

from typing import Any

JUST_CAP_ID = "27pn9xs0zk8a73g"
JUST_ASSET_ID = "3c8fe86f6dee8199a716ceec774f0e72"
LOGO_LOCK = "/opt/field-school/edit/brand/logo.png"
OVERLAY_LOCK = {"x": 1576, "y": 24, "w": 80, "h": 64}
CREAM = "#EFE7D6"
INK = "#1A1A16"
FONT = "Fraunces"
HEAD_WIDTH_FRAC = 0.38


def is_just(*, cap_id: str | None = None, asset_id: str | None = None, raw: str | None = None, log: str | None = None) -> bool:
    blob = " ".join(part for part in (cap_id, asset_id, raw, log) if part)
    compact = blob.replace("-", "")
    return JUST_CAP_ID in blob or JUST_ASSET_ID.replace("-", "") in compact


def parse_chapters(raw: str | None, *, duration: float | None) -> list[dict[str, Any]]:
    import json

    if not raw or not str(raw).strip():
        return []
    text = str(raw).strip()
    if not text.startswith("["):
        return []
    data = json.loads(text)
    if not isinstance(data, list):
        return []
    chapters: list[dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        start = item.get("start")
        end = item.get("end")
        if not title or not isinstance(start, (int, float)):
            continue
        start_f = float(start)
        end_f = float(end) if isinstance(end, (int, float)) else None
        if start_f == 0 and end_f == 0 and duration is not None:
            end_f = float(duration)
        chapters.append({"title": title, "start": start_f, "end": end_f})
    for index, chapter in enumerate(chapters):
        if chapter["end"] is not None:
            continue
        if index + 1 < len(chapters):
            chapter["end"] = float(chapters[index + 1]["start"])
        elif duration is not None:
            chapter["end"] = float(duration)
        else:
            chapter["end"] = chapter["start"]
    return chapters


def write_edit_spec(
    *,
    title: str,
    duration: float | None,
    chapters_raw: str | None,
    cap_id: str | None,
    asset_id: str | None = None,
    overlay_mode: str = "Logo + title",
) -> dict[str, Any]:
    """Automated Edit spec. Remotion default. Melt is fallback only. No proposed_* leftovers."""
    if is_just(cap_id=cap_id, asset_id=asset_id):
        raise ValueError("refused: Just asset is locked")
    if duration is None or duration <= 0:
        raise ValueError("Edit spec needs duration")
    chapters = parse_chapters(chapters_raw, duration=duration)
    overlay_title = title if overlay_mode == "Logo + title" else ""
    overlay = {
        "logo": LOGO_LOCK,
        "title": overlay_title,
        **OVERLAY_LOCK,
    }
    return {
        "engine": "remotion",
        "fallback": "melt",
        "duration": float(duration),
        "overlay": overlay,
        "cards": {"paper": CREAM, "ink": INK, "font": FONT},
        "head": {"dock": "right", "width_frac": HEAD_WIDTH_FRAC, "full_frame": False},
        "chapters": chapters,
        "cuts": [{"in": 0.0, "out": float(duration)}],
        "remotion": {"duration": float(duration)},
        "raw_drop": False,
    }
