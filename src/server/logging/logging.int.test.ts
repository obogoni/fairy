import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { seedDemo } from '../db/demo-seed.js';
import { CanaryController } from '../test-support/canary.controller.js';
import { createTestApp, type TestApp } from '../test-support/test-app.js';

const db = inject('db');

const CANARIES = {
  name: 'Paciente Canário Zé',
  phone: '+55 11 98888-7777',
  email: 'canario@example.com',
  cookie: 'sid=canario-secret',
};

/** Every form a canary could take in a log: as is, URL-encoded, and its distinctive pieces. */
const NEEDLES = Object.values(CANARIES).flatMap((value) => [
  value,
  encodeURIComponent(value),
  ...value.split(/[\s=@+]/).filter((part) => part.length >= 5),
]);

describe('logging', () => {
  const tenant = randomUUID();
  let testApp: TestApp;

  beforeAll(async () => {
    await seedDemo(db.ownerUrl, tenant);
    testApp = await createTestApp({ DATABASE_URL: db.appUrl, DEMO_TENANT_ID: tenant }, [
      CanaryController,
    ]);
  });

  afterAll(async () => {
    await testApp.close();
  });

  let before = 0;
  beforeEach(() => {
    before = testApp.logs().length;
  });
  const newLogs = () => testApp.logs().slice(before);

  it('logging: one request line of chosen fields per request', async () => {
    const response = await request(testApp.app.getHttpServer()).get('/hello?nome=Maria');
    expect(response.status).toBe(200);

    const requestLines = newLogs().filter((line) => line.msg === 'request.completed');
    expect(requestLines).toHaveLength(1);
    const line = requestLines[0] ?? {};
    expect(line).toMatchObject({ method: 'GET', route: '/hello', status: 200 });
    expect(typeof line.ms).toBe('number');
    expect(line.reqId).toBe(response.headers['x-request-id']);
    expect(Object.keys(line).sort()).toEqual(
      [
        'hostname',
        'level',
        'method',
        'ms',
        'msg',
        'pid',
        'reqId',
        'route',
        'status',
        'time',
      ].sort(),
    );
    expect(JSON.stringify(newLogs())).not.toContain('Maria');
  });

  it('logging: no canary reaches the logs', async () => {
    const server = testApp.app.getHttpServer();
    const query = `?nome=${encodeURIComponent(CANARIES.name)}&tel=${encodeURIComponent(CANARIES.phone)}`;
    const send = (path: string, body: object) =>
      request(server)
        .post(`${path}${query}`)
        .set('Cookie', CANARIES.cookie)
        .set('X-Paciente', `${CANARIES.name}; ${CANARIES.email}`)
        .send(body);
    const patient = { name: CANARIES.name, phone: CANARIES.phone, email: CANARIES.email };

    expect((await send('/test/patients', patient)).status).toBe(201);
    expect((await send('/test/patients', { ...patient, email: CANARIES.name })).status).toBe(400);
    const unique = await send('/test/duplicate', { name: CANARIES.name });
    expect(unique.status).toBe(500);
    const check = await send('/test/too-long', { name: CANARIES.name });
    expect(check.status).toBe(500);

    const logged = testApp.rawLogs();
    expect(logged).toContain('"code":"23505"');
    expect(logged).toContain('"code":"23514"');
    for (const needle of NEEDLES) {
      expect(logged, `log contains ${needle}`).not.toContain(needle);
    }
  });

  it('logging: database errors keep only code, constraint and table', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post('/test/too-long')
      .send({ name: CANARIES.name });
    expect(response.status).toBe(500);

    const failures = newLogs().filter((line) => line.msg === 'request.failed');
    expect(failures).toHaveLength(1);
    const error = (failures[0]?.error ?? {}) as Record<string, unknown>;
    expect(error).toMatchObject({
      class: 'DrizzleQueryError',
      code: '23514',
      constraint: 'greetings_message_check',
      table: 'greetings',
    });
    for (const key of ['message', 'detail', 'query', 'params']) {
      expect(error).not.toHaveProperty(key);
    }
    expect(Object.keys(error).sort()).toEqual(
      ['causeClass', 'class', 'code', 'constraint', 'stack', 'table'].sort(),
    );
  });
});
