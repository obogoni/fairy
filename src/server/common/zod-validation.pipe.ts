import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { ProblemException } from './problem.exception.js';

/** Validates with a shared Zod schema. Errors carry paths and codes, never the rejected values. */
export class ZodValidationPipe<S extends z.ZodType> implements PipeTransform<unknown, z.infer<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.infer<S> {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }
    throw new ProblemException(
      400,
      'validation_error',
      'Request validation failed',
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), code: issue.code })),
    );
  }
}
