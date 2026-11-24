#!/usr/bin/env bash
# Proves the lint rule behind logging.md: a console call in server code fails ESLint.
set -euo pipefail
probe="src/server/__no_console_probe__.ts"
trap 'rm -f "$probe"' EXIT
printf "export function probe(): void {\n  console.log('patient data');\n}\n" > "$probe"
if output="$(pnpm exec eslint "$probe" 2>&1)"; then
  echo "ESLint accepted a console call in server code" >&2
  exit 1
fi
if ! grep -q "no-console" <<< "$output"; then
  echo "ESLint failed, but not on no-console:" >&2
  echo "$output" >&2
  exit 1
fi
echo "no-console rejects console calls in server code."
