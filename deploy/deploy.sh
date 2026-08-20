#!/bin/bash
# Deploy Johnson Field School University to the Hostinger VPS.
# Public campus: https://university.benjohnson.ai
# Add DNS A record: university.benjohnson.ai → 2.24.70.248
set -euo pipefail
VPS_HOST="${VPS_HOST:-root@2.24.70.248}"
KEY="${VPS_SSH_KEY:-/root/.ssh/id_ed25519_hostinger}"
REMOTE_DIR="${REMOTE_DIR:-/opt/field-school}"
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> packing source"
TMP_TAR="$(mktemp /tmp/field-school.XXXXXX.tar.gz)"
trap 'rm -f "$TMP_TAR"' EXIT
tar -C "$ROOT" -czf "$TMP_TAR" \
  --exclude node_modules \
  --exclude .git \
  --exclude .tanstack \
  --exclude .vercel \
  --exclude .output \
  --exclude .nitro \
  --exclude screenshots \
  --exclude artifacts \
  --exclude attachments \
  --exclude deploy/.vps.env \
  .

echo "==> uploading to $VPS_HOST:$REMOTE_DIR"
"${SSH[@]}" "$VPS_HOST" "mkdir -p '$REMOTE_DIR'"
cat "$TMP_TAR" | "${SSH[@]}" "$VPS_HOST" "tar -xzf - -C '$REMOTE_DIR'"

echo "==> ensuring env + Caddy site + compose up"
# Unquoted heredoc so local XAI_API_KEY is written on first run only.
"${SSH[@]}" "$VPS_HOST" bash -s <<REMOTE
set -euo pipefail
REMOTE_DIR="$REMOTE_DIR"
XAI_FROM_LOCAL="${XAI_API_KEY:-}"
cd "\$REMOTE_DIR"
mkdir -p deploy
if [ ! -f deploy/.vps.env ]; then
  umask 077
  XAI="\$XAI_FROM_LOCAL"
  if [ -z "\$XAI" ] && [ -f /opt/ae-coach/.env ]; then
    XAI="\$(grep -E '^GROK_API_KEY=' /opt/ae-coach/.env | head -1 | cut -d= -f2- || true)"
  fi
  cat > deploy/.vps.env <<EOF
POSTGRES_PASSWORD=\$(openssl rand -hex 18)
BETTER_AUTH_SECRET=\$(openssl rand -hex 32)
BETTER_AUTH_URL=https://university.benjohnson.ai
BETTER_AUTH_TRUSTED_ORIGINS=https://university.benjohnson.ai,https://srv1643164.hstgr.cloud
XAI_API_KEY=\$XAI
DEAN_EMAILS=bjljohnson2012@gmail.com
EOF
  chmod 600 deploy/.vps.env
fi

# Keep dean email on existing env files
if [ -f deploy/.vps.env ] && ! grep -q '^DEAN_EMAILS=' deploy/.vps.env; then
  echo 'DEAN_EMAILS=bjljohnson2012@gmail.com' >> deploy/.vps.env
fi

# Point Caddy at the campus without touching portal.benjohnson.ai
CADDY=/opt/ae-coach/docker/Caddyfile
if [ -f "\$CADDY" ] && ! grep -q 'university.benjohnson.ai' "\$CADDY"; then
  cp "\$CADDY" "\$CADDY.bak.\$(date +%s)"
  cat >> "\$CADDY" <<'CADDYBLOCK'

university.benjohnson.ai, srv1643164.hstgr.cloud {
    encode gzip
    reverse_proxy field-school-app:3000
    log {
        output file /data/university.access.log
    }
}
CADDYBLOCK
  docker exec ae-coach-caddy-1 caddy reload --config /etc/caddy/Caddyfile || true
fi

cd deploy
docker compose --env-file .vps.env up -d --build
docker compose --env-file .vps.env ps
REMOTE

echo "Campus: https://university.benjohnson.ai"
echo "Until DNS is set, try: https://srv1643164.hstgr.cloud"
