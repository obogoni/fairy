/** `pnpm db:seed`: seeds the hello-world's demo tenant (src/server/db/demo-seed.ts). */
import { existsSync } from 'node:fs';
import { seedDemo } from '../src/server/db/demo-seed.ts';

if (existsSync('.env')) {
  // Variables already in the environment win over the file.
  process.loadEnvFile('.env');
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    process.stderr.write(`Missing environment variable: ${name}\n`);
    process.exit(1);
  }
  return value;
}

await seedDemo(requireEnv('DATABASE_OWNER_URL'), requireEnv('DEMO_TENANT_ID'));
process.stdout.write('Demo tenant seeded.\n');
