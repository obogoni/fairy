import type { Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module.js';
import type { AppConfig } from '../config/config.js';
import { configureApp } from '../configure-app.js';

export const UNREACHABLE_DATABASE_URL = 'postgres://fairy_app:x@127.0.0.1:1/none?sslmode=disable';

export interface TestApp {
  app: NestExpressApplication;
  /** Every log line the app wrote, parsed. */
  logs: () => Record<string, unknown>[];
  /** Every log line the app wrote, raw. */
  rawLogs: () => string;
  close: () => Promise<void>;
}

/** The same assembly as main.ts (AppModule.register + configureApp), with logs captured. */
export async function createTestApp(
  overrides: Partial<AppConfig> & Pick<AppConfig, 'DATABASE_URL' | 'DEMO_TENANT_ID'>,
  extraControllers: Type[] = [],
): Promise<TestApp> {
  const lines: string[] = [];
  const options = {
    config: {
      APP_ENV: 'test',
      PORT: 0,
      CLIENT_DIST: 'dist/client',
      LOG_LEVEL: 'info',
      ...overrides,
    } satisfies AppConfig,
    logDestination: { write: (line: string) => void lines.push(line) },
  };
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.register(options)],
    controllers: extraControllers,
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    bufferLogs: true,
  });
  configureApp(app, options);
  await app.init();
  return {
    app,
    logs: () => lines.map((line) => JSON.parse(line) as Record<string, unknown>),
    rawLogs: () => lines.join(''),
    close: () => app.close(),
  };
}
