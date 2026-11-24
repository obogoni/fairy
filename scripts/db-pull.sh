#!/usr/bin/env bash
# Regenerates the Drizzle schema from the migrated database (ADR 0003, database first).
# drizzle-kit pull also writes a randomly named SQL file and a snapshot; only schema.ts and
# relations.ts are kept, so the output is deterministic and the schema-sync gate can diff it.
# Usage: scripts/db-pull.sh [output-dir]   (default: src/server/db/generated)
set -euo pipefail
out="${1:-src/server/db/generated}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
DRIZZLE_OUT="$tmp" pnpm exec drizzle-kit pull --config drizzle.config.ts >/dev/null
mkdir -p "$out"
cp "$tmp/schema.ts" "$tmp/relations.ts" "$out/"
pnpm exec prettier --config .prettierrc.json --log-level warn --write "$out"
