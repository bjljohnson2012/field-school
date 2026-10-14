#!/bin/bash
# M13 Payload spike. Local disposable databases only. Never production.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .secrets evidence

if [[ ! -s .secrets/payload-secret ]]; then
  openssl rand -hex 32 > .secrets/payload-secret
  chmod 600 .secrets/payload-secret
fi
if [[ ! -s .secrets/operator-password ]]; then
  openssl rand -hex 18 > .secrets/operator-password
  chmod 600 .secrets/operator-password
fi

export PAYLOAD_SECRET
PAYLOAD_SECRET="$(< .secrets/payload-secret)"
export SPIKE_OPERATOR_PASSWORD
SPIKE_OPERATOR_PASSWORD="$(< .secrets/operator-password)"
export NODE_ENV=development
SOCKET="host=/var/run/postgresql"
SPIKE_URL="postgresql://ubuntu@/fs_payload_spike?${SOCKET}"
B_URL="postgresql://ubuntu@/fs_payload_b?${SOCKET}"
COLLIDE_URL="postgresql://ubuntu@/fs_payload_collide?${SOCKET}"

db_name="$(psql "$SPIKE_URL" -At -c "SELECT current_database()")"
if [[ "$db_name" != "fs_payload_spike" ]]; then
  echo "refusing database" >&2
  exit 1
fi

psql "$SPIKE_URL" -v ON_ERROR_STOP=1 -q -f local/seed.sql
psql "$SPIKE_URL" -At -c "SELECT current_setting('wal_level')" > evidence/wal-level.txt

echo "clone drizzle copy before Payload push"
dropdb --if-exists fs_payload_collide
createdb fs_payload_collide
pg_dump --no-owner --no-acl fs_payload_spike | psql -q -d fs_payload_collide
psql -d fs_payload_collide -c "\d public.courses" > evidence/courses-before.txt

echo "crud on separate schema"
export SPIKE_DATABASE_URL="$SPIKE_URL"
export SPIKE_SCHEMA=payload
export SPIKE_TABLE_PREFIX=m13_
export SPIKE_PUSH=true
node --import tsx src/run-crud.ts > evidence/crud.log

echo "same-schema name collision"
set +e
timeout 40 node --import tsx src/run-init.ts src/payload.collide.config.ts > evidence/collide.log 2>&1
echo $? > evidence/collide.exit
set -e

echo "public push false then true on clone"
export SPIKE_DATABASE_URL="$COLLIDE_URL"
export SPIKE_PUSH=false
set +e
timeout 40 node --import tsx src/run-init.ts src/payload.public-push.config.ts > evidence/public-push-false.log 2>&1
echo $? > evidence/public-push-false.exit
set -e
export SPIKE_PUSH=true
set +e
timeout 40 node --import tsx src/run-init.ts src/payload.public-push.config.ts > evidence/public-push-true.log 2>&1
echo $? > evidence/public-push-true.exit
set -e
psql -d fs_payload_collide -c "\d public.courses" > evidence/courses-after.txt
psql -d fs_payload_collide -At -c "SELECT table_schema||'.'||table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'payload%' OR table_name LIKE '%courses%' ORDER BY 1" > evidence/collide-tables.txt

echo "etl into second database"
dropdb --if-exists fs_payload_b
createdb fs_payload_b
export SPIKE_DATABASE_URL="$B_URL"
export SPIKE_SCHEMA=public
export SPIKE_TABLE_PREFIX=
export SPIKE_PUSH=true
node --import tsx src/run-etl.ts > evidence/etl.log

echo "peer dependency against campus Next 16.3.2"
PEER=/tmp/m13-peer-check
rm -rf "$PEER"
mkdir -p "$PEER"
cat > "$PEER/package.json" <<'JSON'
{
  "name": "m13-peer-check",
  "private": true,
  "dependencies": { "next": "16.3.2", "react": "19.2.8", "react-dom": "19.2.8" }
}
JSON
set +e
npm install --prefix "$PEER" --ignore-scripts --no-audit --no-fund > evidence/peer-next.log 2>&1
npm install --prefix "$PEER" --ignore-scripts --no-audit --no-fund @payloadcms/next@3.90.2 payload@3.90.2 >> evidence/peer-next.log 2>&1
echo $? > evidence/peer-next.exit
set -e

echo "spike done"
