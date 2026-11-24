import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, inject, it } from 'vitest';
import { createTestApp, UNREACHABLE_DATABASE_URL } from '../../test-support/test-app.js';

const db = inject('db');

describe('health', () => {
  it('GET /health/live is ok without the database', async () => {
    const down = await createTestApp({
      DATABASE_URL: UNREACHABLE_DATABASE_URL,
      DEMO_TENANT_ID: randomUUID(),
    });
    try {
      const response = await request(down.app.getHttpServer()).get('/health/live');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    } finally {
      await down.close();
    }
  });

  it('GET /health/ready is ok when select 1 succeeds', async () => {
    const up = await createTestApp({ DATABASE_URL: db.appUrl, DEMO_TENANT_ID: randomUUID() });
    try {
      const response = await request(up.app.getHttpServer()).get('/health/ready');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    } finally {
      await up.close();
    }
  });

  it('GET /health/ready is 503 unavailable when the database is down', async () => {
    const down = await createTestApp({
      DATABASE_URL: UNREACHABLE_DATABASE_URL,
      DEMO_TENANT_ID: randomUUID(),
    });
    try {
      const response = await request(down.app.getHttpServer()).get('/health/ready');
      expect(response.status).toBe(503);
      expect(response.body).toEqual({ status: 'unavailable' });
    } finally {
      await down.close();
    }
  });
});
