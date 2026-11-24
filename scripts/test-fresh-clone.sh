#!/usr/bin/env bash
# Proves the README path from a fresh clone of HEAD: compose Postgres, migrate, seed, `pnpm dev`,
# and a browser sees the greeting. Its database runs on a free port so it can't touch yours.
set -euo pipefail
repo="$(git rev-parse --show-toplevel)"
work="$(mktemp -d)"
dev_pid=""
export COMPOSE_PROJECT_NAME="fairy-fresh-$$"
POSTGRES_PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')"
export POSTGRES_PORT

cleanup() {
  [[ -n "$dev_pid" ]] && kill -- "-$dev_pid" 2>/dev/null || true
  (cd "$work/fairy" 2>/dev/null && docker compose down -v >/dev/null 2>&1) || true
  rm -rf "$work"
}
trap cleanup EXIT

for port in 3000 5173; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    echo "Port $port is busy; stop what runs there first." >&2
    exit 1
  fi
done

git clone --quiet "$repo" "$work/fairy"
cd "$work/fairy"
cp .env.example .env
sed -i "s/localhost:5432/localhost:${POSTGRES_PORT}/g" .env

pnpm install --frozen-lockfile --silent
docker compose up -d --wait db >/dev/null
pnpm -s db:migrate
pnpm -s db:seed

setsid pnpm dev >"$work/dev.log" 2>&1 &
dev_pid=$!

node --input-type=module -e "
  import { chromium } from '@playwright/test';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (let attempt = 0; attempt < 60; attempt++) {
    try { await page.goto('http://localhost:5173/'); break; }
    catch { await new Promise((r) => setTimeout(r, 1000)); }
  }
  await page.getByText('Olá do banco de dados!').waitFor({ timeout: 60000 });
  await browser.close();
  console.log('Fresh clone shows the greeting.');
" || { echo '--- pnpm dev output ---' >&2; cat "$work/dev.log" >&2; exit 1; }
