import { type DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import type { DestinationStream } from 'pino';
import { NoStoreInterceptor } from './common/no-store.interceptor.js';
import { ProblemFilter } from './common/problem.filter.js';
import type { AppConfig } from './config/config.js';
import { DbModule } from './db/db.module.js';
import { HealthModule } from './features/health/health.module.js';
import { HelloModule } from './features/hello/hello.module.js';
import { SpaModule } from './features/spa/spa.module.js';
import { loggingModule } from './logging/logging.module.js';

export interface AppOptions {
  config: AppConfig;
  /** Where log lines go; tests capture them. Defaults to stdout. */
  logDestination?: DestinationStream;
}

@Module({})
export class AppModule {
  static register({ config, logDestination }: AppOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate: () => config }),
        loggingModule(config, logDestination),
        DbModule,
        HealthModule,
        HelloModule,
        // Last: its catch-all GET must not shadow any API route.
        SpaModule,
      ],
      providers: [
        { provide: APP_FILTER, useClass: ProblemFilter },
        { provide: APP_INTERCEPTOR, useClass: NoStoreInterceptor },
      ],
    };
  }
}
