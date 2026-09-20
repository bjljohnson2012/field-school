#!/bin/bash
# Overlay Wave 3 composer / teach / learner catalog onto live campus Next
# without a deploy.sh wipe. Keeps postgres, uploads, FAMILY_V1_SHA, and
# family operator-writes chrome. Rebuilds field-school-app only.
# Does not apply 0001-0011. Does not re-apply 0005 unless lessons is missing.
# No Remotion, no player rail, no Cleaning flip, no AUTH_URL, no family chrome.
set -euo pipefail
VPS_HOST="${VPS_HOST:-root@2.24.70.248}"
KEY="${VPS_SSH_KEY:-$HOME/.ssh/vps_deploy}"
if [ ! -f "$KEY" ] && [ -f "$HOME/.ssh/field-school-agent" ]; then
  KEY="$HOME/.ssh/field-school-agent"
fi
if [ ! -f "$KEY" ] && [ -f "$HOME/.ssh/id_ed25519_hostinger" ]; then
  KEY="$HOME/.ssh/id_ed25519_hostinger"
fi
REMOTE_DIR="${REMOTE_DIR:-/opt/field-school}"
PACK_DIR="${PACK_DIR:-/opt/field-school-packs}"
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
SCP=(scp -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="${STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
MAIN_SHA="${MAIN_SHA:-unknown}"
PACK_ONLY="${PACK_ONLY:-0}"

if [ -f "$ROOT/vite.config.ts" ] || [ -d "$ROOT/src/routes" ]; then
  echo "Refusing: this looks like the frozen TanStack tree, not app/." >&2
  exit 1
fi
if [ ! -f "$ROOT/src/app/api/composer/catalog/route.ts" ]; then
  echo "Refusing: composer catalog route missing in $ROOT" >&2
  exit 1
fi
if [ ! -f "$ROOT/src/app/o/[slug]/teach/page.tsx" ]; then
  echo "Refusing: teach page missing in $ROOT" >&2
  exit 1
fi
if [ ! -f "$ROOT/src/app/o/[slug]/l/page.tsx" ]; then
  echo "Refusing: learner catalog missing in $ROOT" >&2
  exit 1
fi

STAGE="$(mktemp -d /tmp/wave3-composer-campus-pack.XXXXXX)"
TMP_TAR="$(mktemp /tmp/wave3-composer-campus-pack.XXXXXX.tar.gz)"
trap 'rm -rf "$STAGE" "$TMP_TAR"' EXIT

MEMBERS=(
  src/app/api/composer/catalog/route.ts
  src/app/api/composer/files/[sourceId]/route.ts
  src/app/api/composer/lessons/route.ts
  src/app/api/composer/publish/route.ts
  src/app/api/composer/quiz/route.ts
  src/app/api/composer/sources/route.ts
  src/lib/composer/access.ts
  src/lib/composer/rules.ts
  src/lib/composer/schema.ts
  src/lib/composer/sql.ts
  src/lib/composer/store.ts
  src/lib/composer/units.ts
  src/lib/composer/uploads.ts
  src/app/o/[slug]/teach/page.tsx
  src/app/o/[slug]/teach/[lessonId]/page.tsx
  src/app/o/[slug]/l/page.tsx
  src/app/o/[slug]/l/[lessonId]/page.tsx
  db/0005_composer.sql
)

mkdir -p \
  "$STAGE/src/app/api/composer/catalog" \
  "$STAGE/src/app/api/composer/files/[sourceId]" \
  "$STAGE/src/app/api/composer/lessons" \
  "$STAGE/src/app/api/composer/publish" \
  "$STAGE/src/app/api/composer/quiz" \
  "$STAGE/src/app/api/composer/sources" \
  "$STAGE/src/lib/composer" \
  "$STAGE/src/app/o/[slug]/teach/[lessonId]" \
  "$STAGE/src/app/o/[slug]/l/[lessonId]" \
  "$STAGE/db"

for rel in "${MEMBERS[@]}"; do
  cp "$ROOT/$rel" "$STAGE/$rel"
done

{
  echo "wave3-composer-campus-pack (composer/teach/l only)"
  echo "main_sha=$MAIN_SHA"
  echo "stamp=$STAMP"
  echo "files:"
  printf '  %s\n' "${MEMBERS[@]}"
  echo "not in pack: remotion, player rail, family chrome, children-database, vite.config, AUTH_URL, stripe, Cleaning flip, org home"
} > "$STAGE/MANIFEST.txt"

cat > "$STAGE/WAVE3_COMPOSER_SHA" <<MARKER
main_sha=$MAIN_SHA
stamp=$STAMP
cutover_scope=composer-teach-learner-catalog
keep=postgres,uploads,FAMILY_V1_SHA,family-v1-home,family/operator,family/signals,plate_renders,plates-api
MARKER

tar -C "$STAGE" -czf "$TMP_TAR" \
  "${MEMBERS[@]}" \
  MANIFEST.txt \
  WAVE3_COMPOSER_SHA
PACK_SHA="$(sha256sum "$TMP_TAR" | awk '{print $1}')"
echo "$PACK_SHA  wave3-composer-campus-pack-$STAMP.tar.gz" > "$STAGE.sha256"
echo "==> pack $TMP_TAR sha256=$PACK_SHA"

if [ "$PACK_ONLY" = "1" ]; then
  mkdir -p "${PACK_OUT_DIR:-/tmp}"
  cp "$TMP_TAR" "${PACK_OUT_DIR:-/tmp}/wave3-composer-campus-pack-$STAMP.tar.gz"
  cp "$STAGE.sha256" "${PACK_OUT_DIR:-/tmp}/wave3-composer-campus-pack-$STAMP.sha256"
  echo "pack_only=${PACK_OUT_DIR:-/tmp}/wave3-composer-campus-pack-$STAMP.tar.gz"
  echo "sha256=$PACK_SHA"
  exit 0
fi

"${SSH[@]}" "$VPS_HOST" "mkdir -p '$PACK_DIR' && test -f '$REMOTE_DIR/FAMILY_V1_SHA'"
REMOTE_PACK="$PACK_DIR/wave3-composer-campus-pack-$STAMP.tar.gz"
"${SCP[@]}" "$TMP_TAR" "$VPS_HOST:$REMOTE_PACK"
"${SCP[@]}" "$STAGE.sha256" "$VPS_HOST:$PACK_DIR/wave3-composer-campus-pack-$STAMP.sha256"

"${SSH[@]}" "$VPS_HOST" bash -s <<REMOTE
set -euo pipefail
REMOTE_DIR="$REMOTE_DIR"
PACK="$REMOTE_PACK"
ENV_FILE=/opt/field-school.env
FAM_HOME=\$(sha256sum "\$REMOTE_DIR/src/components/family-v1-home.tsx" | awk '{print \$1}')
FAM_OP=\$(sha256sum "\$REMOTE_DIR/src/lib/family/operator.ts" | awk '{print \$1}')
FAM_SIG=\$(sha256sum "\$REMOTE_DIR/src/lib/family/signals.ts" | awk '{print \$1}')
FAM_SHA=\$(sha256sum "\$REMOTE_DIR/FAMILY_V1_SHA" | awk '{print \$1}')
echo "family hashes before: home=\$FAM_HOME op=\$FAM_OP sig=\$FAM_SIG sha=\$FAM_SHA"

echo "pack members:"
tar -tzf "\$PACK"
if tar -tzf "\$PACK" | grep -E '(^|/)(family-v1-home|children-database|src/routes/|vite.config|remotion)'; then
  echo "Refusing pack: family, TanStack, or Remotion paths present" >&2
  exit 1
fi
mkdir -p \
  "\$REMOTE_DIR/src/app/api/composer/catalog" \
  "\$REMOTE_DIR/src/app/api/composer/files/[sourceId]" \
  "\$REMOTE_DIR/src/app/api/composer/lessons" \
  "\$REMOTE_DIR/src/app/api/composer/publish" \
  "\$REMOTE_DIR/src/app/api/composer/quiz" \
  "\$REMOTE_DIR/src/app/api/composer/sources" \
  "\$REMOTE_DIR/src/lib/composer" \
  "\$REMOTE_DIR/src/app/o/[slug]/teach/[lessonId]" \
  "\$REMOTE_DIR/src/app/o/[slug]/l/[lessonId]" \
  "\$REMOTE_DIR/db"
tar -xzf "\$PACK" -C "\$REMOTE_DIR"

FAM_HOME2=\$(sha256sum "\$REMOTE_DIR/src/components/family-v1-home.tsx" | awk '{print \$1}')
FAM_OP2=\$(sha256sum "\$REMOTE_DIR/src/lib/family/operator.ts" | awk '{print \$1}')
FAM_SIG2=\$(sha256sum "\$REMOTE_DIR/src/lib/family/signals.ts" | awk '{print \$1}')
FAM_SHA2=\$(sha256sum "\$REMOTE_DIR/FAMILY_V1_SHA" | awk '{print \$1}')
if [ "\$FAM_HOME" != "\$FAM_HOME2" ] || [ "\$FAM_OP" != "\$FAM_OP2" ] || [ "\$FAM_SIG" != "\$FAM_SIG2" ] || [ "\$FAM_SHA" != "\$FAM_SHA2" ]; then
  echo "Family chrome hash changed — aborting rebuild" >&2
  exit 1
fi

if ! docker exec field-school-campus-db psql -U campus -d campus -tAc "SELECT to_regclass('public.lessons')" | grep -q lessons; then
  echo "lessons missing — applying 0005 only"
  docker exec -i field-school-campus-db psql -U campus -d campus < "\$REMOTE_DIR/db/0005_composer.sql"
else
  echo "0005 tables present — skip migrate"
fi

cd "\$REMOTE_DIR/deploy"
docker compose --env-file "\$ENV_FILE" up -d --build --no-deps app
docker compose --env-file "\$ENV_FILE" ps
REMOTE

echo "pack=$REMOTE_PACK"
echo "sha256=$PACK_SHA"
echo "Campus overlay: field-school-app rebuild only. Family chrome kept. Wave3 composer/teach/l."
