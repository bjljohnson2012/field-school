from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from fieldschool_adapter.config import Config
from fieldschool_adapter.domain import (
    DEFAULT_COURSE_ID,
    JUST_CAP_ID,
    PROCESSOR_PICKABLE,
    Asset,
    Chapter,
    Lesson,
    append_log,
    cap_playlist_url,
    chapter_beat,
    clip_text,
    hls_public_url,
    parse_chapters,
    shorts_list_text,
)
from fieldschool_adapter.media import MediaClient
from fieldschool_adapter.notion import LessonsClient, NotionClient
from fieldschool_adapter.pipeline import StepResult


def kick_asset(
    notion: NotionClient,
    lessons: LessonsClient,
    media: MediaClient,
    config: Config,
    *,
    asset_id: str | None = None,
    cap_id: str | None = None,
    start: bool = True,
    run: bool = True,
    now: datetime | None = None,
) -> list[StepResult]:
    """Run one asset now. Notion is the trigger and the later record, not the queue."""
    stamp = now or datetime.now(timezone.utc)
    asset: Asset | None = None
    if asset_id:
        try:
            asset = notion.get(asset_id)
        except Exception:
            asset = None
    if asset is None and cap_id:
        asset = notion.find_by_cap_id(cap_id)
    if asset is None:
        return [StepResult("skip_not_found", cap_id or "", asset_id or "", "")]
    found_cap = asset.cap_video_id() or cap_id or ""
    if found_cap == JUST_CAP_ID:
        return [StepResult("skip_just", JUST_CAP_ID, asset.page_id or "", asset.status)]
    if start and asset.status == "Review":
        asset.status = "Cleaning"
        asset.processing_log = append_log(
            asset.processing_log,
            "Cleaning (trigger)",
            cap_video_id=found_cap,
            s3_key=asset.cap_s3_key(),
            now=stamp,
        )
        asset = notion.update(asset)
    if asset.status not in PROCESSOR_PICKABLE:
        return [StepResult("skip_status", found_cap, asset.page_id or "", asset.status)]
    if not run:
        return [StepResult("accepted", found_cap, asset.page_id or "", asset.status)]
    return [process_cleaning_one(asset, notion, lessons, media, config, now=stamp)]


def process_cleaning_assets(
    notion: NotionClient,
    lessons: LessonsClient,
    media: MediaClient,
    config: Config,
    *,
    now: datetime | None = None,
) -> list[StepResult]:
    stamp = now or datetime.now(timezone.utc)
    results: list[StepResult] = []
    for asset in notion.list_by_status(sorted(PROCESSOR_PICKABLE)):
        results.append(process_cleaning_one(asset, notion, lessons, media, config, now=stamp))
    return results


def process_cleaning_one(
    asset: Asset,
    notion: NotionClient,
    lessons: LessonsClient,
    media: MediaClient,
    config: Config,
    *,
    now: datetime,
) -> StepResult:
    cap_id = asset.cap_video_id()
    if not cap_id:
        return StepResult("skip_no_cap_id", "", asset.page_id, asset.status)
    if asset.status not in PROCESSOR_PICKABLE:
        return StepResult("skip_status", cap_id, asset.page_id, asset.status)

    authorized = asset.status in PROCESSOR_PICKABLE
    try:
        if asset.status == "Cleaning" and not parse_chapters(asset.chapters, duration=asset.duration):
            raise ValueError("Chapters JSON is empty")
        if asset.status == "Cleaning" or not asset.master_cleaned_file:
            asset = _tighten(asset, media, config, cap_id)
            asset = _write_urls_only(asset, notion, cap_id, now, "Master cleaned file")
            if authorized and asset.status == "Cleaning":
                asset = _flip(asset, notion, cap_id, now, "Editing", "Editing (tighten done)")

        if asset.status == "Editing" or not asset.hls_lesson_clip_urls:
            asset = _split(asset, lessons, media, config, cap_id)
            asset = _write_urls_only(asset, notion, cap_id, now, "HLS Lesson Clip URLs")
            if authorized and asset.status == "Editing":
                asset = _flip(asset, notion, cap_id, now, "Clipping", "Clipping (lessons clipped)")

        if asset.status == "Clipping" or not asset.hls_master_playlist_url:
            asset = _hls_and_shorts(asset, media, config, cap_id)
            asset = _write_urls_only(asset, notion, cap_id, now, "HLS Master Playlist URL")
            if authorized and asset.status == "Clipping":
                asset = _flip(asset, notion, cap_id, now, "HLS Ready", "HLS Ready (playlist + shorts)")
                _drop_raw_after_hls(config, cap_id)
        return StepResult("processed", cap_id, asset.page_id, asset.status)
    except Exception as exc:
        asset.last_error = clip_text(str(exc))
        asset.processing_log = append_log(
            asset.processing_log,
            f"processor error: {exc}",
            cap_video_id=cap_id,
            s3_key=asset.cap_s3_key(),
            now=now,
        )
        asset = notion.update(asset)
        return StepResult("processor_error", cap_id, asset.page_id, asset.status, str(exc))



