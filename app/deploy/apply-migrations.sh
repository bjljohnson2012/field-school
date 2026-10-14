#!/bin/bash
# Apply pending app/db/*.sql files in filename order.
# Records each file in schema_migrations. Skips filenames already recorded.
# A second run on the same database applies nothing.
#
# Usage:
#   apply-migrations.sh DB_DIR -- psql [psql args...]
# The psql command reads SQL on stdin. For campus deploys that is
#   docker exec -i field-school-campus-db psql -U campus -d campus
set -euo pipefail

if [ $# -lt 3 ] || [ "$2" != "--" ]; then
  echo "usage: apply-migrations.sh DB_DIR -- psql [args...]" >&2
  exit 2
fi

DB_DIR="$1"
shift 2
PSQL=("$@")

if [ ! -d "$DB_DIR" ]; then
  echo "migration dir missing: $DB_DIR" >&2
  exit 1
fi

need_stop=1
need_quiet=1
need_x=1
for arg in "${PSQL[@]}"; do
  case "$arg" in
    ON_ERROR_STOP=1) need_stop=0 ;;
    -q|--quiet) need_quiet=0 ;;
    -X|--no-psqlrc) need_x=0 ;;
  esac
done
if [ "$need_x" -eq 1 ]; then PSQL+=(-X); fi
if [ "$need_quiet" -eq 1 ]; then PSQL+=(-q); fi
if [ "$need_stop" -eq 1 ]; then PSQL+=(-v ON_ERROR_STOP=1); fi

mapfile -t FILES < <(find "$DB_DIR" -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | LC_ALL=C sort)
if [ "${#FILES[@]}" -eq 0 ]; then
  echo "no sql files in $DB_DIR" >&2
  exit 1
fi

WORK="$(mktemp)"
LOG="$(mktemp)"
trap 'rm -f "$WORK" "$LOG"' EXIT

{
  cat <<'SQL'
SET client_min_messages TO warning;
SELECT pg_advisory_lock(hashtext('field_school_schema_migrations')::bigint) AS migration_lock \gset
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL
  for name in "${FILES[@]}"; do
    if [[ ! "$name" =~ ^[0-9]{4}_[a-z0-9_]+\.sql$ ]]; then
      echo "unexpected migration filename: $name" >&2
      exit 1
    fi
    printf "SELECT CASE WHEN EXISTS (SELECT 1 FROM schema_migrations WHERE filename = '%s') THEN 1 ELSE 0 END AS already_applied \\gset\n" "$name"
    printf '\\if :already_applied\n'
    printf '\\echo migrate skip %s\n' "$name"
    printf '\\else\n'
    printf '\\echo migrate apply %s\n' "$name"
    printf 'BEGIN;\n'
    printf 'SET LOCAL client_min_messages TO warning;\n'
    cat "$DB_DIR/$name"
    printf '\nINSERT INTO schema_migrations (filename) VALUES ('"'"'%s'"'"');\n' "$name"
    printf 'COMMIT;\n'
    printf '\\endif\n'
  done
} > "$WORK"

set -o pipefail
"${PSQL[@]}" < "$WORK" | tee "$LOG"
applied="$(grep -c '^migrate apply ' "$LOG" || true)"
skipped="$(grep -c '^migrate skip ' "$LOG" || true)"
echo "migrations applied=${applied} skipped=${skipped}"
