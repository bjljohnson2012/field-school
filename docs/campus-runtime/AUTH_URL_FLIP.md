# AUTH_URL flip + university 301

Ben authorized this on 18 Sep 2026. Ship from `cursor/auth-url-portal-301-26aa`, not Wave 2 / spam / Wave 3.

Canonical origin: `https://portal.fieldschool.ai`.
`university.benjohnson.ai` 301s to that origin.

## How

1. Portal Caddy sibling is already live → `field-school-app:3000`.
2. Set `/opt/field-school.env` `AUTH_URL=https://portal.fieldschool.ai`. Do not rotate `AUTH_SECRET`.
3. Caddy: `university.benjohnson.ai` `redir https://portal.fieldschool.ai{uri} permanent`. Leave `srv1643164.hstgr.cloud` on the app.
4. Recreate `field-school-app` with `--no-build`. Do **not** run `app/deploy/deploy.sh` from this main-based branch (that wipe would replace live Wave 2 chrome).

Script: `app/deploy/flip-auth-url.sh` (dry-run default; `--apply` mutates).

## Proof (applied 2026-09-18 21:16Z)

Shipped SHA `6527cd88b8772deb30af2b15ce314fdc06f44469`. Image unchanged (`a71af6c0…`). Four-model PASS on that SHA.

| Check | Expect |
|---|---|
| `GET https://university.benjohnson.ai/` | 301 `Location: https://portal.fieldschool.ai/` |
| `GET https://university.benjohnson.ai/c/grok-bot` | 301 to portal Grok Bot |
| Portal `/api/auth/providers` | callbacks on `https://portal.fieldschool.ai/api/auth/...` |
| Guest `/c/grok-bot` | 200 |
| Guest `/api/me` | `{authenticated:false,guest:true}` |
| Guest `POST /api/events` | 401 `sign_in_required` |
| `/checkout?plan=100` | 307 `buy.stripe.com/28EbJ0dlvaDVcrGcVg8g005` |
| `/checkout?plan=200` | 307 `…8x25kCa9j6nF4Ze8F08g006` |
| `/checkout?plan=1000` | 307 `…aFa8wOgxHeUbcrG5sO8g007` |
| `cap.fieldschool.ai/login` | 200 |
| `edit.fieldschool.ai/health` | ok |

Live matched every row at 21:16Z. Image stayed `a71af6c0…` (Wave 2 chrome). Guest home still has Continue as guest. `/children` still 404. `/o/household` still 401. Pattern instrument `fp-50-v1` count 50.

Stripe cart implementation is a sibling worker. Learn with Ben stays `$100` / `$200` / `$1,000` unless that worker reports a cart change.

## Not this ship

TanStack `src/` / `vite.config.ts` / `migrations/0001-0003`. CNC vault `2.24.64.248`. Asset Just `27pn9xs0zk8a73g`. Remotion plates. Second Pattern bank.
