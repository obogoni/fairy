import { join, resolve } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import type { AppOptions } from './app.module.js';
import { httpLogger } from './logging/logging.module.js';

/** Everything main.ts and the test harness both apply to the app, so they can't drift. */
export function configureApp(
  app: NestExpressApplication,
  { config, logDestination }: AppOptions,
): void {
  // First, so every request writes one line, static files included.
  app.use(httpLogger(config, logDestination));
  app.useLogger(app.get(Logger));
  app.disable('x-powered-by');
  // JSON only: mutations accept application/json and nothing else (framework.md).
  app.useBodyParser('json', { limit: '100kb' });
  // Vite's hashed files never change, so they cache for a year. Registered before the routes.
  app.useStaticAssets(join(resolve(config.CLIENT_DIST), 'assets'), {
    prefix: '/assets/',
    index: false,
    fallthrough: false,
    immutable: true,
    maxAge: '365d',
  });
  app.enableShutdownHooks();
}
