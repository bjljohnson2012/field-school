from __future__ import annotations

from typing import Protocol

import httpx

from fieldschool_adapter.domain import Asset, Lesson, clip_text


class NotionError(RuntimeError):
    pass


class NotionClient(Protocol):
    def get(self, page_id: str) -> Asset: ...
    def find_by_cap_id(self, cap_video_id: str) -> Asset | None: ...
    def find_by_title(self, title: str) -> Asset | None: ...
    def list_by_status(self, statuses: list[str]) -> list[Asset]: ...
    def create(self, asset: Asset) -> Asset: ...
    def update(self, asset: Asset) -> Asset: ...
    def append_transcript_body(self, page_id: str, transcript: str) -> None: ...


class LessonsClient(Protocol):
    def find_by_title_and_order(self, title: str, order: int) -> Lesson | None: ...
    def create_lesson(self, lesson: Lesson) -> Lesson: ...


class NotionHttp:
    def __init__(
        self,
        *,
        token: str,
        database_id: str,
        client: httpx.Client,
        lessons_db_id: str | None = None,
    ) -> None:
        self._database_id = _compact_id(database_id)
        self._lessons_db_id = _compact_id(lessons_db_id) if lessons_db_id else None
        self._client = client
        self._headers = {
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        }

    def get(self, page_id: str) -> Asset:
        data = self._request("GET", f"/v1/pages/{_compact_id(page_id)}")
        return parse_notion_page(data)

    def find_by_cap_id(self, cap_video_id: str) -> Asset | None:
        return self._first(
            {
                "property": "Processing log",
                "rich_text": {"contains": f"cap_video_id={cap_video_id}"},
            }
        )

    def find_by_title(self, title: str) -> Asset | None:
        return self._first({"property": "Title", "title": {"equals": title}})

    def list_by_status(self, statuses: list[str]) -> list[Asset]:
        if len(statuses) == 1:
            filt: dict = {"property": "Status", "select": {"equals": statuses[0]}}
        else:
            filt = {
                "or": [
                    {"property": "Status", "select": {"equals": status}}
                    for status in statuses
                ]
            }
        return self._query(filt)

    def create(self, asset: Asset) -> Asset:
        payload = {
            "parent": {"database_id": self._database_id},
            "properties": asset_properties(asset),
        }
        data = self._request("POST", "/v1/pages", payload)
        return parse_notion_page(data)

    def update(self, asset: Asset) -> Asset:
        if not asset.page_id:
            raise NotionError("update requires page_id")
        data = self._request(
            "PATCH",
            f"/v1/pages/{asset.page_id}",
            {"properties": asset_properties(asset)},
        )
        return parse_notion_page(data)

    def append_transcript_body(self, page_id: str, transcript: str) -> None:
        children = []
        remaining = transcript
        while remaining:
            chunk, remaining = remaining[:1900], remaining[1900:]
            children.append(
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": chunk}}]
                    },
                }
            )
        compact = _compact_id(page_id)
        self._request("PATCH", f"/v1/blocks/{compact}/children", {"children": children})

    def find_by_title_and_order(self, title: str, order: int) -> Lesson | None:
        if not self._lessons_db_id:
            raise NotionError("NOTION_LESSONS_DB_ID is required")
        pages = self._query(
            {
                "and": [
                    {"property": "Title", "title": {"equals": title}},
                    {"property": "Order", "number": {"equals": order}},
                ]
            },
            database_id=self._lessons_db_id,
            parser=parse_notion_lesson,
        )
        return pages[0] if pages else None

    def create_lesson(self, lesson: Lesson) -> Lesson:
        if not self._lessons_db_id:
            raise NotionError("NOTION_LESSONS_DB_ID is required")
        data = self._request(
            "POST",
            "/v1/pages",
            {
                "parent": {"database_id": self._lessons_db_id},
                "properties": lesson_properties(lesson),
            },
        )
        return parse_notion_lesson(data)

    def _first(self, filt: dict) -> Asset | None:
        pages = self._query(filt)
        return pages[0] if pages else None

    def _query(self, filt: dict, database_id: str | None = None, parser=None):
        pages = []
        cursor = None
        db = database_id or self._database_id
        parse = parser or parse_notion_page
        while True:
            body: dict = {"filter": filt, "page_size": 100}
            if cursor:
                body["start_cursor"] = cursor
            data = self._request(
                "POST",
                f"/v1/databases/{db}/query",
                body,
            )
            if not isinstance(data, dict):
                raise NotionError("Notion query returned a non-object")
            for item in data.get("results") or []:
                pages.append(parse(item))
            if not data.get("has_more"):
                return pages
            cursor = data.get("next_cursor")

    def _request(self, method: str, path: str, payload: dict | None = None) -> object:
        kwargs: dict = {
            "headers": self._headers,
        }
        if payload is not None:
            kwargs["json"] = payload
        response = self._client.request(
            method,
            f"https://api.notion.com{path}",
            **kwargs,
        )
        if response.status_code >= 400:
            raise NotionError(f"{method} {path} failed: {response.status_code} {response.text}")
        try:
            return response.json()
        except ValueError as exc:
            raise NotionError(f"{method} {path} returned non-JSON") from exc


