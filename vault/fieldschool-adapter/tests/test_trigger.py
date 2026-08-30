import json
from datetime import datetime, timezone

from fieldschool_adapter.domain import JUST_CAP_ID, Asset
from fieldschool_adapter.fakes import FakeMedia, FakeNotion
from fieldschool_adapter.processor import kick_asset
from fieldschool_adapter.trigger import extract_ids

from test_processor import CHAPTERS, NOW, TRANSCRIPT, cleaning_asset, config


def test_extract_ids_plain_and_notion_shapes() -> None:
    assert extract_ids({"asset_id": "3c9fe86f6dee81299337e318cfef6982"}) == (
        "3c9fe86f6dee81299337e318cfef6982",
        None,
    )
    assert extract_ids({"data": {"page_id": "3c9fe86f6dee81299337e318cfef6982", "cap_id": "j013r823wx9ecaf"}}) == (
        "3c9fe86f6dee81299337e318cfef6982",
        "j013r823wx9ecaf",
    )
    assert extract_ids({"page": {"id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}})[0] == (
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    )


def test_kick_review_flips_and_runs(tmp_path) -> None:
    notion = FakeNotion()
    page = notion.create(
        cleaning_asset(
            status="Review",
            processing_log="cap_video_id=kickvid1",
        )
    )
    results = kick_asset(
        notion,
        notion,
        FakeMedia(),
        config(tmp_path),
        asset_id=page.page_id,
        now=NOW,
    )
    assert results[0].action == "processed"
    stored = notion.get(page.page_id or "")
    assert stored.status == "HLS Ready"
    assert "Cleaning (trigger)" in stored.processing_log
    assert stored.hls_master_playlist_url


def test_kick_refuses_just(tmp_path) -> None:
    notion = FakeNotion()
    page = notion.create(
        Asset(
            title="Just",
            status="Review",
            processing_log=f"cap_video_id={JUST_CAP_ID}",
            chapters=CHAPTERS,
            duration=21,
            transcript=TRANSCRIPT,
        )
    )
    results = kick_asset(
        notion,
        notion,
        FakeMedia(),
        config(tmp_path),
        asset_id=page.page_id,
        now=datetime(2026, 8, 28, tzinfo=timezone.utc),
    )
    assert results[0].action == "skip_just"
    assert notion.get(page.page_id or "").status == "Review"


def test_kick_prepare_flips_review_without_encode(tmp_path) -> None:
    notion = FakeNotion()
    page = notion.create(
        cleaning_asset(
            status="Review",
            processing_log="cap_video_id=prepvid1",
        )
    )
    results = kick_asset(
        notion,
        notion,
        FakeMedia(),
        config(tmp_path),
        asset_id=page.page_id,
        run=False,
        now=NOW,
    )
    assert results[0].action == "accepted"
    stored = notion.get(page.page_id or "")
    assert stored.status == "Cleaning"
    assert "Cleaning (trigger)" in stored.processing_log
    assert not stored.hls_master_playlist_url


def test_kick_skips_hls_ready(tmp_path) -> None:
    notion = FakeNotion()
    page = notion.create(
        cleaning_asset(
            status="HLS Ready",
            processing_log="cap_video_id=donevid",
            hls_master_playlist_url="https://cap.fieldschool.ai/hls/donevid/master.m3u8",
        )
    )
    results = kick_asset(
        notion,
        notion,
        FakeMedia(),
        config(tmp_path),
        asset_id=page.page_id,
    )
    assert results[0].action == "skip_status"
    assert results[0].status == "HLS Ready"
