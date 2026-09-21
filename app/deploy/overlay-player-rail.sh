#!/bin/bash
# Overlay HTML5 LessonSpine player rail onto live campus Next without a deploy.sh wipe.
# Keeps postgres, uploads, FAMILY_V1_SHA, and family
# operator-writes chrome. Rebuilds field-school-app only.
# No Remotion npm, no Cleaning flip, no AUTH_URL, no family chrome, no org home.
set -euo pipefail
VPS_HOST="${VPS_HOST:-root@2.24.70.248}"
KEY="${VPS_SSH_KEY:-$HOME/.ssh/vps_deploy}"
if [ ! -f "$KEY" ] && [ -f "$HOME/.ssh/vps_deploy" ]; then
  KEY="$HOME/.ssh/vps_deploy"
fi
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
if [ ! -f "$ROOT/src/app/play/lesson-spine/page.tsx" ]; then
  echo "Refusing: player page missing in $ROOT" >&2
  exit 1
fi
if [ ! -f "$ROOT/src/app/api/media/lesson-spine/route.ts" ]; then
  echo "Refusing: media route missing in $ROOT" >&2
  exit 1
fi
if [ ! -f "$ROOT/public/lessons/LessonSpine.mp4" ]; then
  echo "Refusing: campus LessonSpine archive missing in $ROOT" >&2
  exit 1
fi

STAGE="$(mktemp -d /tmp/player-rail-campus-pack.XXXXXX)"
TMP_TAR="$(mktemp /tmp/player-rail-campus-pack.XXXXXX.tar.gz)"
trap 'rm -rf "$STAGE" "$TMP_TAR"' EXIT

MEMBERS=(
  src/app/play/lesson-spine/page.tsx
  src/app/api/media/lesson-spine/route.ts
  src/components/lesson-spine-player.tsx
  src/lib/player/lesson-spine.ts
  src/lib/player/lesson-spine-meta.ts
  src/app/campus-home.tsx
  src/components/site-header.tsx
  public/lessons/LessonSpine.mp4
)

mkdir -p \
  "$STAGE/src/app/play/lesson-spine" \
  "$STAGE/src/app/api/media/lesson-spine" \
  "$STAGE/src/components" \
  "$STAGE/src/lib/player" \
  "$STAGE/src/app" \
  "$STAGE/public/lessons"

for member in "${MEMBERS[@]}"; do
  cp "$ROOT/$member" "$STAGE/$member"
done

cat > "$STAGE/MANIFEST.txt" <<MANIFEST
player-rail-campus-pack (HTML5 LessonSpine player)
main_sha=$MAIN_SHA
stamp=$STAMP
files:
$(printf '  %s\n' "${MEMBERS[@]}")
not in pack: remotion, family chrome, children-database, org home, vite.config, AUTH_URL, stripe, Cleaning flip
MANIFEST

cat > "$STAGE/PLAYER_RAIL_SHA" <<MARKER
main_sha=$MAIN_SHA
stamp=$STAMP
cutover_scope=html5-lesson-spine-player-rail
keep=postgres,uploads,FAMILY_V1_SHA,family-v1-home,family/operator,family/signals
MARKER

tar -C "$STAGE" -czf "$TMP_TAR" \
  "${MEMBERS[@]}" \
  MANIFEST.txt \
  PLAYER_RAIL_SHA
PACK_SHA="$(sha256sum "$TMP_TAR" | awk '{print $1}')"
echo "$PACK_SHA  player-rail-campus-pack-$STAMP.tar.gz" > "$STAGE.sha256"
echo "==> pack $TMP_TAR sha256=$PACK_SHA"

if [ "$PACK_ONLY" = "1" ]; then
  mkdir -p "${PACK_OUT_DIR:-/tmp}"
  cp "$TMP_TAR" "${PACK_OUT_DIR:-/tmp}/player-rail-campus-pack-$STAMP.tar.gz"
  cp "$STAGE.sha256" "${PACK_OUT_DIR:-/tmp}/player-rail-campus-pack-$STAMP.sha256"
  echo "pack_only=${PACK_OUT_DIR:-/tmp}/player-rail-campus-pack-$STAMP.tar.gz"
  echo "sha256=$PACK_SHA"
  exit 0
fi

"${SSH[@]}" "$VPS_HOST" "mkdir -p '$PACK_DIR' && test -f '$REMOTE_DIR/FAMILY_V1_SHA'"
REMOTE_PACK="$PACK_DIR/player-rail-campus-pack-$STAMP.tar.gz"
"${SCP[@]}" "$TMP_TAR" "$VPS_HOST:$REMOTE_PACK"
"${SCP[@]}" "$STAGE.sha256" "$VPS_HOST:$PACK_DIR/player-rail-campus-pack-$STAMP.sha256"

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
if tar -tzf "\$PACK" | grep -E '(^|/)(family-v1-home|children-database|src/routes/|vite.config|@remotion|o/\[slug\]/page.tsx)'; then
  echo "Refusing pack: family, org home, Remotion, or TanStack paths present" >&2
  exit 1
fi
mkdir -p "\$REMOTE_DIR/src/app/play/lesson-spine" "\$REMOTE_DIR/src/app/api/media/lesson-spine" "\$REMOTE_DIR/src/lib/player" "\$REMOTE_DIR/public/lessons"
tar -xzf "\$PACK" -C "\$REMOTE_DIR"

FAM_HOME2=\$(sha256sum "\$REMOTE_DIR/src/components/family-v1-home.tsx" | awk '{print \$1}')
FAM_OP2=\$(sha256sum "\$REMOTE_DIR/src/lib/family/operator.ts" | awk '{print \$1}')
FAM_SIG2=\$(sha256sum "\$REMOTE_DIR/src/lib/family/signals.ts" | awk '{print \$1}')
FAM_SHA2=\$(sha256sum "\$REMOTE_DIR/FAMILY_V1_SHA" | awk '{print \$1}')
if [ "\$FAM_HOME" != "\$FAM_HOME2" ] || [ "\$FAM_OP" != "\$FAM_OP2" ] || [ "\$FAM_SIG" != "\$FAM_SIG2" ] || [ "\$FAM_SHA" != "\$FAM_SHA2" ]; then
  echo "Family chrome hash changed — aborting rebuild" >&2
  exit 1
fi

cd "\$REMOTE_DIR/deploy"
docker compose --env-file "\$ENV_FILE" up -d --build --no-deps app
docker compose --env-file "\$ENV_FILE" ps
REMOTE

echo "pack=$REMOTE_PACK"
echo "sha256=$PACK_SHA"
echo "Campus overlay: field-school-app rebuild only. Family chrome kept."
