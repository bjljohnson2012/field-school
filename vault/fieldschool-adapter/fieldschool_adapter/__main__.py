from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import httpx

from fieldschool_adapter.cap import CapHttp
from fieldschool_adapter.config import Config, load_config, load_dotenv
from fieldschool_adapter.domain import DEFAULT_COURSE_ID, Asset
from fieldschool_adapter.fakes import (
    FakeCap,
    FakeGrok,
    FakeMedia,
    FakeNotion,
    FakeStt,
    sample_cap_status,
    sample_cap_video,
)
from fieldschool_adapter.grok import GrokHttp
from fieldschool_adapter.media import FfmpegMedia
from fieldschool_adapter.notion import NotionHttp
from fieldschool_adapter.pipeline import StepResult, poll_cap, process_assets
from fieldschool_adapter.processor import kick_asset, process_cleaning_assets
from fieldschool_adapter.stt import SttHttp


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="fieldschool-adapter",
        description="Poll Cap to Notion Review, or walk Cleaning through HLS Ready.",
    )
    parser.add_argument("command", choices=("poll", "process", "run", "processor", "dry-run", "serve"))
    parser.add_argument(
        "--once",
        action="store_true",
        help="For run, one poll+process cycle. For processor, one Cleaning walk.",
    )
    parser.add_argument("--asset", default="", help="Notion Asset page id. Processor runs this row now.")
    parser.add_argument("--cap", default="", help="Cap video id. Processor finds the Asset and runs it now.")
    parser.add_argument("--env-file", default=".env")
    args = parser.parse_args(argv)

    if args.command == "dry-run":
        return _dry_run()

    load_dotenv(Path(args.env_file))
    config = load_config()
    with httpx.Client(timeout=httpx.Timeout(30.0, read=600.0)) as client:
        cap = CapHttp(base_url=config.cap_api_base, secret=config.cap_api_secret, client=client)
        notion = NotionHttp(
            token=config.notion_token,
            database_id=config.notion_assets_db_id,
            client=client,
            lessons_db_id=config.notion_lessons_db_id,
        )
        stt = SttHttp(url=config.grok_stt_url, api_key=config.xai_api_key, client=client)
        grok = GrokHttp(api_key=config.xai_api_key, client=client)
        if args.command == "poll":
            _print(poll_cap(cap, notion, config))
            return 0
        if args.command == "process":
            _print(process_assets(cap, notion, stt, grok, config))
            return 0
        if args.command == "serve":
            from fieldschool_adapter.trigger import serve_trigger

            return serve_trigger(config)
        if args.command == "processor":
            media = FfmpegMedia()
            if args.asset or args.cap:
                _print(
                    kick_asset(
                        notion,
                        notion,
                        media,
                        config,
                        asset_id=args.asset or None,
                        cap_id=args.cap or None,
                    )
                )
                return 0
            while True:
                _print(process_cleaning_assets(notion, notion, media, config))
                if args.once:
                    return 0
                time.sleep(config.poll_interval_seconds)
        while True:
            _print(poll_cap(cap, notion, config))
            _print(process_assets(cap, notion, stt, grok, config))
            if args.once:
                return 0
            time.sleep(config.poll_interval_seconds)


def _dry_run() -> int:
    config = Config(
        notion_token="dry",
        notion_assets_db_id="401926803acc4a2ab815ffb074cd8940",
        cap_api_base="https://cap.example.test/api/developer/v1",
        cap_api_secret="csk_dry",
        xai_api_key="dry",
        grok_stt_url="https://api.x.ai/v1/stt",
        course_id="3c8fe86f6dee81928bfbcebea8617c82",
        lesson_id=None,
        cap_public_base="https://cap.example.test",
        cap_file_url_template="https://s3.example.test/{s3_key}",
        artifacts_dir=Path("./artifacts"),
        artifacts_public_base="https://artifacts.example.test",
        poll_interval_seconds=15,
        notion_lessons_db_id="906a0b2d6561497a9404e269e3a5fd8c",
        hls_root=Path("./artifacts/hls"),
        hls_public_base="https://cap.fieldschool.ai/hls",
    )
    video = sample_cap_video()
    cap = FakeCap(
        videos=[video],
        statuses={video.id: sample_cap_status()},
        files={"https://s3.example.test/developer/app_789/abc123def456/result.mp4": b"fake-mp4"},
    )
    notion = FakeNotion()
    stt = FakeStt()
    grok = FakeGrok()
    print("dry-run poll")
    _print(poll_cap(cap, notion, config))
    print("dry-run process")
    _print(process_assets(cap, notion, stt, grok, config))
    page = next(iter(notion.pages.values()))
    print(
        json.dumps(
            {
                "title": page.title,
                "status": page.status,
                "duration": page.duration,
                "raw_cap_file": page.raw_cap_file,
                "transcript": page.transcript,
                "ai_summary": page.ai_summary,
                "chapters": page.chapters,
                "transcript_timestamps": page.transcript_timestamps,
                "processing_log": page.processing_log,
                "course_ids": page.course_ids,
            },
            indent=2,
        )
    )
    notion.create(
        Asset(
            title="Cleaning dry-run",
            status="Cleaning",
            processing_log="cap_video_id=cleanvid",
            duration=21,
            transcript="hello field school this is a longer transcript that must not become the lesson summary",
            chapters=(
                '[{"start":0,"end":8,"title":"Hello","beat":"Open with a hello."},'
                '{"start":8,"end":21,"title":"Field School","beat":"Name the adapter."}]'
            ),
            course_ids=[DEFAULT_COURSE_ID],
        )
    )
    print("dry-run processor")
    _print(process_cleaning_assets(notion, notion, FakeMedia(), config))
    cleaned = next(page for page in notion.pages.values() if page.status == "HLS Ready")
    print(
        json.dumps(
            {
                "title": cleaned.title,
                "status": cleaned.status,
                "master_cleaned_file": cleaned.master_cleaned_file,
                "hls_lesson_clip_urls": cleaned.hls_lesson_clip_urls,
                "hls_master_playlist_url": cleaned.hls_master_playlist_url,
                "shorts_list": cleaned.shorts_list,
                "lesson_ids": cleaned.lesson_ids,
                "lessons": [
                    {
                        "title": lesson.title,
                        "summary": lesson.summary,
                        "order": lesson.order,
                        "status": lesson.status,
                        "course_ids": lesson.course_ids,
                    }
                    for lesson in notion.lessons.values()
                ],
            },
            indent=2,
        )
    )
    return 0


def _print(results: list[StepResult]) -> None:
    if not results:
        print("no work")
        return
    for item in results:
        extra = f" {item.detail}" if item.detail else ""
        print(f"{item.action} cap={item.cap_video_id} page={item.page_id} status={item.status}{extra}")


if __name__ == "__main__":
    sys.exit(main())