def _drop_raw_after_hls(config: Config, cap_id: str) -> None:
    import subprocess

    hls_dir = config.hls_root / cap_id
    if not hls_dir.is_dir():
        return
    if not any(hls_dir.rglob("*.m3u8")):
        return
    for path in (
        Path(f"/tmp/{cap_id}.mp4"),
        Path(f"/tmp/{cap_id}-raw.mp4"),
        Path(f"/tmp/cap-{cap_id}.mp4"),
    ):
        path.unlink(missing_ok=True)
    listing = subprocess.check_output(
        ["docker", "exec", "cap-minio", "mc", "ls", "--recursive", "local/cap/"],
        text=True,
    )
    prefixes: set[str] = set()
    token = f"/{cap_id}/"
    for line in listing.splitlines():
        if token not in line:
            continue
        key = line.split()[-1]
        parts = key.split("/")
        if cap_id not in parts:
            continue
        prefixes.add("/".join(parts[: parts.index(cap_id) + 1]))
    for prefix in prefixes:
        subprocess.run(
            ["docker", "exec", "cap-minio", "mc", "rm", "--recursive", "--force", f"local/cap/{prefix}"],
            check=False,
        )


def adopt_existing_urls(
    asset: Asset,
    notion: NotionClient,
    media: MediaClient,
    config: Config,
    *,
    now: datetime,
) -> Asset:
    cap_id = asset.cap_video_id()
    if not cap_id:
        return asset
    before = asset.status
    root = config.hls_root / cap_id
    master_mp4 = root / "master.mp4"
    master_m3u8 = root / "master.m3u8"
    if media.exists(master_mp4):
        asset.master_cleaned_file = hls_public_url(config.hls_public_base, f"{cap_id}/master.mp4")
    if media.hls_valid(master_m3u8):
        asset.hls_master_playlist_url = hls_public_url(config.hls_public_base, f"{cap_id}/master.m3u8")
    clip_urls = _existing_clip_urls(media, config, cap_id)
    if clip_urls:
        asset.hls_lesson_clip_urls = json.dumps(clip_urls)
    asset.status = before
    return _write_urls_only(asset, notion, cap_id, now, "adopt existing files")


def _tighten(asset: Asset, media: MediaClient, config: Config, cap_id: str) -> Asset:
    dest = config.hls_root / cap_id / "master.mp4"
    if not media.exists(dest):
        source = cap_playlist_url(config.cap_public_base, cap_id)
        media.tighten(source, dest)
    asset.master_cleaned_file = hls_public_url(config.hls_public_base, f"{cap_id}/master.mp4")
    return asset


