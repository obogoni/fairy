import { z } from 'zod';

/** Stable problem codes (RFC 9457 `type`). Clients branch on these, never on `title`. */
export const problemTypes = [
  'validation_error',
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
