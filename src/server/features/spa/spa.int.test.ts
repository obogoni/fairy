import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createTestApp,
  type TestApp,
  UNREACHABLE_DATABASE_URL,
} from '../../test-support/test-app.js';

describe('static files', () => {
  let clientDist: string;
  let testApp: TestApp;

  beforeAll(async () => {
    clientDist = mkdtempSync(join(tmpdir(), 'fairy-client-'));
    mkdirSync(join(clientDist, 'assets'));
    writeFileSync(join(clientDist, 'index.html'), '<!doctype html><title>Fairy</title>');
    writeFileSync(join(clientDist, 'assets', 'index-Ab12Cd34.js'), 'console.log(1)');
    testApp = await createTestApp({
      DATABASE_URL: UNREACHABLE_DATABASE_URL,
      DEMO_TENANT_ID: randomUUID(),
      CLIENT_DIST: clientDist,
    });
  });

  afterAll(async () => {
    await testApp.close();
    rmSync(clientDist, { recursive: true, force: true });
  });

  it('unknown GET paths fall back to index.html with no-cache', async () => {
    for (const path of ['/agenda/semana', '/']) {
      const response = await request(testApp.app.getHttpServer()).get(path);
      expect(response.status).toBe(200);
      expect(response.text).toBe('<!doctype html><title>Fairy</title>');
      expect(response.headers['cache-control']).toBe('no-cache');
    }
  });

  it('hashed assets are immutable for a year', async () => {
    const response = await request(testApp.app.getHttpServer()).get('/assets/index-Ab12Cd34.js');
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });
});
