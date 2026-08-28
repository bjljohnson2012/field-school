#!/bin/bash
# Deploy Field School University to the Hostinger VPS.
# Public campus: https://university.benjohnson.ai
set -euo pipefail
VPS_HOST="${VPS_HOST:-root@2.24.70.248}"
KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519_hostinger}"
if [ ! -f "$KEY" ] && [ -n "${SSH_PRIVATE_KEY:-}" ]; then
  mkdir -p "$HOME/.ssh"
  printf '%s\n' "$SSH_PRIVATE_KEY" > "$KEY"
  chmod 600 "$KEY"
fi
REMOTE_DIR="${REMOTE_DIR:-/opt/field-school}"
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> packing source"
TMP_TAR="$(mktemp /tmp/field-school.XXXXXX.tar.gz)"
trap 'rm -f "$TMP_TAR"' EXIT
tar -C "$ROOT" -czf "$TMP_TAR" \
  --exclude node_modules \
  --exclude .git \
  --exclude .next \
  --exclude .vercel \
  --exclude deploy/.vps.env \
  .

echo "==> uploading to $VPS_HOST:$REMOTE_DIR"
"${SSH[@]}" "$VPS_HOST" "rm -rf '$REMOTE_DIR' && mkdir -p '$REMOTE_DIR'"
cat "$TMP_TAR" | "${SSH[@]}" "$VPS_HOST" "tar -xzf - -C '$REMOTE_DIR'"

echo "==> compose up"
"${SSH[@]}" "$VPS_HOST" bash -s <<REMOTE
set -euo pipefail
cd "$REMOTE_DIR/deploy"
docker compose up -d --build
docker compose ps
REMOTE

echo "Campus: https://university.benjohnson.ai"
