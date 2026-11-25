/**
 * Error inspection that never logs or returns messages: messages from Drizzle and Postgres repeat
 * query parameters and row values, which can be patient data (D4, logging.md). The one message
 * read is pg-pool's fixed connect-timeout text, compared for equality and never copied.
 */

const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'EHOSTUNREACH',
]);

const POOL_CONNECT_TIMEOUT = 'timeout exceeded when trying to connect';

type ErrorLike = Record<string, unknown>;

function isObject(value: unknown): value is ErrorLike {
  return typeof value === 'object' && value !== null;
}

/** The error and everything it wraps: `cause` chains and `AggregateError.errors`. */
function* chain(error: unknown, depth = 0): Generator<ErrorLike> {
  if (!isObject(error) || depth > 10) {
    return;
  }
  yield error;
  yield* chain(error.cause, depth + 1);
  if (Array.isArray(error.errors)) {
    for (const inner of error.errors) {
      yield* chain(inner, depth + 1);
    }
  }
}

function isSqlState(code: unknown): code is string {
  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code);
}

/** True when the database could not be reached, as opposed to a query that failed. */
export function isDatabaseUnavailable(error: unknown): boolean {
  for (const link of chain(error)) {
    const code = link.code;
    if (typeof code === 'string' && CONNECTION_ERROR_CODES.has(code)) {
      return true;
    }
    if (isSqlState(code) && (code.startsWith('08') || code === '57P01' || code === '57P03')) {
      return true;
    }
    if (link.message === POOL_CONNECT_TIMEOUT) {
      return true;
    }
  }
  return false;
}

export interface SerializedError {
  class: string;
  causeClass?: string;
  code?: string;
  constraint?: string;
  table?: string;
  stack?: string[];
}

/** The constructor's name: some libraries (Drizzle) leave `name` as the generic 'Error'. */
function className(error: ErrorLike): string {
  const constructorName = (error as { constructor?: { name?: unknown } }).constructor?.name;
  if (typeof constructorName === 'string' && constructorName !== 'Object') {
    return constructorName;
  }
  return typeof error.name === 'string' ? error.name : 'Unknown';
}

/** Stack frames only: the first line of a stack repeats the message, so it is dropped. */
function frames(stack: unknown): string[] | undefined {
  if (typeof stack !== 'string') {
    return undefined;
  }
  const lines = stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '));
  return lines.length > 0 ? lines : undefined;
}

/**
 * The only shape in which an error is logged: class, Postgres code, constraint and table, and
 * stack frames. Never `message`, `detail`, `query` or `params`.
 */
export function serializeError(error: unknown): SerializedError {
  if (!isObject(error)) {
    return { class: typeof error };
  }
  const out: SerializedError = { class: className(error) };
  const stack = frames(error.stack);
  if (stack) {
    out.stack = stack;
  }
  for (const link of chain(error)) {
    if (link === error) {
      continue;
    }
    out.causeClass ??= className(link);
    if (isSqlState(link.code)) {
      out.code = link.code;
      if (typeof link.constraint === 'string') {
        out.constraint = link.constraint;
      }
      if (typeof link.table === 'string') {
        out.table = link.table;
      }
      break;
    }
  }
  if (out.code === undefined && isSqlState(error.code)) {
    out.code = error.code;
    if (typeof error.constraint === 'string') {
      out.constraint = error.constraint;
    }
    if (typeof error.table === 'string') {
      out.table = error.table;
    }
  }
  return out;
}
