import json
import unittest

from factory.fieldschool_adapter.edit_spec import (
    CREAM,
    FONT,
    INK,
    JUST_CAP_ID,
    LOGO_LOCK,
    write_edit_spec,
)
from factory.fieldschool_adapter.quality_gate import CHECKLIST, evaluate
from factory.fieldschool_adapter.status_machine import (
    apply_gate,
    gated_start_cleaning,
    video_write_spec_at_review,
)

CHAPTERS = json.dumps(
    [
        {"start": 0, "end": 90, "title": "Open"},
        {"start": 90, "end": 652, "title": "Teach"},
    ]
)


def passing_asset(**overrides):
    values = {
        "title": "You Can Just Do Things",
        "status": "Review",
        "cap_id": "j013r823wx9ecaf",
        "raw_cap_file": "https://cap.fieldschool.ai/dev/j013r823wx9ecaf",
        "duration": 652.0,
        "transcript": "You can just do things.",
        "ai_summary": "Break the authored-process habit.",
        "chapters": CHAPTERS,
        "processing_log": "cap_video_id=j013r823wx9ecaf",
        "page_id": "3c9fe86f6dee81299337e318cfef6982",
    }
    values.update(overrides)
    return values


def passing_spec(asset=None):
    row = asset or passing_asset()
    return write_edit_spec(
        title=row["title"],
        duration=row["duration"],
        chapters_raw=row["chapters"],
        cap_id=row["cap_id"],
        asset_id=row.get("page_id"),
    )


class WriteSpecTests(unittest.TestCase):
    def test_video_writes_spec_and_stays_review(self):
        written = video_write_spec_at_review(passing_asset())
        self.assertEqual(written.action, "edit_spec_written")
        self.assertEqual(written.status, "Review")
        self.assertEqual(written.spec["engine"], "remotion")
        self.assertEqual(written.spec["fallback"], "melt")
        self.assertFalse(written.spec["raw_drop"])
        self.assertNotIn("proposed_chapters", written.spec)
        self.assertNotIn("proposed_cuts", written.spec)
        self.assertEqual(written.spec["overlay"]["logo"], LOGO_LOCK)
        self.assertEqual(written.spec["overlay"]["x"], 1576)
        self.assertEqual(written.spec["cards"]["paper"], CREAM)
        self.assertEqual(written.spec["cards"]["ink"], INK)
        self.assertEqual(written.spec["cards"]["font"], FONT)
        self.assertEqual(written.spec["head"]["dock"], "right")
        self.assertLessEqual(written.spec["head"]["width_frac"], 0.38)

    def test_video_refuses_just_spec(self):
        written = video_write_spec_at_review(
            passing_asset(
                cap_id=JUST_CAP_ID,
                title="Just",
                processing_log=f"cap_video_id={JUST_CAP_ID}",
                raw_cap_file=f"https://cap.fieldschool.ai/dev/{JUST_CAP_ID}",
            )
        )
        self.assertEqual(written.action, "skip_just")
        self.assertIsNone(written.spec)
        self.assertIn("Just", written.last_error or "")


