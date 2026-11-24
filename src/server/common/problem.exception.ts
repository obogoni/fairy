import type { Problem, ProblemType } from '../../shared/problem.js';

/** Thrown by our code for an expected failure; the global filter renders it as is. */
export class ProblemException extends Error {
  override readonly name = 'ProblemException';

  constructor(
    readonly status: number,
    readonly type: ProblemType,
    readonly title: string,
    readonly errors?: Problem['errors'],
  ) {
    super(title);
  }

  toProblem(): Problem {
    return this.errors === undefined
      ? { type: this.type, title: this.title, status: this.status }
      : { type: this.type, title: this.title, status: this.status, errors: this.errors };
  }
}
