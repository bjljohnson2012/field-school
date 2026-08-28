from __future__ import annotations

from pathlib import Path

from fieldschool_adapter.domain import (
    Asset,
    CapStatus,
    CapVideo,
    Lesson,
    SttResult,
    SttWord,
    TranscriptBrief,
    parse_cap_status,
    parse_cap_video,
)


class FakeCap:
    def __init__(
        self,
        videos: list[CapVideo] | None = None,
        catalog: list[CapVideo] | None = None,
        statuses: dict[str, CapStatus] | None = None,
        files: dict[str, bytes] | None = None,
    ) -> None:
        self.videos = list(videos or [])
        self.catalog = list(catalog or [])
        self.statuses = dict(statuses or {})
        self.files = dict(files or {})
        self.downloads: list[str] = []

    def list_videos(self, *, offset: int, limit: int) -> list[CapVideo]:
        return self.videos[offset : offset + limit]

    def get_video(self, video_id: str) -> CapVideo:
        for video in (*self.videos, *self.catalog):
            if video.id == video_id:
                return video
        raise KeyError(video_id)

    def get_status(self, video_id: str) -> CapStatus:
        if video_id in self.statuses:
            return self.statuses[video_id]
        video = self.get_video(video_id)
        return CapStatus(id=video.id, ready=video.duration is not None, duration=video.duration, width=1920)

    def download(self, url: str) -> bytes:
        self.downloads.append(url)
        if url not in self.files:
            raise FileNotFoundError(url)
        return self.files[url]


class FakeNotion:
    def __init__(self) -> None:
        self.pages: dict[str, Asset] = {}
        self.lessons: dict[str, Lesson] = {}
        self.bodies: dict[str, list[str]] = {}
        self._next = 1
        self._lesson_next = 1

    def get(self, page_id: str) -> Asset:
        compact = page_id.replace("-", "")
        for key, page in self.pages.items():
            if key == page_id or key.replace("-", "") == compact:
                return self._copy(page)
        raise KeyError(page_id)

    def find_by_cap_id(self, cap_video_id: str) -> Asset | None:
        for page in self.pages.values():
            if page.cap_video_id() == cap_video_id:
                return self._copy(page)
        return None

    def find_by_title(self, title: str) -> Asset | None:
        for page in self.pages.values():
            if page.title == title:
                return self._copy(page)
        return None

    def list_by_status(self, statuses: list[str]) -> list[Asset]:
        wanted = set(statuses)
        return [self._copy(page) for page in self.pages.values() if page.status in wanted]

    def create(self, asset: Asset) -> Asset:
        page_id = f"page-{self._next}"
        self._next += 1
        stored = self._copy(asset)
        stored.page_id = page_id
        self.pages[page_id] = stored
        return self._copy(stored)

    def update(self, asset: Asset) -> Asset:
        if not asset.page_id or asset.page_id not in self.pages:
            raise KeyError(asset.page_id)
        stored = self._copy(asset)
        self.pages[asset.page_id] = stored
        return self._copy(stored)

    def append_transcript_body(self, page_id: str, transcript: str) -> None:
        self.bodies.setdefault(page_id, []).append(transcript)

    def find_by_title_and_order(self, title: str, order: int) -> Lesson | None:
        for lesson in self.lessons.values():
            if lesson.title == title and lesson.order == order:
                return self._copy_lesson(lesson)
        return None

    def create_lesson(self, lesson: Lesson) -> Lesson:
        page_id = f"lesson-{self._lesson_next}"
        self._lesson_next += 1
        stored = self._copy_lesson(lesson)
        stored.page_id = page_id
        self.lessons[page_id] = stored
        return self._copy_lesson(stored)

    def _copy(self, asset: Asset) -> Asset:
        return Asset(
            title=asset.title,
            status=asset.status,
            processing_log=asset.processing_log,
            page_id=asset.page_id,
            raw_cap_file=asset.raw_cap_file,
            duration=asset.duration,
            transcript=asset.transcript,
            transcript_timestamps=asset.transcript_timestamps,
            ai_summary=asset.ai_summary,
            chapters=asset.chapters,
            last_error=asset.last_error,
            master_cleaned_file=asset.master_cleaned_file,
            hls_lesson_clip_urls=asset.hls_lesson_clip_urls,
            hls_master_playlist_url=asset.hls_master_playlist_url,
            shorts_list=asset.shorts_list,
            course_ids=list(asset.course_ids),
            lesson_ids=list(asset.lesson_ids),
        )

    def _copy_lesson(self, lesson: Lesson) -> Lesson:
        return Lesson(
            title=lesson.title,
            summary=lesson.summary,
            order=lesson.order,
            status=lesson.status,
            page_id=lesson.page_id,
            course_ids=list(lesson.course_ids),
        )