class ChecklistTests(unittest.TestCase):
    def test_pass_all_six_allows_cleaning(self):
        asset = passing_asset()
        spec = passing_spec(asset)
        verdict = evaluate(asset, spec)
        self.assertEqual([item.item for item in verdict.checks], list(CHECKLIST))
        self.assertTrue(all(item.ok for item in verdict.checks))
        self.assertTrue(verdict.passed)
        result = apply_gate(asset, spec)
        self.assertEqual(result.status, "Cleaning")
        self.assertEqual(result.action, "cleaning")
        self.assertFalse(result.verdict.escalate)
        self.assertEqual(result.log_event, "Cleaning (quality gate pass)")

    def test_missing_copy_holds(self):
        asset = passing_asset(transcript="", ai_summary="")
        result = apply_gate(asset, passing_spec())
        self.assertEqual(result.status, "Review")
        self.assertTrue(result.verdict.escalate)
        self.assertTrue(any(item.startswith("cap_take_copy:") for item in result.verdict.failures))

    def test_chapters_gap_holds(self):
        asset = passing_asset(chapters=json.dumps([{"start": 0, "end": 12, "title": "Open only"}]))
        spec = passing_spec(asset)
        result = apply_gate(asset, spec)
        self.assertEqual(result.action, "hold")
        self.assertEqual(result.status, "Review")
        self.assertTrue(any("chapters_cover" in item for item in result.verdict.failures))
        self.assertIn("Chief Decision Maker", result.log_event)

    def test_overlay_off_lock_holds(self):
        spec = passing_spec()
        spec["overlay"]["x"] = 16
        result = apply_gate(passing_asset(), spec)
        self.assertEqual(result.status, "Review")
        self.assertTrue(any("overlay_lock" in item for item in result.verdict.failures))

    def test_generic_card_or_full_bleed_head_holds(self):
        spec = passing_spec()
        spec["cards"]["paper"] = "#FFFFFF"
        spec["head"]["full_frame"] = True
        result = apply_gate(passing_asset(), spec)
        self.assertTrue(any("cards_head" in item for item in result.verdict.failures))
        self.assertEqual(result.status, "Review")

    def test_propose_leftovers_or_duration_mismatch_holds(self):
        spec = passing_spec()
        spec["proposed_chapters"] = [{"title": "draft", "start": 0}]
        spec["remotion"]["duration"] = 12
        result = apply_gate(passing_asset(), spec)
        self.assertTrue(any("remotion_just" in item for item in result.verdict.failures))
        self.assertEqual(result.status, "Review")

    def test_raw_drop_before_hls_holds(self):
        spec = passing_spec()
        spec["raw_drop"] = True
        result = apply_gate(passing_asset(), spec, extras={"raw_dropped": True})
        self.assertTrue(any("hls_then_raw" in item for item in result.verdict.failures))
        self.assertEqual(result.status, "Review")

    def test_hls_ready_may_drop_raw(self):
        asset = passing_asset(status="HLS Ready")
        spec = passing_spec(asset)
        spec["raw_drop"] = True
        verdict = evaluate(asset, spec, extras={"raw_dropped": True})
        hls = next(item for item in verdict.checks if item.item == "hls_then_raw")
        self.assertTrue(hls.ok)

    def test_just_never_cleans(self):
        asset = passing_asset(
            title="Just",
            cap_id=JUST_CAP_ID,
            processing_log=f"cap_video_id={JUST_CAP_ID}",
            raw_cap_file=f"https://cap.fieldschool.ai/dev/{JUST_CAP_ID}",
        )
        result = apply_gate(asset, passing_spec(passing_asset()))
        self.assertEqual(result.action, "skip_just")
        self.assertNotEqual(result.status, "Cleaning")
        self.assertTrue(result.verdict.escalate)

    def test_publish_and_distribute_stay_held(self):
        for status in ("Published", "Distributed"):
            result = apply_gate(passing_asset(status=status), passing_spec())
            self.assertEqual(result.status, status)
            self.assertEqual(result.action, "held_publish")
            self.assertNotEqual(result.status, "Cleaning")


class TriggerHookTests(unittest.TestCase):
    def test_kick_review_requires_pass(self):
        asset = passing_asset()
        spec = passing_spec(asset)
        result = gated_start_cleaning(asset, spec)
        self.assertEqual(result.action, "cleaning")
        self.assertEqual(asset["status"], "Cleaning")

    def test_kick_review_does_not_soft_ship_on_fail(self):
        asset = passing_asset(chapters=json.dumps([{"start": 30, "end": 40, "title": "Hole"}]))
        spec = passing_spec(passing_asset())
        result = gated_start_cleaning(asset, spec)
        self.assertEqual(result.action, "hold")
        self.assertEqual(asset["status"], "Review")
        self.assertIn("escalate", result.log_event)

    def test_kick_skips_non_review(self):
        asset = passing_asset(status="Editing")
        result = gated_start_cleaning(asset, passing_spec())
        self.assertEqual(result.action, "skip_status")
        self.assertEqual(asset["status"], "Editing")


if __name__ == "__main__":
    unittest.main()
