import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { type AppConfig, ConfigError, loadConfig } from './config/config.js';
import { configureApp } from './configure-app.js';

function readConfig(): AppConfig {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  try {
    return loadConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

async function bootstrap(): Promise<void> {
  const config = readConfig();
  const options = { config };
  const app = await NestFactory.create<NestExpressApplication>(AppModule.register(options), {
    bufferLogs: true,
    bodyParser: false,
  });
  configureApp(app, options);
  await app.listen(config.PORT);
}

void bootstrap();
