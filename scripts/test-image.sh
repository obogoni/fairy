#!/usr/bin/env bash
# Proves the Docker image (server.md). Usage: scripts/test-image.sh serve|contents|bad-config
set -euo pipefail
mode="${1:?usage: $0 serve|contents|bad-config}"
image="fairy:test"
docker build --quiet --tag "$image" . >/dev/null

# Values that make the config valid; the database isn't needed for these checks.
env_args=(
  -e DATABASE_URL="postgres://fairy_app:x@127.0.0.1:1/none"
  -e DEMO_TENANT_ID="01937b2e-0000-7000-8000-000000000001"
)

case "$mode" in
  serve)
    name="fairy-test-$$"
    trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
    docker run -d --name "$name" -p 127.0.0.1::3000 "${env_args[@]}" "$image" >/dev/null
    port="$(docker port "$name" 3000/tcp | head -1 | cut -d: -f2)"
    for _ in $(seq 1 50); do
      curl -fsS "http://127.0.0.1:${port}/health/live" >/dev/null 2>&1 && break
      sleep 0.2
    done
    live="$(curl -fsS "http://127.0.0.1:${port}/health/live")"
    [[ "$live" == '{"status":"ok"}' ]] || { echo "health/live answered: $live" >&2; exit 1; }
    page="$(curl -fsS "http://127.0.0.1:${port}/")"
    grep -q '<div id="root"></div>' <<< "$page" || { echo "GET / did not return index.html" >&2; exit 1; }
    echo "Image serves /health/live and index.html."
    ;;
  contents)
    uid="$(docker run --rm --entrypoint id "$image" -u)"
    [[ "$uid" != "0" ]] || { echo "Image runs as root" >&2; exit 1; }
    for dev in vitest @playwright/test; do
      if docker run --rm --entrypoint test "$image" -e "node_modules/$dev"; then
        echo "Image contains dev dependency $dev" >&2
        exit 1
      fi
    done
    echo "Image runs as uid $uid and has no dev dependencies."
    ;;
  bad-config)
    set +e
    output="$(docker run --rm -e DATABASE_URL="postgres://fairy_app:x@127.0.0.1:1/none" \
      -e DEMO_TENANT_ID="nao-e-uuid-xyz" "$image" 2>&1)"
    status=$?
    set -e
    [[ $status -ne 0 ]] || { echo "App started with a malformed DEMO_TENANT_ID" >&2; exit 1; }
    grep -q DEMO_TENANT_ID <<< "$output" || { echo "Error does not name DEMO_TENANT_ID: $output" >&2; exit 1; }
    if grep -q nao-e-uuid-xyz <<< "$output"; then
      echo "Error prints the malformed value" >&2
      exit 1
    fi
    echo "App exits $status naming DEMO_TENANT_ID without its value."
    ;;
  *)
    echo "unknown mode: $mode" >&2
    exit 2
    ;;
esac
