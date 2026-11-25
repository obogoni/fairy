#!/usr/bin/env bash
# CI gate 4: a migration that exists on the base branch is never modified, renamed, deleted or
# changed in type, and every migration this branch adds is numbered above the highest on the base.
# dbmate records only the number: two branches that both add 0002 would leave one never applied.
# (migrations-and-ids.md). dbmate tracks only the version number, so it can't catch this itself.
# Usage: scripts/check-migrations-untouched.sh <base-ref>   (CI passes origin/main)
set -euo pipefail
base="${1:?usage: $0 <base-ref>}"
changed="$(git diff --name-status --diff-filter=a "${base}...HEAD" -- db/migrations)"
if [[ -n "$changed" ]]; then
  echo "Existing migrations were modified or deleted; add a new migration instead:" >&2
  echo "$changed" >&2
  exit 1
fi
highest_on_base="$(git ls-tree --name-only "${base}" db/migrations/ | sed -n 's|^db/migrations/\([0-9]*\)_.*|\1|p' | sort -n | tail -1)"
highest_on_base="${highest_on_base:-0}"
too_low=""
while IFS= read -r added; do
  [[ -z "$added" ]] && continue
  number="$(basename "$added" | sed -n 's|^\([0-9]*\)_.*|\1|p')"
  if [[ -z "$number" ]] || (( 10#$number <= 10#$highest_on_base )); then
    too_low+="${added}"$'\n'
  fi
done < <(git diff --name-only --diff-filter=A "${base}...HEAD" -- db/migrations)
if [[ -n "$too_low" ]]; then
  echo "New migrations must be numbered above ${highest_on_base}, the highest on ${base}; rebase and renumber:" >&2
  printf '%s' "$too_low" >&2
  exit 1
fi
echo "Existing migrations are untouched, and new ones are numbered above ${highest_on_base}."
