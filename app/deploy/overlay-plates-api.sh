#!/bin/bash
# Overlay /api/plates routes onto live campus Next without a deploy.sh wipe.
# Keeps postgres, uploads, FAMILY_V1_SHA, and family operator-writes chrome.
# Rebuilds field-school-app only. Does not apply 0001-0011. Does not re-apply 0012
# unless plate_renders is missing. No Remotion, no player rail, no Cleaning flip.
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

if [ -f "$ROOT/vite.config.ts" ] || [ -d "$ROOT/src/routes" ]; then
  echo "Refusing: this looks like the frozen TanStack tree, not app/." >&2
  exit 1
fi
if [ ! -f "$ROOT/src/app/api/plates/route.ts" ]; then
  echo "Refusing: plates routes missing in $ROOT" >&2
  exit 1
fi

STAGE="$(mktemp -d /tmp/plates-api-campus-pack.XXXXXX)"
TMP_TAR="$(mktemp /tmp/plates-api-campus-pack.XXXXXX.tar.gz)"
trap 'rm -rf "$STAGE" "$TMP_TAR"' EXIT

mkdir -p \
  "$STAGE/src/app/api/plates/approve" \
  "$STAGE/src/app/api/plates/reject" \
  "$STAGE/src/lib/plates" \
  "$STAGE/db"
cp "$ROOT/src/app/api/plates/route.ts" "$STAGE/src/app/api/plates/route.ts"
cp "$ROOT/src/app/api/plates/approve/route.ts" "$STAGE/src/app/api/plates/approve/route.ts"
cp "$ROOT/src/app/api/plates/reject/route.ts" "$STAGE/src/app/api/plates/reject/route.ts"
cp "$ROOT/src/lib/plates/rules.ts" "$STAGE/src/lib/plates/rules.ts"
cp "$ROOT/src/lib/plates/sql.ts" "$STAGE/src/lib/plates/sql.ts"
cp "$ROOT/src/lib/plates/store.ts" "$STAGE/src/lib/plates/store.ts"
cp "$ROOT/db/0012_plate_renders.sql" "$STAGE/db/0012_plate_renders.sql"

cat > "$STAGE/MANIFEST.txt" <<MANIFEST
plates-api-campus-pack (routes only)
main_sha=$MAIN_SHA
stamp=$STAMP
files:
  src/app/api/plates/route.ts
  src/app/api/plates/approve/route.ts
  src/app/api/plates/reject/route.ts
  src/lib/plates/rules.ts
  src/lib/plates/sql.ts
  src/lib/plates/store.ts
  db/0012_plate_renders.sql
not in pack: remotion, player rail, family chrome, vite.config, AUTH_URL, stripe, Cleaning flip
MANIFEST

cat > "$STAGE/PLATES_API_SHA" <<MARKER
main_sha=$MAIN_SHA
stamp=$STAMP
cutover_scope=plates-api-routes-only
keep=postgres,uploads,FAMILY_V1_SHA,family-v1-home,family/operator,family/signals
MARKER

# Members must be path-prefixed without "./" so remote extract can name them.
tar -C "$STAGE" -czf "$TMP_TAR" \
  src/app/api/plates/route.ts \
  src/app/api/plates/approve/route.ts \
  src/app/api/plates/reject/route.ts \
  src/lib/plates/rules.ts \
  src/lib/plates/sql.ts \
  src/lib/plates/store.ts \
  db/0012_plate_renders.sql \
  MANIFEST.txt \
  PLATES_API_SHA
PACK_SHA="$(sha256sum "$TMP_TAR" | awk '{print $1}')"
echo "$PACK_SHA  plates-api-campus-pack-$STAMP.tar.gz" > "$STAGE.sha256"
echo "==> pack $TMP_TAR sha256=$PACK_SHA"

"${SSH[@]}" "$VPS_HOST" "mkdir -p '$PACK_DIR' && test -f '$REMOTE_DIR/FAMILY_V1_SHA'"
REMOTE_PACK="$PACK_DIR/plates-api-campus-pack-$STAMP.tar.gz"
"${SCP[@]}" "$TMP_TAR" "$VPS_HOST:$REMOTE_PACK"
"${SCP[@]}" "$STAGE.sha256" "$VPS_HOST:$PACK_DIR/plates-api-campus-pack-$STAMP.sha256"

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
if tar -tzf "\$PACK" | grep -E '(^|/)(family-v1-home|src/routes/|vite.config)'; then
  echo "Refusing pack: family or TanStack paths present" >&2
  exit 1
fi
mkdir -p "\$REMOTE_DIR/src/app/api/plates/approve" "\$REMOTE_DIR/src/app/api/plates/reject" "\$REMOTE_DIR/src/lib/plates" "\$REMOTE_DIR/db"
tar -xzf "\$PACK" -C "\$REMOTE_DIR"

if ! grep -q 'export const plateRenders' "\$REMOTE_DIR/src/lib/db/schema.ts"; then
  cat >> "\$REMOTE_DIR/src/lib/db/schema.ts" <<'SCHEMA'

export const plateRenders = pgTable(
  "plate_renders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    composition: text("composition").notNull(),
    dest: text("dest").notNull(),
    sha256: text("sha256").notNull().default(""),
    status: text("status").notNull().default("pending"),
    checklistVerdict: text("checklist_verdict").notNull().default(""),
    holdCleaning: boolean("hold_cleaning").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [index("plate_renders_org_status_idx").on(t.orgId, t.status, t.createdAt)],
);
SCHEMA
  echo "appended plateRenders to live schema.ts"
else
  echo "live schema.ts already has plateRenders"
fi

FAM_HOME2=\$(sha256sum "\$REMOTE_DIR/src/components/family-v1-home.tsx" | awk '{print \$1}')
FAM_OP2=\$(sha256sum "\$REMOTE_DIR/src/lib/family/operator.ts" | awk '{print \$1}')
FAM_SIG2=\$(sha256sum "\$REMOTE_DIR/src/lib/family/signals.ts" | awk '{print \$1}')
FAM_SHA2=\$(sha256sum "\$REMOTE_DIR/FAMILY_V1_SHA" | awk '{print \$1}')
if [ "\$FAM_HOME" != "\$FAM_HOME2" ] || [ "\$FAM_OP" != "\$FAM_OP2" ] || [ "\$FAM_SIG" != "\$FAM_SIG2" ] || [ "\$FAM_SHA" != "\$FAM_SHA2" ]; then
  echo "Family chrome hash changed — aborting rebuild" >&2
  exit 1
fi

if ! docker exec field-school-campus-db psql -U campus -d campus -tAc "SELECT to_regclass('public.plate_renders')" | grep -q plate_renders; then
  echo "plate_renders missing — applying 0012 only"
  docker exec -i field-school-campus-db psql -U campus -d campus < "\$REMOTE_DIR/db/0012_plate_renders.sql"
else
  echo "plate_renders present — skip migrate"
fi

cd "\$REMOTE_DIR/deploy"
docker compose --env-file "\$ENV_FILE" up -d --build --no-deps app
docker compose --env-file "\$ENV_FILE" ps
REMOTE

echo "pack=$REMOTE_PACK"
echo "sha256=$PACK_SHA"
echo "Campus overlay: field-school-app rebuild only. Family chrome kept."
