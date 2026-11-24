import type { IncomingMessage, ServerResponse } from 'node:http';

interface RoutedRequest extends IncomingMessage {
  baseUrl?: string;
  originalUrl?: string;
  route?: { path?: unknown };
}

/** The route pattern, never the raw URL: a URL can carry data a person typed (D4). */
export function routePattern(req: RoutedRequest): string {
  const path = req.route?.path;
  if (typeof path === 'string') {
    return `${req.baseUrl ?? ''}${path}`;
  }
  if ((req.originalUrl ?? req.url ?? '').startsWith('/assets/')) {
    return '/assets/*';
  }
  return 'unmatched';
}

/** `reqId` is bound by pino-http on every line of the request, this one included. */
export interface RequestLine {
  method: string;
  route: string;
  status: number;
  ms: number;
  ip?: string;
}

/** The one line a request logs: only fields chosen here, never headers, bodies or URLs. */
export function requestLine(
  req: RoutedRequest,
  res: ServerResponse,
  responseTime: number,
): RequestLine {
  const line: RequestLine = {
    method: req.method ?? 'UNKNOWN',
    route: routePattern(req),
    status: res.statusCode,
    ms: Math.round(responseTime),
  };
  const ip = req.headers['cf-connecting-ip'];
  if (typeof ip === 'string') {
    line.ip = ip;
  }
  return line;
}
