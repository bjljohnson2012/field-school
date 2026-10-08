"""Notion status machine. Video writes spec. Checklist flips Cleaning on pass only."""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime, timezone
from typing import Any, Mapping, MutableMapping

from .edit_spec import is_just, write_edit_spec
from .quality_gate import GateVerdict, HELD, evaluate

HELD_STATUSES = HELD
NEVER_AUTO = frozenset({"Published", "Distributed"})


@dataclass
class MachineResult:
    status: str
    spec: dict[str, Any] | None
    verdict: GateVerdict | None
    action: str
    log_event: str
    last_error: str | None = None


def video_write_spec_at_review(asset: Mapping[str, Any]) -> MachineResult:
    """Video plane. Writes Edit spec. Stays at Review. Never flips Cleaning."""
    status = str(asset.get("status") or "Review")
    if status in NEVER_AUTO:
        return MachineResult(
            status=status,
            spec=None,
            verdict=None,
            action="held_publish",
            log_event="HOLD Publish/Distribute still held",
        )
    if is_just(
        cap_id=_cap_id(asset),
        asset_id=str(asset.get("asset_id") or asset.get("page_id") or ""),
        raw=str(asset.get("raw_cap_file") or ""),
        log=str(asset.get("processing_log") or ""),
    ):
        return MachineResult(
            status=status,
            spec=None,
            verdict=None,
            action="skip_just",
            log_event="refused: Just asset is locked",
            last_error="refused: Just asset is locked",
        )
    spec = write_edit_spec(
        title=str(asset.get("title") or ""),
        duration=asset.get("duration") if isinstance(asset.get("duration"), (int, float)) else None,
        chapters_raw=asset.get("chapters") if isinstance(asset.get("chapters"), str) else None,
        cap_id=_cap_id(asset),
        asset_id=str(asset.get("asset_id") or asset.get("page_id") or "") or None,
    )
    return MachineResult(
        status="Review",
        spec=spec,
        verdict=None,
        action="edit_spec_written",
        log_event="Review (automated Edit spec written)",
    )


def apply_gate(
    asset: Mapping[str, Any],
    spec: Mapping[str, Any] | None,
    *,
    extras: Mapping[str, Any] | None = None,
) -> MachineResult:
    """Checklist job. Cleaning only on a full pass. Fail → hold + escalate."""
    status = str(asset.get("status") or "Review")
    if status in NEVER_AUTO:
        verdict = evaluate(asset, spec, extras=extras)
        return MachineResult(
            status=status,
            spec=dict(spec) if spec else None,
            verdict=verdict,
            action="held_publish",
            log_event=verdict.log_line(),
        )
    verdict = evaluate(asset, spec, extras=extras)
    if verdict.passed:
        return MachineResult(
            status="Cleaning",
            spec=dict(spec) if spec else None,
            verdict=verdict,
            action="cleaning",
            log_event=verdict.log_line(),
        )
    return MachineResult(
        status=status if status != "Cleaning" else "Review",
        spec=dict(spec) if spec else None,
        verdict=verdict,
        action=verdict.action,
        log_event=verdict.log_line(),
        last_error=verdict.log_line(),
    )


def gated_start_cleaning(
    asset: MutableMapping[str, Any],
    spec: Mapping[str, Any] | None,
    *,
    extras: Mapping[str, Any] | None = None,
    now: datetime | None = None,
) -> MachineResult:
    """Replace the old Review→Cleaning trigger flip."""
    stamp = now or datetime.now(timezone.utc)
    _ = stamp
    if str(asset.get("status") or "") != "Review":
        return MachineResult(
            status=str(asset.get("status") or ""),
            spec=dict(spec) if spec else None,
            verdict=None,
            action="skip_status",
            log_event="skip_status",
        )
    result = apply_gate(asset, spec, extras=extras)
    if result.action == "cleaning":
        asset["status"] = "Cleaning"
    return result


def append_hold_log(log: str, event: str, *, cap_id: str, now: datetime | None = None) -> str:
    stamp = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [line for line in log.splitlines() if line.strip()]
    if not any(line.startswith("cap_video_id=") for line in lines) and cap_id:
        lines.insert(0, f"cap_video_id={cap_id}")
    lines.append(f"{stamp} {event}")
    return "\n".join(lines)


def freeze_held(result: MachineResult) -> MachineResult:
    if result.status in NEVER_AUTO:
        return replace(result, action="held_publish")
    return result


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
    return None
