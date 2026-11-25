import { type HelloResponse, helloResponseSchema } from '../../../shared/hello.js';

export async function fetchHello(): Promise<HelloResponse> {
  const response = await fetch('/hello', { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`GET /hello failed with ${String(response.status)}`);
  }
  return helloResponseSchema.parse(await response.json());
}
