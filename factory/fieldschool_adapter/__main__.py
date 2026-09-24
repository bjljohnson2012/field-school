"""Proof CLI. Does not call Notion or melt. Does not touch Just."""

from __future__ import annotations

import argparse
import json
import sys

from factory.fieldschool_adapter.edit_spec import JUST_CAP_ID, write_edit_spec
from factory.fieldschool_adapter.status_machine import apply_gate, video_write_spec_at_review

PASS_ASSET = {
    "title": "You Can Just Do Things",
    "status": "Review",
    "cap_id": "j013r823wx9ecaf",
    "raw_cap_file": "https://cap.fieldschool.ai/dev/j013r823wx9ecaf",
    "duration": 652.0,
    "transcript": "You can just do things. Waiting is a habit, not a law.",
    "ai_summary": "Teach the authored-process trap and the move that breaks it.",
    "chapters": json.dumps(
        [
            {"start": 0, "end": 90, "title": "Open"},
            {"start": 90, "end": 652, "title": "Teach"},
        ]
    ),
    "processing_log": "cap_video_id=j013r823wx9ecaf",
}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Field School auto quality gate")
    parser.add_argument(
        "--fixture",
        choices=("pass", "fail-chapters", "just", "publish"),
        default="pass",
    )
    args = parser.parse_args(argv)
    asset = dict(PASS_ASSET)
    if args.fixture == "fail-chapters":
        asset["chapters"] = json.dumps([{"start": 0, "end": 12, "title": "Open only"}])
    elif args.fixture == "just":
        asset["cap_id"] = JUST_CAP_ID
        asset["title"] = "Just"
        asset["raw_cap_file"] = f"https://cap.fieldschool.ai/dev/{JUST_CAP_ID}"
        asset["processing_log"] = f"cap_video_id={JUST_CAP_ID}"
    elif args.fixture == "publish":
        asset["status"] = "Published"

    if args.fixture == "just":
        written = video_write_spec_at_review(asset)
        payload = {
            "video": {"action": written.action, "status": written.status, "error": written.last_error},
            "gate": None,
        }
        print(json.dumps(payload, indent=2))
        return 2

    if args.fixture == "publish":
        result = apply_gate(asset, None)
        print(json.dumps({"action": result.action, "status": result.status, "log": result.log_event}, indent=2))
        return 3

    written = video_write_spec_at_review(asset)
    spec = written.spec
    if spec is None:
        spec = write_edit_spec(
            title=asset["title"],
            duration=asset["duration"],
            chapters_raw=asset["chapters"],
            cap_id=asset["cap_id"],
        )
    result = apply_gate(asset, spec)
    print(
        json.dumps(
            {
                "video_action": written.action,
                "video_status": written.status,
                "gate_action": result.action,
                "status": result.status,
                "escalate": bool(result.verdict.escalate) if result.verdict else False,
                "log": result.log_event,
                "failures": list(result.verdict.failures) if result.verdict else [],
            },
            indent=2,
        )
    )
    return 0 if result.action == "cleaning" else 1


if __name__ == "__main__":
    sys.exit(main())
