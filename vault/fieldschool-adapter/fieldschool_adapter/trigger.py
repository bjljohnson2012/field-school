from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from typing import Any
from urllib.parse import urlparse

import httpx

from fieldschool_adapter.config import Config
from fieldschool_adapter.media import FfmpegMedia
from fieldschool_adapter.notion import NotionHttp
from fieldschool_adapter.pipeline import StepResult
from fieldschool_adapter.processor import kick_asset


def extract_ids(payload: Any) -> tuple[str | None, str | None]:
    if not isinstance(payload, dict):
        return None, None
    cap = _first_str(payload, ("cap_id", "cap_video_id"))
    asset = _first_str(payload, ("asset_id", "page_id", "id"))
    if asset and asset in {"page", "database", "automation"}:
        asset = None
    data = payload.get("data")
    if isinstance(data, dict):
        nested_asset, nested_cap = extract_ids(data)
        asset = asset or nested_asset
        cap = cap or nested_cap
    page = payload.get("page")
    if isinstance(page, dict):
        page_id = page.get("id")
        if isinstance(page_id, str) and page_id.strip():
            asset = asset or page_id.strip()
    return asset, cap


def _first_str(payload: dict, keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip() and len(value.strip()) >= 8:
            return value.strip()
    return None


def serve_trigger(config: Config, *, host: str = "127.0.0.1", port: int = 8789) -> int:
    token = (os.environ.get("EDIT_MCP_TOKEN") or os.environ.get("TRIGGER_TOKEN") or "").strip()
    if not token:
        raise SystemExit("EDIT_MCP_TOKEN or TRIGGER_TOKEN is required")
    httpd = ThreadingHTTPServer((host, port), handler_for(config, token))
    print(f"fieldschool-trigger listening {host}:{port}", flush=True)
    httpd.serve_forever()
    return 0


def handler_for(config: Config, token: str):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt: str, *args: object) -> None:
            print("%s - %s" % (self.address_string(), fmt % args), flush=True)

        def do_GET(self) -> None:
            path = urlparse(self.path).path
            if path == "/health":
                self._json(200, {"ok": True, "service": "fieldschool-trigger"})
                return
            self._json(404, {"error": "not found"})

        def do_POST(self) -> None:
            path = urlparse(self.path).path
            if path not in {"/trigger", "/"}:
                self._json(404, {"error": "not found"})
                return
            if not self._authorized():
                self._json(401, {"error": "unauthorized"})
                return
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b"{}"
            try:
                payload = json.loads(raw.decode() or "{}")
            except json.JSONDecodeError:
                self._json(400, {"error": "invalid json"})
                return
            asset_id, cap_id = extract_ids(payload)
            if not asset_id and not cap_id:
                self._json(400, {"error": "asset_id or cap_id required"})
                return
            try:
                prepared = _run(config, asset_id=asset_id, cap_id=cap_id, start=True, run=False)
            except Exception as exc:
                self._json(500, {"error": str(exc)[:400]})
                return
            first = prepared[0] if prepared else None
            if first is None or first.action != "accepted":
                self._json(200, _body(asset_id, cap_id, prepared, accepted=False))
                return
            Thread(
                target=_run_safe,
                kwargs={"config": config, "asset_id": asset_id, "cap_id": cap_id},
                daemon=True,
            ).start()
            self._json(202, _body(asset_id, cap_id, prepared, accepted=True))

        def _authorized(self) -> bool:
            header = self.headers.get("Authorization") or ""
            if header == f"Bearer {token}":
                return True
            return (self.headers.get("X-Edit-Token") or "") == token

        def _json(self, status: int, payload: Any) -> None:
            raw = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

    return Handler


def _body(
    asset_id: str | None,
    cap_id: str | None,
    results: list[StepResult],
    *,
    accepted: bool,
) -> dict[str, Any]:
    return {
        "ok": True,
        "accepted": accepted,
        "asset_id": asset_id,
        "cap_id": cap_id,
        "results": [
            {
                "action": item.action,
                "cap_video_id": item.cap_video_id,
                "page_id": item.page_id,
                "status": item.status,
                "detail": item.detail,
            }
            for item in results
        ],
    }


def _run_safe(config: Config, *, asset_id: str | None, cap_id: str | None) -> None:
    try:
        _run(config, asset_id=asset_id, cap_id=cap_id, start=False, run=True)
    except Exception as exc:
        print(f"trigger work failed: {exc}", flush=True)


def _run(
    config: Config,
    *,
    asset_id: str | None,
    cap_id: str | None,
    start: bool = True,
    run: bool = True,
):
    with httpx.Client(timeout=httpx.Timeout(30.0, read=600.0)) as client:
        notion = NotionHttp(
            token=config.notion_token,
            database_id=config.notion_assets_db_id,
            client=client,
            lessons_db_id=config.notion_lessons_db_id,
        )
        return kick_asset(
            notion,
            notion,
            FfmpegMedia(),
            config,
            asset_id=asset_id,
            cap_id=cap_id,
            start=start,
            run=run,
        )
