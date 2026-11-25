#!/usr/bin/env bash
# CI gate 6: the committed generated schema must equal a fresh pull of the migrated database.
# Usage: scripts/check-schema-sync.sh [committed-dir]   (default: src/server/db/generated)
# Needs DATABASE_OWNER_URL pointing at a database migrated with `pnpm db:migrate`.
set -euo pipefail
committed="${1:-src/server/db/generated}"
fresh="$(mktemp -d)"
trap 'rm -rf "$fresh"' EXIT
scripts/db-pull.sh "$fresh"
if ! diff -ru "$committed" "$fresh"; then
  echo "Generated schema is stale: run 'pnpm db:migrate && pnpm db:pull' and commit the result." >&2
  exit 1
fi
echo "Generated schema is in sync."