class FakeStt:
    def __init__(self, result: SttResult | None = None, error: Exception | None = None) -> None:
        self.result = result or SttResult(
            text="hello field school",
            language="en",
            duration=2.4,
            words=(
                SttWord(text="hello", start=0.0, end=0.8, speaker=0),
                SttWord(text="field", start=0.8, end=1.4, speaker=0),
                SttWord(text="school", start=1.4, end=2.4, speaker=0),
            ),
        )
        self.error = error
        self.calls: list[tuple[str, int]] = []

    def transcribe(self, file_bytes: bytes, filename: str) -> SttResult:
        self.calls.append((filename, len(file_bytes)))
        if self.error:
            raise self.error
        return self.result


class FakeGrok:
    def __init__(self, brief: TranscriptBrief | None = None, error: Exception | None = None) -> None:
        self.brief = brief or TranscriptBrief(
            title="Field School lesson",
            summary="A short walkthrough of the Field School adapter.",
            chapters='[{"start":0,"end":8,"title":"Hello","beat":"Say hello."},{"start":8,"end":21,"title":"Field School","beat":"Name the adapter."}]',
        )
        self.error = error
        self.calls: list[str] = []

    def enrich(self, transcript: str) -> TranscriptBrief:
        self.calls.append(transcript)
        if self.error:
            raise self.error
        return self.brief


class FakeMedia:
    def __init__(self) -> None:
        self.tightened: list[tuple[str, Path]] = []
        self.clipped: list[tuple[Path, Path, float, float]] = []
        self.packaged: list[tuple[Path, Path]] = []

    def exists(self, path: Path) -> bool:
        return path.is_file()

    def tighten(self, source: str, dest: Path) -> Path:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(b"mp4")
        self.tightened.append((source, dest))
        return dest

    def clip(self, source: Path, dest: Path, start: float, end: float) -> Path:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(b"clip")
        self.clipped.append((source, dest, start, end))
        return dest

    def package_hls(self, source: Path, dest_dir: Path) -> Path:
        dest_dir.mkdir(parents=True, exist_ok=True)
        (dest_dir / "media.m3u8").write_text("#EXTM3U\n")
        master = dest_dir / "master.m3u8"
        master.write_text("#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nmedia.m3u8\n")
        (dest_dir / "seg000.ts").write_bytes(b"ts")
        self.packaged.append((source, dest_dir))
        return master

    def hls_valid(self, master: Path) -> bool:
        return master.is_file() and master.read_text().startswith("#EXTM3U")


def sample_cap_video(raw: dict | None = None) -> CapVideo:
    payload = {
        "id": "abc123def456",
        "name": "Product Demo",
        "duration": 124.5,
        "s3Key": "developer/app_789/abc123def456/result.mp4",
        "deletedAt": None,
    }
    if raw:
        payload.update(raw)
    return parse_cap_video(payload)


def sample_cap_status(raw: dict | None = None) -> CapStatus:
    payload = {
        "id": "abc123def456",
        "duration": 124.5,
        "width": 1920,
        "height": 1080,
        "ready": True,
    }
    if raw:
        payload.update(raw)
    return parse_cap_status(payload)
