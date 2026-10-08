"""Hook for live pipeline.process_one after Grok lands Review.

Video writes the Edit spec. Status stays Review. The checklist job flips Cleaning.
Copy the call site into /opt/fieldschool-adapter/fieldschool_adapter/pipeline.py
on 2.24.70.248 only. Do not copy to CNC vault 2.24.64.248.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

try:
    from factory.fieldschool_adapter.status_machine import video_write_spec_at_review
except ImportError:  # VPS drop-in next to fieldschool_adapter/
    from fieldschool_adapter.status_machine import video_write_spec_at_review


def after_review_write_spec(asset: Any, *, now: datetime) -> Any:
    row = {
        "title": asset.title,
        "status": asset.status,
        "cap_id": asset.cap_video_id(),
        "raw_cap_file": asset.raw_cap_file,
        "duration": asset.duration,
        "transcript": asset.transcript,
        "ai_summary": asset.ai_summary,
        "chapters": asset.chapters,
        "processing_log": asset.processing_log,
        "page_id": asset.page_id,
    }
    written = video_write_spec_at_review(row)
    if hasattr(asset, "edit_spec"):
        asset.edit_spec = written.spec
    asset.status = written.status
    if written.last_error:
        asset.last_error = written.last_error
    _ = now
    return written
