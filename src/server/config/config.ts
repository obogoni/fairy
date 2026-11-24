import { z } from 'zod';

const configSchema = z.object({
  APP_ENV: z.enum(['local', 'test', 'production']).default('local'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DEMO_TENANT_ID: z.uuid(),
  CLIENT_DIST: z.string().min(1).default('dist/client'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type AppConfig = z.infer<typeof configSchema>;

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

/**
 * Validates the environment. The error names the variables that are missing or malformed and
 * never their values, which may be secrets.
 */
export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const result = configSchema.safeParse(env);
  if (result.success) {
    return result.data;
  }
  const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
  throw new ConfigError(`Missing or invalid environment variables: ${names.join(', ')}`);
}
