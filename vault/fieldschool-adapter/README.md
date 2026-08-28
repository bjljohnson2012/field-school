# Field School video adapter

Do not deploy this to `2.24.64.248`. That box is CNC vault, a different product (`/opt/cnc-vault`, `portal.notarealchurch.com`). Field School video belongs on the Field School VPS `2.24.70.248` (`srv1643164`).

Cap is the media plane. This tree is the adapter.

Cap already records, stores, and plays video (cap-web, media-server, MinIO). When a Cap recording is ready, this process creates or updates a Notion Assets / Videos row, optionally transcribes with Grok STT, and writes Status after each step.

Notion is the trigger and the later record. It is not the work queue. POST `/trigger` starts the job now once this service lives on the Field School VPS. The 90s poll stays as backup. See [VIDEO.md](../../VIDEO.md).

## What it writes

Notion database: [Assets / Videos](https://app.notion.com/p/401926803acc4a2ab815ffb074cd8940)

| After | Status | Fields |
| --- | --- | --- |
| Cap `ready=true` | Ingested | Title, Raw Cap file (`{CAP_PUBLIC_BASE}/dev/{id}`), Duration in seconds |
| STT starts | Transcribing | Processing log line |
| STT + Grok title/summary/chapters | Review | Transcript, Title, AI summary, Chapters. Stops. |
| Trigger or Cleaning flip | Cleaning → HLS Ready | Processor walks the row now. Notion gets the log after. |

The poller leaves Review alone. Cleaning through HLS Ready is `fieldschool-processor` (90s) plus `fieldschool-trigger` (now). Just (`27pn9xs0zk8a73g`) is refused. HLS Ready is skipped.

Idempotency uses the Processing log line `cap_video_id=<Cap id>`. If that line is missing, Title must match the Cap name. No extra Notion property is added.

Cap REST returns `s3Key`. It does not return a download URL. Set `CAP_FILE_URL_TEMPLATE` to wherever your self-hosted Cap already exposes the file, usually public MinIO plus that key.

## Run it

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
```

Fill `NOTION_TOKEN`, `CAP_API_BASE`, `CAP_API_SECRET` (`csk_`), `XAI_API_KEY`, and `CAP_FILE_URL_TEMPLATE`.

Optional `COURSE_ID` and `LESSON_ID` set the Asset relations. The Grok Bot mini-course Draft row is `3c8fe86f6dee81928bfbcebea8617c82`. That row is not a parent page.

```bash
fieldschool-adapter dry-run
fieldschool-adapter poll
fieldschool-adapter process
fieldschool-adapter run --once
fieldschool-adapter run
fieldschool-adapter processor --once
fieldschool-adapter processor --asset <notion-page-id>
fieldschool-adapter processor --cap <cap-id>
fieldschool-adapter serve
```

`serve` binds `127.0.0.1:8789`. Caddy on `edit.fieldschool.ai` sends `/trigger` there. Auth is `Authorization: Bearer <EDIT_MCP_TOKEN>` or `X-Edit-Token`. Same token as the edit MCP. No token is 401.

```bash
# Notion automation, or a person. Work starts on the vault. Notion is updated after.
curl -sS -X POST https://edit.fieldschool.ai/trigger \
  -H "Authorization: Bearer $EDIT_MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"asset_id":"3c9fe86f6dee81299337e318cfef6982"}'
```

Review becomes Cleaning, then the processor runs in a background thread and returns 202. HLS Ready returns 200 `skip_status` and does not re-encode. Just returns 200 `skip_just`. A flip to Cleaning in Notion still works. The 90s unit picks it up if nobody POSTed.

`poll` lists `GET /api/developer/v1/videos` and waits on `GET /api/developer/v1/videos/:id/status` until `ready` is true.

`process` walks Ingested and Transcribing rows. STT is `POST https://api.x.ai/v1/stt` with `format=true`, `language=en`, `diarize=true`, and `file` last in the multipart body. Batch price is about $0.10/hr. Max upload is 500MB.

`dry-run` uses in-memory Cap, Notion, and STT fakes. No credentials.

```bash
pytest
```

## Cap you host

Use Docker Compose from [CapSoftware/Cap](https://github.com/CapSoftware/Cap). Point `CAP_API_BASE` at that origin. Desktop MCP (`cap mcp serve`) stays on the recording machine. It is not this adapter.

## Out of scope

Portal publish, YouTube, Instagram, LinkedIn, and anything after Cleaning.