def asset_properties(asset: Asset) -> dict:
    props: dict = {
        "Title": {"title": [{"type": "text", "text": {"content": asset.title[:2000]}}]},
        "Status": {"select": {"name": asset.status}},
        "Processing log": _rich_text(asset.processing_log),
        "Duration": {"number": asset.duration},
        "Raw Cap file": {"url": asset.raw_cap_file},
        "Transcript": _rich_text(asset.transcript or ""),
        "Transcript timestamps": {"url": asset.transcript_timestamps},
        "AI summary": _rich_text(clip_text(asset.ai_summary) or ""),
        "Chapters": _rich_text(clip_text(asset.chapters) or ""),
        "Last error": _rich_text(clip_text(asset.last_error) or ""),
        "Master cleaned file": {"url": asset.master_cleaned_file},
        "HLS Lesson Clip URLs": _rich_text(clip_text(asset.hls_lesson_clip_urls) or ""),
        "HLS Master Playlist URL": {"url": asset.hls_master_playlist_url},
        "Shorts list": _rich_text(clip_text(asset.shorts_list) or ""),
    }
    if asset.course_ids:
        props["Course"] = {"relation": [{"id": _dashed_id(item)} for item in asset.course_ids]}
    if asset.lesson_ids:
        props["Lesson"] = {"relation": [{"id": _dashed_id(item)} for item in asset.lesson_ids]}
    return props


def parse_notion_page(raw: object) -> Asset:
    if not isinstance(raw, dict):
        raise NotionError("Notion page is not an object")
    page_id = raw.get("id")
    if not isinstance(page_id, str):
        raise NotionError("Notion page missing id")
    props = raw.get("properties") or {}
    if not isinstance(props, dict):
        raise NotionError("Notion page missing properties")
    status = _select(props.get("Status")) or "Ingested"
    return Asset(
        page_id=page_id,
        title=_title(props.get("Title")) or "Untitled",
        status=status,  # type: ignore[arg-type]
        processing_log=_rich(props.get("Processing log")),
        raw_cap_file=_url(props.get("Raw Cap file")),
        duration=_number(props.get("Duration")),
        transcript=_rich(props.get("Transcript")) or None,
        transcript_timestamps=_url(props.get("Transcript timestamps")),
        ai_summary=_rich(props.get("AI summary")) or None,
        chapters=_rich(props.get("Chapters")) or None,
        last_error=_rich(props.get("Last error")) or None,
        master_cleaned_file=_url(props.get("Master cleaned file")),
        hls_lesson_clip_urls=_rich(props.get("HLS Lesson Clip URLs")) or None,
        hls_master_playlist_url=_url(props.get("HLS Master Playlist URL")),
        shorts_list=_rich(props.get("Shorts list")) or None,
        course_ids=_relations(props.get("Course")),
        lesson_ids=_relations(props.get("Lesson")),
    )


def lesson_properties(lesson: Lesson) -> dict:
    props: dict = {
        "Title": {"title": [{"type": "text", "text": {"content": lesson.title[:2000]}}]},
        "Summary": _rich_text(lesson.summary),
        "Order": {"number": lesson.order},
        "Status": {"select": {"name": lesson.status}},
    }
    if lesson.course_ids:
        props["Course"] = {"relation": [{"id": _dashed_id(item)} for item in lesson.course_ids]}
    return props


def parse_notion_lesson(raw: object) -> Lesson:
    if not isinstance(raw, dict):
        raise NotionError("Notion lesson is not an object")
    page_id = raw.get("id")
    if not isinstance(page_id, str):
        raise NotionError("Notion lesson missing id")
    props = raw.get("properties") or {}
    if not isinstance(props, dict):
        raise NotionError("Notion lesson missing properties")
    return Lesson(
        page_id=page_id,
        title=_title(props.get("Title")) or "Untitled",
        summary=_rich(props.get("Summary")),
        order=int(_number(props.get("Order")) or 0),
        status=_select(props.get("Status")) or "Draft",
        course_ids=_relations(props.get("Course")),
    )


def _rich_text(value: str) -> dict:
    text = value or ""
    chunks = [text[i:i + 2000] for i in range(0, len(text), 2000)] or [""]
    return {"rich_text": [{"type": "text", "text": {"content": chunk}} for chunk in chunks[:20]]}


def _title(prop: object) -> str:
    if not isinstance(prop, dict):
        return ""
    return "".join(item.get("plain_text", "") for item in prop.get("title") or [])


def _rich(prop: object) -> str:
    if not isinstance(prop, dict):
        return ""
    return "".join(item.get("plain_text", "") for item in prop.get("rich_text") or [])


def _select(prop: object) -> str | None:
    if not isinstance(prop, dict):
        return None
    select = prop.get("select")
    if isinstance(select, dict) and isinstance(select.get("name"), str):
        return select["name"]
    return None


def _url(prop: object) -> str | None:
    if not isinstance(prop, dict):
        return None
    url = prop.get("url")
    return url if isinstance(url, str) else None


def _number(prop: object) -> float | None:
    if not isinstance(prop, dict):
        return None
    value = prop.get("number")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    return None


def _relations(prop: object) -> list[str]:
    if not isinstance(prop, dict):
        return []
    out: list[str] = []
    for item in prop.get("relation") or []:
        if isinstance(item, dict) and isinstance(item.get("id"), str):
            out.append(item["id"])
    return out


def _compact_id(value: str) -> str:
    return value.replace("-", "")


def _dashed_id(value: str) -> str:
    compact = _compact_id(value)
    if len(compact) != 32:
        return value
    return f"{compact[:8]}-{compact[8:12]}-{compact[12:16]}-{compact[16:20]}-{compact[20:]}"
