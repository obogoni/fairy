import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import type { Problem } from '../../shared/problem.js';
import { isDatabaseUnavailable, serializeError } from './errors.js';
import { ProblemException } from './problem.exception.js';

/** Renders every error as RFC 9457 problem details (framework.md, plan door 4). */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ProblemFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const problem = toProblem(exception);
    if (problem.status >= 500) {
      this.logger.error({ error: serializeError(exception) }, 'request.failed');
    }
    response
      .status(problem.status)
      .type('application/problem+json')
      .setHeader('Cache-Control', 'no-store')
      .send(JSON.stringify(problem));
  }
}

function isBodyParserError(exception: unknown): boolean {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    'type' in exception &&
    typeof exception.type === 'string' &&
    exception.type.startsWith('entity.')
  );
}

export function toProblem(exception: unknown): Problem {
  if (exception instanceof ProblemException) {
    return exception.toProblem();
  }
  if (isDatabaseUnavailable(exception)) {
    return { type: 'service_unavailable', title: 'Service unavailable', status: 503 };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status === 404) {
      return { type: 'not_found', title: 'Not found', status };
    }
    if (status >= 400 && status < 500) {
      return { type: 'validation_error', title: 'Invalid request', status };
    }
  }
  if (isBodyParserError(exception)) {
    return { type: 'validation_error', title: 'Invalid request body', status: 400 };
  }
  return { type: 'internal_error', title: 'Internal server error', status: 500 };
}
