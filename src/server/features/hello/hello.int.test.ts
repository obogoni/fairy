import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { seedDemo } from '../../db/demo-seed.js';
import {
  createTestApp,
  type TestApp,
  UNREACHABLE_DATABASE_URL,
} from '../../test-support/test-app.js';

const db = inject('db');

describe('hello', () => {
  const demoTenant = randomUUID();
  const otherTenant = randomUUID();
  let testApp: TestApp;

  beforeAll(async () => {
    // The other tenant is seeded first, so a query that ignored the tenant would likely find it.
    await seedDemo(db.ownerUrl, otherTenant, 'Outro tenant');
    await seedDemo(db.ownerUrl, demoTenant);
    testApp = await createTestApp({ DATABASE_URL: db.appUrl, DEMO_TENANT_ID: demoTenant });
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('GET /hello returns the demo greeting with no-store', async () => {
    const response = await request(testApp.app.getHttpServer()).get('/hello');
    expect(response.status).toBe(200);
    expect(response.text).toBe('{"message":"Olá do banco de dados!"}');
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it("GET /hello returns only the demo tenant's greeting", async () => {
    const asOther = await createTestApp({ DATABASE_URL: db.appUrl, DEMO_TENANT_ID: otherTenant });
    try {
      const demo = await request(testApp.app.getHttpServer()).get('/hello');
      const other = await request(asOther.app.getHttpServer()).get('/hello');
      expect(demo.body).toEqual({ message: 'Olá do banco de dados!' });
      expect(other.body).toEqual({ message: 'Outro tenant' });
    } finally {
      await asOther.close();
    }
  });

  it('GET /hello answers 503 service_unavailable when the database is down', async () => {
    const down = await createTestApp({
      DATABASE_URL: UNREACHABLE_DATABASE_URL,
      DEMO_TENANT_ID: demoTenant,
    });
    try {
      const response = await request(down.app.getHttpServer()).get('/hello');
      expect(response.status).toBe(503);
      expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
      expect(response.body).toEqual({
        type: 'service_unavailable',
        title: 'Service unavailable',
        status: 503,
      });
    } finally {
      await down.close();
    }
  });
});
