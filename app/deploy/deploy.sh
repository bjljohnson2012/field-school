#!/bin/bash
# Deploy the Field School Next campus (Wave 1) to the Hostinger VPS.
# Do not run this from the GitHub TanStack root. This tree is app/.
# Public campus: https://portal.fieldschool.ai (university.benjohnson.ai 301s here)
# AUTH_URL lives in /opt/field-school.env. Flip it with flip-auth-url.sh, not this wipe.
set -euo pipefail
VPS_HOST="${VPS_HOST:-root@2.24.70.248}"
KEY="${VPS_SSH_KEY:-$HOME/.ssh/field-school-agent}"
if [ ! -f "$KEY" ] && [ -f "$HOME/.ssh/id_ed25519_hostinger" ]; then
  KEY="$HOME/.ssh/id_ed25519_hostinger"
fi
if [ ! -f "$KEY" ] && [ -n "${SSH_PRIVATE_KEY:-}" ]; then
  mkdir -p "$HOME/.ssh"
  printf '%s\n' "$SSH_PRIVATE_KEY" > "$KEY"
  chmod 600 "$KEY"
fi
REMOTE_DIR="${REMOTE_DIR:-/opt/field-school}"
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -f "$ROOT/vite.config.ts" ] || [ -d "$ROOT/src/routes" ]; then
  echo "Refusing to deploy: this looks like the frozen TanStack tree, not app/." >&2
  exit 1
fi
if [ ! -f "$ROOT/next.config.ts" ]; then
  echo "Refusing to deploy: next.config.ts missing. Run from the Next app tree." >&2
  exit 1
fi

echo "==> packing Next source"
TMP_TAR="$(mktemp /tmp/field-school-next.XXXXXX.tar.gz)"
STAGE="$(mktemp -d /tmp/field-school-next-stage.XXXXXX)"
trap 'rm -rf "$TMP_TAR" "$STAGE"' EXIT
# Standalone image reads the pinned bank at /app/docs/campus-runtime.
# That file lives at repo docs/, not inside app/.
tar -C "$ROOT" -cf - \
  --exclude node_modules \
  --exclude .git \
  --exclude .next \
  --exclude .vercel \
  --exclude postgres \
  --exclude deploy/.vps.env \
  --exclude .data \
  . | tar -C "$STAGE" -xf -
mkdir -p "$STAGE/docs/campus-runtime"
cp "$ROOT/../docs/campus-runtime/fp-50-v1.md" "$STAGE/docs/campus-runtime/fp-50-v1.md"
tar -C "$STAGE" -czf "$TMP_TAR" .

echo "==> uploading to $VPS_HOST:$REMOTE_DIR (keeping postgres data and composer uploads)"
"${SSH[@]}" "$VPS_HOST" "mkdir -p '$REMOTE_DIR/postgres' '$REMOTE_DIR/uploads' && chown 1001:1001 '$REMOTE_DIR/uploads' && find '$REMOTE_DIR' -mindepth 1 -maxdepth 1 ! -name postgres ! -name uploads -exec rm -rf {} +"
cat "$TMP_TAR" | "${SSH[@]}" "$VPS_HOST" "tar -xzf - -C '$REMOTE_DIR'"

echo "==> env, compose, migrate"
"${SSH[@]}" "$VPS_HOST" bash -s <<REMOTE
set -euo pipefail
ENV_FILE=/opt/field-school.env
if [ ! -f "\$ENV_FILE" ]; then
  echo "missing \$ENV_FILE" >&2
  exit 1
fi
if ! grep -q '^CAMPUS_POSTGRES_PASSWORD=' "\$ENV_FILE"; then
  umask 077
  echo "CAMPUS_POSTGRES_PASSWORD=\$(openssl rand -hex 18)" >> "\$ENV_FILE"
  chmod 600 "\$ENV_FILE"
fi
cd "$REMOTE_DIR/deploy"
docker compose --env-file "\$ENV_FILE" up -d --build
echo "==> waiting for campus-db"
for i in \$(seq 1 40); do
  if docker exec field-school-campus-db pg_isready -U campus -d campus >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
for f in 0001_wave1.sql 0002_field_pattern.sql 0003_pattern_weights.sql 0004_tenants.sql 0005_composer.sql 0006_learning_intents.sql 0007_curriculum_paths.sql 0008_next_portions.sql 0009_progress_ledgers.sql 0010_knowledge_brains.sql 0011_credits_byok.sql; do
  docker exec -i field-school-campus-db psql -U campus -d campus < "$REMOTE_DIR/db/\$f"
done
docker compose --env-file "\$ENV_FILE" ps
REMOTE

echo "Campus: https://portal.fieldschool.ai"
echo "University 301: https://university.benjohnson.ai -> https://portal.fieldschool.ai"
