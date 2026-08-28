# Field School video

This file is the shop map. Notion is the later record and the push. Work runs on the Field School VPS.

There are two Hostinger boxes. Do not mix them.

| Box | Address | Hostname | What it is |
| --- | --- | --- | --- |
| Field School VPS | `2.24.70.248` | `srv1643164` | Site, portal, Cap, edit, trigger, HLS |
| CNC vault | `2.24.64.248` | `cnc-vault-test` / `srv1638459` | Sermon vault product. `/opt/cnc-vault`. `portal.notarealchurch.com`. Not Field School |

Video code and Caddy for Cap, edit, and HLS go on the Field School VPS. They do not go on CNC vault.

## Where the names point today

Proved 2026-08-28 by DNS A records and live HTTP after the move.

| Name | DNS | Lives on | What it is |
| --- | --- | --- | --- |
| `fieldschool.ai` | `2.24.70.248` | Field School VPS | Public static site. `/var/www/fieldschool.ai` |
| `www.fieldschool.ai` | CNAME → `fieldschool.ai` | Field School VPS | Same site |
| `portal.fieldschool.ai` | `2.24.70.248` | Field School VPS | Next.js training portal. Docker `field-school-app` |
| `university.benjohnson.ai` | `2.24.70.248` | Field School VPS | Same portal. AUTH_URL still points here. Do not 301 it |
| `portal.benjohnson.ai` | `2.24.70.248` | Field School VPS | Older ae-coach app |
| `cap.fieldschool.ai` | `2.24.70.248` | Field School VPS | Cap recorder + HLS at `/hls/{id}/` |
| `s3.cap.fieldschool.ai` | `2.24.70.248` | Field School VPS | MinIO |
| `edit.fieldschool.ai` | `2.24.70.248` | Field School VPS | Edit MCP. `GET /health` is `fieldschool-edit`. `POST /trigger` is the instant kick |

Mail records (`MX`, SPF, DKIM) stay on Hostinger mail. They are not this plane.

## Where the bulk of the work is happening

Site, portal, and video all run on the Field School VPS. That is the right box.

On the Field School VPS right now:

- Docker: `field-school-app`, `ae-coach-caddy-1`, `ae-coach-app-1`, `ae-coach-postgres-1`, `field-school-db`, `cap-web`, `cap-mysql`, `cap-media-server`, `cap-minio`, `fieldschool-edit`, `fieldschool-trigger`
- Disk: `/opt/field-school` (portal source, wiped by `deploy.sh`), `/var/www/fieldschool.ai` (apex), `/opt/cap`, `/opt/fieldschool-adapter`, `/opt/fieldschool-edit`, `/opt/fieldschool-video/{hls,edit,cap-chrome}`
- Units: `fieldschool-adapter.service`, `fieldschool-processor.service` (90s backup)
- Caddy (inside `ae-coach-caddy-1`): apex, portal, university, `portal.benjohnson.ai`, plus Cap, MinIO, edit, trigger
- Caddy joins `ae-coach_default`, `cap_cap-network`, and `fieldschool-video`. It proxies `cap-web:3000`, `cap-minio:9000`, `fieldschool-edit:8788`, `fieldschool-trigger:8789`

Do not put video files under `/opt/field-school`. Portal deploy runs `rm -rf` there.

CNC vault keeps a disk backup of the old squat (`/opt/cap`, `/opt/fieldschool-adapter`, `/opt/fieldschool-edit`, `/opt/field-school/hls`). Field School Caddy sites and video units on that box are stopped. Leave `portal.notarealchurch.com` alone.

## Where it should stay

Keep Cap, MinIO, the adapter, edit, trigger, and HLS on `2.24.70.248`. Keep these A records on that box:

- `cap.fieldschool.ai`
- `s3.cap.fieldschool.ai`
- `edit.fieldschool.ai`

Do not add Field School video units, Caddy sites, or `/opt/field-school` video paths on `2.24.64.248`.

Do not flip `AUTH_URL`. Do not 301 `university.benjohnson.ai`. Do not wipe Caddy on the Field School VPS as a side effect of video work.

## How a take works

1. Record on Cap Desktop. Server URL is `https://cap.fieldschool.ai`. Sign in as `ben@fieldschool.ai`.
2. The adapter finds the take, creates one row in [Assets / Videos](https://app.notion.com/p/401926803acc4a2ab815ffb074cd8940), and writes Title, Transcript, AI summary, and Chapters. Status walks Ingested → Transcribing → Review.
3. Review is the pause. Read the row. Zaya writes the edit plan. You can watch a cheap preview.
4. Push. Flip Status to Cleaning, or `POST https://edit.fieldschool.ai/trigger` with the Asset id. Notion is not the queue. It fires the job and writes the log after.
5. The processor tightens the master, renders with the Field School mark top right (1576, 24, 80×64), splits lesson clips, writes HLS, and writes Draft lesson rows.
6. Status becomes HLS Ready. Play stays on our host. YouTube and social stay off.

Status walk: Ingested → Transcribing → Review → Cleaning → Editing → Clipping → HLS Ready → Published → Distributed.

Published and Distributed are parked.

Just (`27pn9xs0zk8a73g`) is a locked fixture. Do not write an Edit spec on it. Do not re-render it. Do not flip it.

## Notion

Hub: [Field School Dashboard](https://app.notion.com/p/3c8fe86f6dee8138b998f32c366651b3)

Operator pages:

- [How to make a Field School video](https://app.notion.com/p/3c9fe86f6dee81bb8413f47d532a7f24)
- [Field School Video README](https://app.notion.com/p/3c9fe86f6dee81aa9f17ffd4d4f30150)

Job key is always the Asset page id.

## Finished process video

The take about authored processes (waiting, memos, “that’s how we’ve always done it”) is **You Can Just Do Things**. Cap id `j013r823wx9ecaf`. Status HLS Ready. About 10:52.

Play the file:

- MP4: https://cap.fieldschool.ai/hls/j013r823wx9ecaf/master.mp4
- HLS: https://cap.fieldschool.ai/hls/j013r823wx9ecaf/master.m3u8
- Raw Cap: https://cap.fieldschool.ai/dev/j013r823wx9ecaf
- Ticket: https://app.notion.com/p/3c9fe86f6dee81299337e318cfef6982

Written companion (not the video): https://share.benjohnson.ai/everything-made-up.html

Lesson clips: `https://cap.fieldschool.ai/hls/j013r823wx9ecaf/lessons/{1-10}/master.m3u8`

## Code in this repo

| Path | What |
| --- | --- |
| `marketing-site/` | Apex HTML for `fieldschool.ai` |
| `deploy/deploy-site.sh` | Ships apex to `/var/www/fieldschool.ai` on `2.24.70.248` |
| `deploy/deploy.sh` | Ships the portal to `/opt/field-school` on `2.24.70.248` |
| `deploy/caddy-video.snippet` | Cap, MinIO, edit, trigger sites for Docker Caddy |
| `vault/fieldschool-adapter/` | Adapter + instant trigger. Deploy to the Field School VPS only |
| `vault/fieldschool-adapter/docker-compose.trigger.yml` | Trigger container on network `fieldschool-video` |

Cap and fieldschool-edit still live on the Field School VPS disk (`/opt/cap`, `/opt/fieldschool-edit`). They are not in this git tree yet.
