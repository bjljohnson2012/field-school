#!/bin/bash
# Flip AUTH_URL to https://portal.fieldschool.ai and 301 university → portal.
# Does not wipe /opt/field-school. Does not rebuild the Next image.
# Live Wave 2 chrome and Stripe cart stay. Do not run deploy/deploy.sh from this branch.
set -euo pipefail

APPLY=0
if [ "${1:-}" = "--apply" ]; then
  APPLY=1
elif [ -n "${1:-}" ]; then
  echo "usage: $0 [--apply]" >&2
  exit 2
fi

VPS_HOST="${VPS_HOST:-root@2.24.70.248}"
KEY="${VPS_SSH_KEY:-}"
if [ -z "$KEY" ] || [ ! -f "$KEY" ]; then
  for candidate in "$HOME/.ssh/vps_deploy" "$HOME/.ssh/field-school-agent" "$HOME/.ssh/id_ed25519_hostinger"; do
    if [ -f "$candidate" ]; then
      KEY="$candidate"
      break
    fi
  done
fi
if [ -z "$KEY" ] || [ ! -f "$KEY" ]; then
  echo "missing SSH key (tried VPS_SSH_KEY, vps_deploy, field-school-agent, id_ed25519_hostinger)" >&2
  exit 1
fi
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -f "$ROOT/vite.config.ts" ] || [ -d "$ROOT/src/routes" ]; then
  echo "Refusing: this looks like the frozen TanStack tree, not app/." >&2
  exit 1
fi
if [ ! -f "$ROOT/next.config.ts" ]; then
  echo "Refusing: next.config.ts missing. Run from the Next app tree." >&2
  exit 1
fi

PORTAL="https://portal.fieldschool.ai"
AUTH_URL="$PORTAL"
CADDY_SNIPPET="$ROOT/deploy/caddy/university-301.caddy"
if [ ! -f "$CADDY_SNIPPET" ]; then
  echo "missing $CADDY_SNIPPET" >&2
  exit 1
fi

echo "==> plan"
echo "AUTH_URL -> $AUTH_URL in /opt/field-school.env"
echo "Caddy: university.benjohnson.ai 301 -> $PORTAL{uri}"
echo "srv1643164.hstgr.cloud stays reverse_proxy field-school-app:3000"
echo "portal.fieldschool.ai block unchanged"
echo "recreate field-school-app --no-build (existing image)"
echo "will not wipe /opt/field-school, rotate AUTH_SECRET, or touch Stripe"

if [ "$APPLY" -eq 0 ]; then
  echo "dry-run. pass --apply to mutate the VPS."
  exit 0
fi

echo "==> applying on $VPS_HOST"
"${SSH[@]}" "$VPS_HOST" bash -s <<REMOTE
set -euo pipefail
ENV_FILE=/opt/field-school.env
CADDY=/opt/ae-coach/docker/Caddyfile
STAMP=\$(date +%s)
if [ ! -f "\$ENV_FILE" ]; then
  echo "missing \$ENV_FILE" >&2
  exit 1
fi
if [ ! -f "\$CADDY" ]; then
  echo "missing \$CADDY" >&2
  exit 1
fi
if ! grep -q '^AUTH_URL=' "\$ENV_FILE"; then
  echo "AUTH_URL missing from \$ENV_FILE" >&2
  exit 1
fi
if grep -q '^NEXTAUTH_URL=' "\$ENV_FILE"; then
  echo "NEXTAUTH_URL is set; align it to portal or refuse" >&2
  if ! grep -q '^NEXTAUTH_URL=https://portal.fieldschool.ai' "\$ENV_FILE"; then
    echo "NEXTAUTH_URL is not portal; refusing so callbacks do not split" >&2
    exit 1
  fi
fi
umask 077
cp -a "\$ENV_FILE" "\$ENV_FILE.bak.auth-\$STAMP"
python3 - <<'PY'
from pathlib import Path
p = Path("/opt/field-school.env")
lines = p.read_text().splitlines()
out = []
found = False
for line in lines:
    if line.startswith("AUTH_URL="):
        out.append("AUTH_URL=https://portal.fieldschool.ai")
        found = True
    elif line.startswith("NEXTAUTH_URL="):
        out.append("NEXTAUTH_URL=https://portal.fieldschool.ai")
    else:
        out.append(line)
if not found:
    raise SystemExit("AUTH_URL line missing")
text = "\\n".join(out) + "\\n"
p.write_text(text)
PY
chmod 600 "\$ENV_FILE"
if grep -q '^AUTH_SECRET=' "\$ENV_FILE.bak.auth-\$STAMP"; then
  old=\$(grep '^AUTH_SECRET=' "\$ENV_FILE.bak.auth-\$STAMP" | head -1 | cut -d= -f2-)
  new=\$(grep '^AUTH_SECRET=' "\$ENV_FILE" | head -1 | cut -d= -f2-)
  if [ "\$old" != "\$new" ]; then
    echo "AUTH_SECRET changed; restoring backup" >&2
    mv "\$ENV_FILE.bak.auth-\$STAMP" "\$ENV_FILE"
    exit 1
  fi
fi
cp -a "\$CADDY" "\$CADDY.bak.auth-\$STAMP"
python3 - <<'PY'
from pathlib import Path
p = Path("/opt/ae-coach/docker/Caddyfile")
text = p.read_text()
old = """university.benjohnson.ai, srv1643164.hstgr.cloud {
    encode gzip
    reverse_proxy field-school-app:3000
    log {
        output file /data/university.access.log
    }
}
"""
new = """university.benjohnson.ai {
    encode gzip
    redir https://portal.fieldschool.ai{uri} permanent
    log {
        output file /data/university.access.log
    }
}

srv1643164.hstgr.cloud {
    encode gzip
    reverse_proxy field-school-app:3000
    log {
        output file /data/hstgr.access.log
    }
}
"""
if old not in text:
    if "redir https://portal.fieldschool.ai{uri} permanent" in text and "university.benjohnson.ai {" in text:
        print("Caddy university 301 already applied")
    else:
        raise SystemExit("Caddy university block did not match expected text")
else:
    p.write_text(text.replace(old, new, 1))
PY
if ! grep -q 'portal.fieldschool.ai' "\$CADDY"; then
  echo "portal.fieldschool.ai missing from Caddy after edit" >&2
  mv "\$CADDY.bak.auth-\$STAMP" "\$CADDY"
  exit 1
fi
if ! grep -q 'redir https://portal.fieldschool.ai{uri} permanent' "\$CADDY"; then
  echo "university 301 missing after edit" >&2
  mv "\$CADDY.bak.auth-\$STAMP" "\$CADDY"
  exit 1
fi
docker exec ae-coach-caddy-1 caddy reload --config /etc/caddy/Caddyfile
cd /opt/field-school/deploy
docker compose --env-file "\$ENV_FILE" up -d --no-build --no-deps --force-recreate app
echo "==> env AUTH_URL"
grep '^AUTH_URL=' "\$ENV_FILE"
echo "==> compose AUTH_URL"
docker exec field-school-app printenv AUTH_URL
REMOTE

echo "Campus AUTH_URL: $AUTH_URL"
echo "University 301: https://university.benjohnson.ai -> $PORTAL"
