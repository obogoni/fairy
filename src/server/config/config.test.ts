import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './config.js';

const valid = {
  DATABASE_URL: 'postgres://fairy_app:pw@localhost:5432/fairy',
  DEMO_TENANT_ID: '01937b2e-0000-7000-8000-000000000001',
};

function errorOf(env: Record<string, string | undefined>): ConfigError {
  try {
    loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) {
      return error;
    }
    throw error;
  }
  throw new Error('loadConfig accepted an invalid environment');
}

describe('config', () => {
  it('loadConfig accepts a valid environment', () => {
    expect(loadConfig(valid)).toMatchObject({ ...valid, PORT: 3000, APP_ENV: 'local' });
  });

  it('loadConfig names a missing DATABASE_URL', () => {
    const error = errorOf({ DEMO_TENANT_ID: valid.DEMO_TENANT_ID });
    expect(error.message).toContain('DATABASE_URL');
    expect(error.message).not.toContain('DEMO_TENANT_ID');
  });

  it('loadConfig names a malformed DEMO_TENANT_ID without its value', () => {
    const error = errorOf({ ...valid, DEMO_TENANT_ID: 'nao-e-uuid-xyz' });
    expect(error.message).toContain('DEMO_TENANT_ID');
    expect(error.message).not.toContain('nao-e-uuid-xyz');
  });

  it('loadConfig never prints a malformed DATABASE_URL', () => {
    const error = errorOf({ ...valid, DATABASE_URL: 'mysql://user:segredo@host/db' });
    expect(error.message).toContain('DATABASE_URL');
    expect(error.message).not.toContain('segredo');
  });
});
