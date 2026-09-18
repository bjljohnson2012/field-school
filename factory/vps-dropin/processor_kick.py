"""Hook that replaces the blind Review→Cleaning flip in processor.kick_asset.

Checklist pass → Cleaning. Fail → hold + escalate. Just stays locked.
Publish/Distribute never flip here.

Copy into /opt/fieldschool-adapter/fieldschool_adapter/processor.py
on 2.24.70.248 only. Do not copy to CNC vault 2.24.64.248.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

try:
    from factory.fieldschool_adapter.status_machine import gated_start_cleaning
except ImportError:  # VPS drop-in next to fieldschool_adapter/
    from fieldschool_adapter.status_machine import gated_start_cleaning


def maybe_flip_cleaning(asset: Any, spec: dict | None, *, now: datetime) -> Any:
    row = {
        "title": asset.title,
        "status": asset.status,
        "cap_id": asset.cap_video_id(),
        "raw_cap_file": getattr(asset, "raw_cap_file", None),
        "duration": asset.duration,
        "transcript": asset.transcript,
        "ai_summary": asset.ai_summary,
        "chapters": asset.chapters,
        "processing_log": asset.processing_log,
        "page_id": asset.page_id,
    }
    result = gated_start_cleaning(row, spec, now=now)
    asset.status = result.status
    if result.last_error:
        asset.last_error = result.last_error
    return result
