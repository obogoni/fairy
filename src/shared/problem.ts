import { z } from 'zod';

/**
 * Stable problem codes (RFC 9457 `type`). Clients branch on these, never on `title`.
 * `validation_error` is a 400: the request's content is invalid. `bad_request` is any other 4xx
 * Fairy doesn't handle on purpose, such as a body over the size limit (413).
 */
export const problemTypes = [
  'validation_error',
  'bad_request',
  'not_found',
  'service_unavailable',
  'internal_error',
] as const;

export type ProblemType = (typeof problemTypes)[number];

export const problemSchema = z.object({
  type: z.enum(problemTypes),
  title: z.string(),
  status: z.number().int(),
  errors: z.array(z.object({ path: z.string(), code: z.string() })).optional(),
});

export type Problem = z.infer<typeof problemSchema>;
