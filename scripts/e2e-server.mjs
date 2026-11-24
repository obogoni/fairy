// Starts the built app for Playwright against a fresh, migrated and seeded database.
// Usage: node scripts/e2e-server.mjs <port>   (needs `pnpm build` and Postgres running)
import { execFileSync, spawn } from 'node:child_process';
import pg from 'pg';

const port = process.argv[2] ?? '3100';
const adminUrl =
  process.env.TEST_ADMIN_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';
const password = process.env.TEST_FAIRY_APP_PASSWORD ?? 'fairy_app_local';
const database = 'fairy_e2e';
const demoTenant = '01937b2e-0000-7000-8000-0000000000e2';

function urlFor(user, pass) {
  const url = new URL(adminUrl);
  url.username = user;
  url.password = pass;
  url.pathname = `/${database}`;
  url.searchParams.set('sslmode', 'disable');
  return url.toString();
}

const admin = new pg.Client({ connectionString: adminUrl });
await admin.connect();
await admin.query(`drop database if exists ${database} with (force)`);
await admin.query(`create database ${database}`);

const ownerUrl = urlFor(new URL(adminUrl).username, decodeURIComponent(new URL(adminUrl).password));
const env = { ...process.env, DATABASE_OWNER_URL: ownerUrl, DEMO_TENANT_ID: demoTenant };
execFileSync('pnpm', ['-s', 'db:migrate'], { env, stdio: 'inherit' });
await admin.query(`alter role fairy_app login password ${admin.escapeLiteral(password)}`);
await admin.end();
execFileSync('pnpm', ['-s', 'db:seed'], { env, stdio: 'inherit' });

const app = spawn('node', ['dist/server/main.js'], {
  env: {
    ...process.env,
    APP_ENV: 'test',
    PORT: port,
    DATABASE_URL: urlFor('fairy_app', password),
    DEMO_TENANT_ID: demoTenant,
    CLIENT_DIST: 'dist/client',
  },
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => app.kill(signal));
}
app.on('exit', (code) => process.exit(code ?? 0));