def _split(
    asset: Asset,
    lessons: LessonsClient,
    media: MediaClient,
    config: Config,
    cap_id: str,
) -> Asset:
    chapters = parse_chapters(asset.chapters, duration=asset.duration)
    if not chapters:
        raise ValueError("Chapters JSON is empty")
    master = config.hls_root / cap_id / "master.mp4"
    if not media.exists(master):
        raise FileNotFoundError(str(master))
    lesson_ids: list[str] = []
    clip_urls: list[str] = []
    for index, chapter in enumerate(chapters, start=1):
        lesson = _reuse_or_create_lesson(lessons, chapter, index)
        if lesson.page_id:
            lesson_ids.append(lesson.page_id)
        clip_dir = config.hls_root / cap_id / "lessons" / str(index)
        clip_mp4 = clip_dir / "clip.mp4"
        if not media.exists(clip_mp4):
            media.clip(master, clip_mp4, chapter.start, chapter.end)
        playlist = clip_dir / "master.m3u8"
        if not media.hls_valid(playlist):
            media.package_hls(clip_mp4, clip_dir)
        clip_urls.append(hls_public_url(config.hls_public_base, f"{cap_id}/lessons/{index}/master.m3u8"))
    asset.lesson_ids = lesson_ids
    asset.hls_lesson_clip_urls = json.dumps(clip_urls)
    return asset


def _hls_and_shorts(asset: Asset, media: MediaClient, config: Config, cap_id: str) -> Asset:
    dest_dir = config.hls_root / cap_id
    master_mp4 = dest_dir / "master.mp4"
    playlist = dest_dir / "master.m3u8"
    if not media.hls_valid(playlist):
        if not media.exists(master_mp4):
            raise FileNotFoundError(str(master_mp4))
        media.package_hls(master_mp4, dest_dir)
    asset.hls_master_playlist_url = hls_public_url(config.hls_public_base, f"{cap_id}/master.m3u8")
    chapters = parse_chapters(asset.chapters, duration=asset.duration)
    if chapters:
        asset.shorts_list = shorts_list_text(chapters)
    return asset


def _reuse_or_create_lesson(
    lessons: LessonsClient,
    chapter: Chapter,
    order: int,
) -> Lesson:
    existing = lessons.find_by_title_and_order(chapter.title, order)
    if existing:
        return existing
    return lessons.create_lesson(
        Lesson(
            title=chapter.title,
            summary=chapter_beat(chapter),
            order=order,
            status="Draft",
            course_ids=[DEFAULT_COURSE_ID],
        )
    )


def _existing_clip_urls(media: MediaClient, config: Config, cap_id: str) -> list[str]:
    urls: list[str] = []
    lessons_root = config.hls_root / cap_id / "lessons"
    if not lessons_root.is_dir():
        return urls
    for child in sorted(lessons_root.iterdir(), key=lambda path: _int_name(path)):
        playlist = child / "master.m3u8"
        if media.hls_valid(playlist):
            urls.append(hls_public_url(config.hls_public_base, f"{cap_id}/lessons/{child.name}/master.m3u8"))
    return urls


def _int_name(path: Path) -> tuple[int, str]:
    try:
        return (int(path.name), path.name)
    except ValueError:
        return (10**9, path.name)


def _write_urls_only(
    asset: Asset,
    notion: NotionClient,
    cap_id: str,
    now: datetime,
    event: str,
) -> Asset:
    status = asset.status
    asset.processing_log = append_log(
        asset.processing_log,
        f"wrote {event}",
        cap_video_id=cap_id,
        s3_key=asset.cap_s3_key(),
        now=now,
    )
    asset.status = status
    return notion.update(asset)


def _flip(
    asset: Asset,
    notion: NotionClient,
    cap_id: str,
    now: datetime,
    status: str,
    event: str,
) -> Asset:
    asset.status = status  # type: ignore[assignment]
    asset.last_error = None
    asset.processing_log = append_log(
        asset.processing_log,
        event,
        cap_video_id=cap_id,
        s3_key=asset.cap_s3_key(),
        now=now,
    )
    return notion.update(asset)
