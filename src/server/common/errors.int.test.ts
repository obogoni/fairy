import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { CanaryController } from '../test-support/canary.controller.js';
import { createTestApp, type TestApp } from '../test-support/test-app.js';

const db = inject('db');

describe('errors', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({ DATABASE_URL: db.appUrl, DEMO_TENANT_ID: randomUUID() }, [
      CanaryController,
    ]);
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('errors: unexpected errors answer 500 internal_error without details', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post('/test/boom')
      .send({ name: 'Paciente Canário Zé' });
    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toEqual({
      type: 'internal_error',
      title: 'Internal server error',
      status: 500,
    });
    expect(response.text).not.toContain('Canário');
    expect(response.text).not.toContain('unexpected failure');
    expect(response.text).not.toContain(' at ');
  });

  it('errors: validation errors list paths and codes without values', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post('/test/patients')
      .send({ name: 'Paciente Canário Zé', phone: '+55 11 98888-7777', email: 'nao-e-email-zzz' });
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toEqual({
      type: 'validation_error',
      title: 'Request validation failed',
      status: 400,
      errors: [{ path: 'email', code: 'invalid_format' }],
    });
    expect(response.text).not.toContain('nao-e-email-zzz');
    expect(response.text).not.toContain('Canário');
  });

  it('errors: unknown routes answer 404 not_found', async () => {
    const response = await request(testApp.app.getHttpServer()).post('/nao-existe').send({});
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toEqual({ type: 'not_found', title: 'Not found', status: 404 });
  });
});
