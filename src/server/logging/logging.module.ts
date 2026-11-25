import { randomUUID } from 'node:crypto';
import type { DynamicModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { DestinationStream } from 'pino';
import { type Options, pinoHttp } from 'pino-http';
import type { AppConfig } from '../config/config.js';
import { requestLine } from './request-line.js';

/** pino-http options shared by the request middleware and nestjs-pino (logging.md). */
function httpLoggerOptions(config: AppConfig): Options {
  return {
    level: config.LOG_LEVEL,
    // A fresh id per request; an incoming X-Request-Id is never trusted or logged.
    genReqId: (_req, res) => {
      const id = randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customAttributeKeys: { reqId: 'reqId' },
    quietReqLogger: true,
    // pino-http would log the whole request and response (headers, raw URL): drop them and keep
    // only the request line built below.
    wrapSerializers: false,
    serializers: { req: () => undefined, res: () => undefined, err: () => undefined },
    customSuccessMessage: () => 'request.completed',
    customErrorMessage: () => 'request.completed',
    customSuccessObject: (req, res, value: { responseTime: number }) =>
      requestLine(req, res, value.responseTime),
    customErrorObject: (req, res, _error, value: { responseTime: number }) =>
      requestLine(req, res, value.responseTime),
    // Second guard: nothing above logs headers, but if anything ever does, these never leave.
    redact: {
      paths: ['*.headers.cookie', '*.headers.authorization', '*.headers["set-cookie"]'],
      remove: true,
    },
  };
}

/**
 * The request middleware. Mounted first in configureApp, before static files, so every request
 * writes exactly one line, assets included.
 */
export function httpLogger(config: AppConfig, destination?: DestinationStream) {
  return pinoHttp(httpLoggerOptions(config), destination ?? process.stdout);
}

/** Nest's logger, reusing the middleware above instead of mounting a second one. */
export function loggingModule(config: AppConfig, destination?: DestinationStream): DynamicModule {
  return LoggerModule.forRoot({
    pinoHttp: [httpLoggerOptions(config), destination ?? process.stdout],
    useExisting: true,
  });
}
