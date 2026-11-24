#!/usr/bin/env bash
# CI gate 4: a migration that exists on the base branch is never modified, renamed or deleted
# (migrations-and-ids.md). dbmate tracks only the version number, so it can't catch this itself.
# Usage: scripts/check-migrations-untouched.sh <base-ref>   (CI passes origin/main)
set -euo pipefail
base="${1:?usage: $0 <base-ref>}"
changed="$(git diff --name-status --diff-filter=MDR "${base}...HEAD" -- db/migrations)"
if [[ -n "$changed" ]]; then
  echo "Existing migrations were modified or deleted; add a new migration instead:" >&2
  echo "$changed" >&2
  exit 1
fi
echo "Existing migrations are untouched."
