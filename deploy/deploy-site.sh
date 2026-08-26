#!/bin/bash
# Ship the static fieldschool.ai tree and keep clean URLs.
set -euo pipefail
VPS_HOST="${VPS_HOST:-root@2.24.70.248}"
KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519_hostinger}"
if [ ! -f "$KEY" ] && [ -f "$HOME/.ssh/vps_deploy" ]; then
  KEY="$HOME/.ssh/vps_deploy"
fi
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/marketing-site"

echo "==> packing marketing-site"
TMP_TAR="$(mktemp /tmp/fieldschool-site.XXXXXX.tar.gz)"
trap 'rm -f "$TMP_TAR"' EXIT
tar -C "$SITE" -czf "$TMP_TAR" --exclude '*.bak*' .

echo "==> uploading to $VPS_HOST:/var/www/fieldschool.ai"
"${SSH[@]}" "$VPS_HOST" "rm -rf /var/www/fieldschool.ai/brand && mkdir -p /var/www/fieldschool.ai"
cat "$TMP_TAR" | "${SSH[@]}" "$VPS_HOST" "tar -xzf - -C /var/www/fieldschool.ai"

echo "==> keeping Caddy try_files for clean URLs"
"${SSH[@]}" "$VPS_HOST" bash -s <<'REMOTE'
set -euo pipefail
CADDY=/opt/ae-coach/docker/Caddyfile
if [ -f "$CADDY" ] && ! grep -q 'try_files {path}' "$CADDY"; then
  cp "$CADDY" "$CADDY.bak.site-$(date +%s)"
  python3 - <<'PY'
from pathlib import Path
p = Path("/opt/ae-coach/docker/Caddyfile")
text = p.read_text()
old = """fieldschool.ai, www.fieldschool.ai {
    encode gzip
    root * /var/www/fieldschool.ai
    rewrite /privacy /privacy.html
    rewrite /terms /terms.html
    file_server
"""
new = """fieldschool.ai, www.fieldschool.ai {
    encode gzip
    root * /var/www/fieldschool.ai
    try_files {path} {path}.html {path}/index.html
    file_server
"""
if old not in text:
    raise SystemExit("Caddy apex block did not match expected text")
p.write_text(text.replace(old, new, 1))
PY
  docker exec ae-coach-caddy-1 caddy reload --config /etc/caddy/Caddyfile
fi
REMOTE

echo "Apex: https://fieldschool.ai"
